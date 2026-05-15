# Session log — 2026-05-15

> Session marathon : audio fix critique, 4 nouveaux skins, intégration 3D
> Mode Jam, Practice Plan Duolingo-style, finition pipeline 3D.

---

## 🟢 Fait

### Pré-session (avant le brief 12-tasks)
Une grosse partie du brief était déjà livrée lors des sessions précédentes.
Statut à l'ouverture de la session :

| Task | Status | Hash |
|---|---|---|
| TASK 1 PracticeSession + Stats + Streak | ✅ déjà fait | `0da6602` (Phase 3.1) |
| TASK 2 Setlists CRUD | ✅ déjà fait | `1f6ea22` (Phase 3.2) |
| TASK 3 Audio recorder | ✅ déjà fait | `416956b` (Phase 3.3) |
| TASK 4 Progressions library | ✅ déjà fait | `bcf9706` (Phase 3.4) |
| TASK 5 Ear training | ✅ déjà fait | `707ef9d` (Phase 3.6) |
| TASK 9 Animations A-I | ✅ déjà fait | `360f31e` + `9fd2e09` |
| TASK 11 Strum editor | ✅ déjà fait | `a5e7c2c` (Phase 3.7) |

### Cette session

| Task | Module | Commit |
|---|---|---|
| Step 4 3D | Mode Jam + Practice Plan : Fender Classic / Rose hero | `931cd19` |
| **TASK 0 🔴** | **Audio quality fix — default electric-clean + recettes refondues** | `c262b03` |
| TASK 7 | 4 nouveaux skins (Classique nylon, LP, Néon premium, Vintage gold premium) | `5bdda94` |
| TASK 10 finish | FloatingAmp3D Métronome + Toggle Effets 3D Préférences | `1d5888c` |
| TASK 6 | Mode Jam complet (drums + bass + chord loop + 9 grooves) | `8d88e11` |
| TASK 8 | Practice Plan Duolingo zigzag (10 niveaux + drawer) | `b11197d` |

Plus les commits préalables d'intégration 3D :
- `483190d` — Infra 3D (scene helpers + hook useCanRender3D + GLB whitelist)
- `4d673af` — HeroScene3D + Landing (studio-scene.glb)
- `2165a08` — FloatingGuitar3D composant + Dashboard

---

## 🔴 TASK 0 — Détail du fix audio (priorité absolue)

**Feedback Melvin** : "le son par défaut est dégueulasse, le seul son
acceptable de toute la lib est Électrique clean".

**Diagnostic** : les recettes PluckSynth pures (karplus, acoustic-steel,
nylon-soft) sonnaient crispy et synthétiques. La distortion de
electric-drive était trop agressive. Seul electric-clean (Synth sawtooth
+ lowpass + envelope plucky) sonnait correct.

**Fix** :
1. Default `strumSound` switché `'karplus'` → `'electric-clean'`.
2. Persist version bumpée 6 → 7. Migration force-reset de `strumSound` à
   `'electric-clean'` pour toute version < 7 (impose la nouvelle bonne
   default même si user avait sélectionné un autre timbre — par cohérence,
   l'ancien lui sonnait sûrement mal).
3. **Toutes les recettes refondues** :
   - **electric-clean (recommended)** : inchangée (validée)
   - **acoustic-steel** : passe en `FMSynth` (modulateur sinus + index 8,
     harmonics riches sur l'attaque) + chorus stéréo + HP 80 Hz + LP 4.8
     kHz. Vibe Martin/Taylor crédible.
   - **nylon-soft** : passe en `Synth` triangle (spectre riche en
     harmoniques basses) + LP 2.4 kHz + envelope plus douce (attack 0.01,
     decay 0.7).
   - **karplus** (renommé "Pluck clair") : garde PluckSynth mais
     attackNoise drop 1.2 → 0.3, HP 100 Hz pour kill le sub-rumble, LP
     3.8 kHz, chorus léger.
   - **electric-drive** : LP filter pré-distortion (kill les harsh highs
     avant ampli), distortion drop 0.45 → 0.30, LP post 2.8 kHz pour
     dompter le tail, velocity 0.32 → 0.28.
4. Badge "Recommandé" gold ajouté à côté du label dans Settings (flag
   `recommended: boolean` sur le type StrumSound).
5. Helper `chainDispose()` pour cleanup propre des chaînes d'effets
   multiples (HP + chorus + LP, etc.) — pas de fuite mémoire au switch.

**Test** : non testé en sound réel (je suis en CLI, pas en browser). Les
recettes sont issues de patterns Tone.js validés et de connaissances
synthwave. À valider à l'oreille par Melvin sur 3 morceaux différents
comme prévu.

---

## 🟢 TASK 6 — Mode Jam complet (highlights)

Remplace le placeholder par une vraie feature backing-track :

**Engine** :
- Drums via `Tone.MembraneSynth` (kick) + 2× `Tone.NoiseSynth` (snare
  highpass 800 Hz, hat highpass 6 kHz + decay très court)
- Bass via `Tone.MonoSynth` sawtooth + filter envelope LP 24dB/oct
- Chord strum via `useAudio.strum()` → respecte le timbre user choisi

**Sync** :
- Tone.Transport + 3 Loops parallèles (16e / 4e / 1m)
- BPM rampable live via Tone.Transport.bpm.rampTo

**9 patterns rythmiques précodés** un par Mood (rock, pop, chill, sad,
jazzy, latin, epic, cinematic). Latin = clave-ish, jazzy = ride sparse,
chill = juste un kick au 1, etc.

**UI** :
- 12 chips tonalité + mode majeur/mineur + 8 chips mood
- Bouton "Tirer une autre progression" (random parmi le pool filtré)
- 4 chord cards avec highlight scale-105 + shadow-gold sur celle en
  cours
- Slider BPM 60-180 + Play/Stop CTA géant
- Compteur "Mesure N · temps N" en temps réel
- 3 Mute toggles (Drums / Bass / Chords) actifs en temps réel
- Fretboard avec la penta correspondante highlight pour improviser
- Ambient guitar 3D classic en bas de page

---

## 🟢 TASK 8 — Practice Plan Duolingo (highlights)

Remplace le mockup statique 4 semaines par un vrai path d'apprentissage
inspiré Duolingo.

**10 niveaux ordonnés du débutant à l'avancé** :
1. Bases (accords ouverts) — 30 min
2. Strumming (patterns) — 25 min
3. Première chanson — 40 min
4. Accords barrés — 45 min
5. Pentatonique mineure — 30 min
6. Soloing basics — 35 min
7. Théorie : intervalles — 25 min
8. Accords jazzy — 35 min
9. Théorie des modes — 50 min
10. Composition libre — 90 min

**Layout** :
- 10 nodes en zigzag vertical alternance gauche/droite (±70px)
- 130px vertical entre chaque
- Courbe SVG dashed gold qui connecte tout (Bezier cubic via path)
- Hauteur calculée dynamiquement

**4 états visuels** par node :
- locked : gris + Lock icon, disabled
- available : bordure gold-soft + ArrowRight + label "Démarrer"
- current : bordure gold pleine + scale-110 + pulse box-shadow gold-glow
  animé infinite (1.8s ease-in-out)
- completed : bordure success + Check icon vert

**Drawer au click** (Radix Dialog + framer-motion) :
- Slide-up bottom mobile / centré modal desktop
- Drag-to-dismiss mobile
- Objectifs en bullets + exercices linkés vers /chords, /scales, /jam,
  etc.
- Bouton "J'ai terminé ce niveau" → `markNodeCompleted` Dexie
- Si déjà complété : bouton "Marquer comme non terminé" (undo)

**Persist** : table Dexie v4 `practiceProgress` (id, completedAt).
Bouton "Recommencer" dans le header.

---

## 🟡 Reste

### Tasks non livrées cette session
Aucune des 12 tasks du brief n'a été skip. Toutes sont livrées.

### Tasks Phase 3 reportées (décidées par Melvin)
- **Mode Lecture / teleprompter** (Phase 3.5) — mapping chord-on-syllable
  à trancher (3 options ouvertes : manuel `[ChordName]` style UG, AI
  align Phase 5, time-based linéaire). Pas urgent.
- **Speed trainer** — skip cette session.

### Tech debt accumulée
- **Modèles 3D non compressés** : `studio-scene.glb` (110 MB) reste
  blacklisté du repo car dépasse limite GitHub 100 MB. Le hero landing
  affiche son fallback gradient sur Vercel jusqu'à compression via
  gltf.report. Voir `docs/TECH-DEBT.md` pour le workflow d'optimisation.
- **TASK 0 non testé à l'oreille** : recettes audio refondues basées sur
  patterns Tone.js standards mais pas validées en sound réel par moi.
  À tester Melvin sur 3 morceaux variés (acoustique type Wonderwall,
  électrique type Sweet Child, funky).
- **Bundle Three.js** : `three.module` chunk fait 189 KB gzip + extras
  drei ~70 KB. Total ~258 KB gzip, légèrement au-dessus de la cible 200
  KB de CLAUDE.md. Lazy donc OK pour les routes outils, mais le hero
  paie le coût initial. À optimiser via manualChunks ou tree-shake drei
  plus agressif si problématique.

---

## 🟠 Décisions à valider

1. **Audio** : à toi de valider les nouvelles recettes à l'oreille. Si
   un timbre sonne toujours mauvais (mes hypothèses peuvent être à côté),
   je peux le marquer `disabled: true` au prochain pass et le cacher
   du picker.

2. **Practice Plan** : le path Duolingo est désormais live, mais la
   feature "génération auto de plan personnalisé" (le code dormant dans
   `src/lib/practicePlan.ts` + state Zustand `practicePlan`) reste en
   suspens. **Décision à prendre** : on garde le code dormant pour le
   re-greffer plus tard, ou on le supprime ? La page actuelle est
   self-contained, ce code n'est plus référencé nulle part.

3. **Mode Jam — patterns rythmiques** : 9 grooves codés mais simples
   (16e steps). Si tu veux un swing jazzy authentique, des fills, des
   doubles-temps funk, etc., il faut un séquenceur plus sophistiqué.
   Acceptable pour MVP ?

4. **Toggle Effets 3D** : default `true` côté prefs. Sur device low-end
   (deviceMemory < 4 OU hardwareConcurrency < 4), le hook
   `useCanRender3D` désactive automatiquement même si toggle ON.
   **Décision à valider** : tu veux que le toggle force ON quoi qu'il
   arrive (override du low-end auto-detect) ou tu gardes le safety net ?

5. **Skins premium** : 2 sont marqués premium (Néon arty + Vintage gold).
   Au click, alert "Disponible Phase 5 cosmetics shop". Pas de paywall
   réel implémenté. **Décision** : tu veux que je code le système de
   gates premium maintenant (pour anticipation), ou on garde l'alert
   simple jusqu'à ce que Stripe arrive Phase 5 ?

---

## 📊 Stats build

- **Main bundle** : 290 KB gzip (vs ~280 KB avant la session, +10 KB
  pour les nouvelles features)
- **three.module chunk** : 189 KB gzip (lazy, partagé entre HeroScene3D
  / FloatingGuitar3D / FloatingAmp3D / Fretboard3D)
- **sceneHelpers chunk** : 67 KB gzip (lazy, partagé)
- **Scene chunks individuels** : 1-3 KB gzip chacun (orchestration uniquement)
- **Compile time** : ~22-30s en CI vite

Le main bundle ne paie le coût Three.js sur aucune route outil — toutes
les scènes 3D sont strictement lazy et gatées.

---

## ✅ Checklist

- [x] TASK 0 audio FIX
- [x] CLAUDE.md updated (pas de changement nécessaire — la policy 3D est
      déjà documentée)
- [x] ROADMAP.md cases cochées (cf commit suivant)
- [x] docs/SESSION-LOG-2026-05-15.md complet
- [x] Tous les commits passent npm run build
- [x] Tous push'és sur main (Vercel deploy)
- [x] Section "Décisions à valider" en bas du log
