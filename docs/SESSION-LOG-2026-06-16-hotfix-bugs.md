# Session HOTFIX — bugs critiques audio + nav (2026-06-16)

> Debug only, zéro feature. Deux bugs reportés par Melvin :
> 1. Riff joué via play → lecture « tarpin vite » (tempo cassé).
> 2. Click sur une nav item → écran noir. Refresh manuel → la page apparaît.

---

## 🐛 BUG #1 — Tempo riff cassé

### Root cause (≠ hypothèses du brief)

Aucune des hypothèses H1-H5 du brief n'était la vraie cause. Le code de
scheduling (`RiffPlayer` / `TabPlayer`) **n'a pas été touché par Session D** et
sa math est correcte : `setTimeout(note.duration * beatMs)` avec
`beatMs = 15000 / effectiveTempo` (durée d'une double-croche en ms). Vérifié :
note `duration:4` (= 1 noire) à 112 BPM → 535 ms = 60000/112. ✓

**La vraie cause : double-boucle async concurrente.** Le player utilisait un
booléen partagé `cancelRef` pour annuler la boucle de lecture :

```
useEffect(() => {
  if (!playing) { cancelRef.current = true; return; }
  cancelRef.current = false;          // ← reset
  (async () => { while/for (!cancelRef.current) {...} })();
  return () => { cancelRef.current = true; };  // cleanup
}, [..., playMidi]);                   // ← playMidi dans les deps
```

Quand l'effet se relance (cleanup → run), le cleanup met `cancelRef=true`,
**puis la nouvelle run le remet immédiatement à `false`** avant que l'ancienne
boucle async n'ait eu le temps de voir le `true`. Résultat : l'ancienne boucle
ne s'annule pas et continue **en parallèle** de la nouvelle → 2 boucles (ou
plus) jouent en même temps = avalanche de notes = « tarpin vite ».

**Le déclencheur :** `playMidi` (et `strum`) change d'identité quand `ready`
bascule `false → true` (1er appel audio → `initAudio` → `setReady(true)`).
`playMidi` étant dans les deps de l'effet, ça relance l'effet **en pleine
lecture** → double-boucle.

**Pourquoi Session D l'a rendu visible :** le bug était LATENT avant (présent
depuis sess 27). Mais l'init WebAudioFont prenait ~200 ms → le re-fire arrivait
~1-2 notes après le début, les 2 boucles étaient quasi en phase (effet discret,
genre petit flam). Session D charge de vrais samples MP3 (~1-3 s) → `ready`
bascule bien plus tard → l'ancienne boucle a déjà avancé de 10-25 notes quand la
nouvelle repart au beat 0 → 2 boucles très déphasées = chaos audible. Session D
n'a donc pas *créé* le bug, elle l'a *révélé*.

### Fix

Token d'annulation **par-run** (chaque run de l'effet a son propre objet
`{cancelled}`, capturé en closure ; le cleanup n'annule QUE sa run) + lecture des
callbacks audio volatils (`playMidi` / `strum` / `onPlayCountChange`) via **ref**
pour les retirer des deps → plus de re-fire au flip de `ready`, et même si l'effet
se relance, l'ancienne boucle s'annule proprement (1 seule boucle garantie).

### Fichiers (même bug, même pattern — fixés tous)

- `src/components/riffs/RiffPlayer.tsx` (bug reporté)
- `src/components/tabs/TabPlayer.tsx`
- `src/components/songs/SpeedTrainer.tsx`
- `src/pages/StrumPatterns.tsx`
- `src/pages/RiffOfTheWeek.tsx`

`src/pages/Progressions.tsx` : **déjà safe** (il utilisait déjà un `let cancelled`
local par-run capturé par le cleanup) → laissé tel quel.

---

## 🐛 BUG #2 — Écran noir à la navigation

### Root cause (diagnostic — non reproductible en dev, voir ci-dessous)

⚠️ **Non reproductible via `npm run dev`** : `devOptions.enabled: false` dans
vite.config.ts → **pas de Service Worker en dev**. Le bug est donc prod-only
(SW), ce qui colle au symptôme « refresh corrige ».

Le router **n'utilise aucun `React.lazy` au niveau des routes** : toutes les
pages sont dans le bundle principal (build = un seul `index-*.js` de 1.66 Mo). La
nav client-side entre pages ne fetch donc pas de chunk → un 404-de-chunk
n'explique PAS la majorité des pages. **Mais** :

1. Les composants 3D (Hero, AmbientStrings, FloatingGuitar/Amp, Fretboard3D,
   utilisés sur Landing / Dashboard / Scales) sont chargés via `React.lazy` →
   chunks séparés.
2. La config PWA était `registerType: 'autoUpdate'` + `skipWaiting: true` +
   `clientsClaim: true`. Au déploiement d'une nouvelle version, le nouveau SW
   prenait le contrôle **immédiatement** et purgeait les anciens chunks **sous
   les pieds de la page déjà chargée**. Si la page tentait alors un `import()`
   d'un chunk lazy 3D désormais supprimé → la promesse rejette → throw pendant le
   render.
3. **Aucune ErrorBoundary n'existait** → ce throw démontait TOUT le root React =
   écran noir total. Refresh → nouvelle index.html + nouveaux chunks → OK.

### Fix (root cause + ceinture-bretelles, comme demandé)

1. **PWA `vite.config.ts`** : `registerType: 'prompt'`, `skipWaiting: false`,
   `clientsClaim: false`, `cleanupOutdatedCaches: true`. Le nouveau SW reste en
   "waiting" et ne purge rien tant que l'user n'a pas cliqué « Recharger » (le
   `PWAUpdateToast` existant gère déjà ça via `updateSW(true)`). Les anciens
   chunks restent valides pendant la session → fin de la purge sous les pieds.
2. **`ErrorBoundary` global** (`src/components/ErrorBoundary.tsx`, nouveau) :
   - Erreur de chunk (`Failed to fetch dynamically imported module`, etc.) →
     **reload auto une fois**, guardé par `sessionStorage` (fenêtre 10 s) pour ne
     jamais boucler.
   - Autre erreur → fallback lisible + bouton « Recharger » au lieu d'un écran
     noir.
   - Montée à 2 niveaux : autour de l'`<Outlet>` dans `Layout` (se remonte à
     chaque route → la sidebar reste utilisable, recovery par simple nav) + en
     backstop global autour du `RouterProvider` dans `main.tsx`.

### Fichiers

- `vite.config.ts` (config PWA)
- `src/components/ErrorBoundary.tsx` (nouveau)
- `src/app/layout/Layout.tsx` (boundary autour Outlet)
- `src/main.tsx` (boundary backstop)
- `src/components/pwa/PWAUpdateToast.tsx` (commentaire mis à jour)

---

## 🧪 Tests

- ✅ `npm run build` (tsc strict + vite) **vert**.
- ⚠️ **Honnêteté** :
  - **Bug #1** : non auditionné dans cet environnement headless (le preview tool
    rend un `#root` vide ici, cf. mémoire projet). Le fix est validé par analyse
    (élimination déterministe de la double-boucle + suppression du re-fire). À
    confirmer à l'oreille par Melvin : un riff doit jouer **une seule** voix, à
    son tempo (ex. 16 mesures de 4 temps à 80 BPM ≈ 48 s).
  - **Bug #2** : non reproductible en dev (SW désactivé en dev). Le fix combine
    la correction de la cause racine (config SW) + les défenses (ErrorBoundary +
    auto-reload chunk). À valider en **prod** après deploy : naviguer toute la
    sidebar sans écran noir, et au prochain déploiement, vérifier qu'on a le
    toast « Nouvelle version » au lieu d'un écran noir.
- Lint : pas de config ESLint dans le worktree (`eslint couldn't find a config`)
  → non exécutable ici ; tsc strict reste le gate.

### Autres bugs repérés pendant le debug (pour session future)

- `RiffPlayer` (sess 27) crée un `new Tone.MembraneSynth()` **à chaque temps
  fort** quand le métronome est ON (ligne ~108), `dispose()` 100 ms après. Pas
  un bug bloquant mais c'est du gaspillage d'objets audio — à refactorer en un
  seul synth réutilisé.
- `src/lib/webAudioFont.ts` est orphelin depuis Session D (aucun import) — à
  supprimer dans un cleanup.
- Le bundle principal fait 1.66 Mo (toutes les pages, pas de code-split par
  route). Hors scope hotfix, mais candidat à `React.lazy` par route plus tard
  (réduirait aussi la surface du bug chunk).

---

## État final

- [x] Bug tempo FIX (double-boucle), root cause identifiée + documentée
- [x] Bug écran noir FIX (config SW root cause + ErrorBoundary défensive)
- [x] ErrorBoundary global ajouté (Layout + main)
- [x] Suspense fallbacks : déjà présents sur tous les lazy 3D (vérifié) ; la
      vraie faille était l'absence d'ErrorBoundary (Suspense ne catch pas les
      rejets d'`import()`), maintenant comblée
- [x] `npm run build` vert

---

(ligne de merge ci-dessous)
