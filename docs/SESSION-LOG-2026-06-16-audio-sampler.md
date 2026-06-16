# Session D — Tone.Sampler HQ + refonte presets audio (2026-06-16)

> Objectif : remplacer le moteur audio « MIDI-dégueu » par un sampler HQ sur
> de vrais samples de guitare, + préparer le mécanisme `audio_url` (Voie B).

---

## ⚠️ Mise au point sur l'état de départ

Le brief décrivait le point de départ comme « synthèse Tone.js (PluckSynth/
FMSynth) ». **En réalité le code était déjà en v5 (session 21) : WebAudioFont
GM presets** (samples FluidR3_GM). Ironie utile : FluidR3_GM **EST** le son
General MIDI — c'est littéralement ce que l'oreille entend comme « MIDI ». Donc
l'objectif du brief (passer à de vrais samples de guitare enregistrés) reste
parfaitement valable et constitue une vraie amélioration. J'ai juste adapté le
*depuis-quoi*.

---

## 🎵 Phase 1 — Sample pack choisi

**Pack retenu : `nbrosowsky/tonejs-instruments`** (déjà utilisé partiellement
en session 18).

- URL CDN : `https://nbrosowsky.github.io/tonejs-instruments/samples/`
- Format : MP3, multi-samplés (vrais enregistrements de guitare, pas du GM).
- Licence : samples libres distribués sur GitHub Pages, intégration
  `Tone.Sampler` native. OK pour usage.
- 3 packs guitare disponibles et utilisés :
  - `guitar-electric` (12 samples : E2→C6) → tous les presets électriques
  - `guitar-acoustic` (9 samples : E2→D5) → acoustique steel
  - `guitar-nylon` (8 samples : E2→E5) → nylon classique

Filenames vérifiés contre `Tonejs-Instruments.js` (master) — dièses notés `s`
(ex. `Ds3.mp3` = D#3). `Tone.Sampler` interpole (pitch-shift) les notes
manquantes, donc 8-12 samples bien espacés suffisent pour tout le manche.

Spitfire LABS / VSCO / Univ. Iowa écartés : pas CDN-ready/`Tone.Sampler`-ready
sans repackaging, et tonejs-instruments couvre déjà le besoin proprement.

---

## 🔧 Phase 2 — Refonte `strumSounds.ts` + `audio.ts`

### Réconciliation des presets

Le brief listait 5 presets aux noms `electric-clean/crunch/lead/blues/
acoustic-warm`. **Or ces noms sont des IDs LEGACY** déjà migrés (cf.
`migrateLegacyStrumId`, prefsStore v9). Les renommer aurait cassé la migration
+ le picker + les prefs persistées des users.

➡️ **Décision : garder les 6 IDs existants** et mapper l'*intention* du brief
dessus (clean / jazz / overdrive=crunch / distortion=lead / acoustic-steel /
nylon). Zéro breaking change sur le store.

### `strumSounds.ts`

- Supprimé `WAF_PRESETS` + `PRESET_FX` (WebAudioFont).
- Ajouté `SAMPLE_PACKS` (3 packs, maps note→filename) + `PRESET_CONFIG`
  (recette FX par preset : `pack`, `distortion`, `eq{low,mid,high}`,
  `reverbDecay/Wet`, `delayWet/Time/Feedback`, `volumeDb`, `release`,
  `noteDuration`, `velocityScale`).
- `StrumSoundId`, `STRUM_SOUNDS`, `getStrumSound`, `migrateLegacyStrumId`
  inchangés. Descriptions/tags mis à jour (plus de « GM/FluidR3 »).

### `audio.ts` — moteur double

```
[studio FX | synth pool] → masterCompressor → masterGain → destination
```

- **Moteur studio** : `Tone.Sampler` par pack (caché → 1 fetch par pack).
  Chaîne FX par preset : `Sampler → [Distortion] → EQ3 → [FeedbackDelay] →
  Reverb → master`.
  - electric-clean : EQ aéré + reverb légère
  - electric-jazz : EQ médiums chauds / aigus roulés (-5dB high) + reverb
  - electric-overdrive : Distortion 0.30 (crunch) + mid-boost +4dB
  - electric-distortion : Distortion 0.62 (hard) + delay 8n. + reverb 2s
  - acoustic-steel : EQ brillant + room reverb
  - acoustic-nylon : EQ boisé + room reverb 2s
- **Moteur synth** : pool de 6 `Tone.PluckSynth` (Karplus-Strong, round-robin
  6 cordes) + reverb légère. Toujours construit au boot → fallback instantané.

### Lazy loading (Phase 2.3)

- Au boot : seul le pack du preset actif est fetché (`buildStudioPreset`).
- Au switch : load on-demand, caché par pack (`samplerPromises` Map).
- Toast « Chargement du son « <preset> »… » affiché **seulement** au 1er load
  d'un pack (pas de spam sur les switches intra-pack).

### Fallback synthèse (Phase 2.4)

- `loadSampler` : timeout 12s + `onerror` → reject.
- Si le pack échoue (offline/CDN down) : `studioReady=false`, `triggerMidi`
  route vers le synth, toast warning **« Mode synthèse activé (samples
  indisponibles) »**. Les échecs ne sont PAS cachés (re-try possible si l'user
  repasse online).

### Toast bridge

Le toast est injecté depuis React (`useAudio` → `setAudioStatusReporter`),
identity-guarded pour survivre aux multiples montages. audio.ts reste découplé
de la couche UI.

### Note : WebAudioFont orphelin

`src/lib/webAudioFont.ts` n'est plus importé par personne (vérifié par grep).
Laissé sur disque (inoffensif, hors scope de suppression — touche le precache
PWA). **À supprimer dans un cleanup futur.**

---

## 🎚 Phase 3 — Support `audio_url` (Voie B)

- `CommunityRiff.audio_url?: string | null` ajouté (additif, aucun riff ne
  l'utilise encore).
- `playRiff(riff)` dans audio.ts : si `audio_url` présent → `Tone.Player` joue
  le vrai MP3/Opus et retourne le player (Session B gère stop/dispose) ; sinon
  retourne `null` (Session B garde sa lecture note-à-note). **Le RiffPlayer.tsx
  n'a PAS été touché** (réservé Session B).
- Migration SQL livrée : `docs/SUPABASE-MIGRATIONS-SESSION-D.sql`
  - `ALTER TABLE riffs_public ADD COLUMN IF NOT EXISTS audio_url TEXT;`
  - Bucket public `riff-audio` + 4 policies (read public, upload/update/delete
    authentifié, uploads rangés sous `<user_id>/`).

**⚠️ Action manuelle Melvin** : exécuter la migration dans le SQL Editor
Supabase, et le bucket `riff-audio` sera créé par le script (pas besoin de le
créer à la main, l'`INSERT INTO storage.buckets` s'en charge).

---

## ⚙️ Phase 4 — Toggle « Studio quality »

- `prefsStore` : `audioQuality: 'studio' | 'synth'` (default `studio`),
  setter `setAudioQuality`, migration **v10** (additif, IDs strum préservés).
- `/settings` : carte « Qualité audio » avec Toggle + sous-titre explicatif
  (~20 MB au load, désactiver si offline/bande passante faible).
- Hot-swap : `main.tsx` subscribe → `setAudioQuality()` rebuild les voices au
  vol (comme le hot-swap de timbre existant).

---

## 🧪 Phase 5 — Tests avant/après

- ✅ `npm run build` (tsc strict + vite) **passe** — 0 erreur introduite.
  (Les erreurs initiales étaient un `node_modules` incomplet dans le worktree,
  résolues par `npm install`.)
- ✅ Call sites audio inchangés : `strum / playChord / playMidi /
  playChordVoicing / playNote / startMetronome` mêmes signatures →
  `/jam`, `/composer`, `/chords`, métronome restent compatibles (vérifié par
  grep des imports).
- ⚠️ **Écoute avant/après : non auditionnée dans cet environnement headless**
  (le preview tool rend un `#root` vide ici — cf. mémoire projet). Évaluation
  honnête sur la base du changement d'ingénierie :
  - **Attendu nettement meilleur** : vrais multisamples de guitare enregistrés
    vs SoundFont General MIDI. Le grain « MIDI » disparaît par construction.
  - Les presets drive/disto gagnent un vrai WaveShaper + EQ + delay au lieu
    d'un sample GM figé.
  - **À confirmer à l'oreille par Melvin** (studio ON sur /riffs, puis toggle
    OFF pour comparer le fallback synth, puis /jam /composer /chords).

---

## État final

- [x] 6 presets refondus avec `Tone.Sampler` HQ (vrais samples)
- [x] Lazy load par pack (pas tout au boot) + toast de chargement
- [x] Fallback synthèse (PluckSynth pool) si load échoue + toast
- [x] Champ `audio_url` ajouté (Voie B) + `playRiff()`
- [x] Toggle Studio quality dans Settings + hot-swap
- [x] Migration SQL livrée (colonne + bucket)
- [x] `npm run build` vert

## Fichiers touchés

- `src/lib/strumSounds.ts` — sample packs + preset configs
- `src/lib/audio.ts` — moteur double Sampler/synth + playRiff + reporter
- `src/stores/prefsStore.ts` — audioQuality + migrate v10
- `src/main.tsx` — hot-swap audioQuality
- `src/hooks/useAudio.ts` — toast reporter + passe quality à initAudio
- `src/pages/Settings.tsx` — carte toggle Studio quality
- `src/lib/communityRiffs.ts` — champ audio_url (additif)
- `docs/SUPABASE-MIGRATIONS-SESSION-D.sql` — migration (nouveau)

---

✅ Mergé dans main (519f012) — merge --no-ff de origin/main (Session A
RiffCard, zéro conflit) puis push vers main. Build final vert sur l'arbre
mergé.
