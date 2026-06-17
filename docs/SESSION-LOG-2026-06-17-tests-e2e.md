# Session log — Tests E2E Playwright (2026-06-17)

## Objectif

Setup Playwright + 12 tests E2E couvrant les flux critiques de l'app, comme
regression check avant chaque ship. Zéro collision : tout dans `tests/` +
`playwright.config.ts` + `package.json`.

## Livré

### Setup
- `npm i -D @playwright/test` (+ `npx playwright install chromium`).
- `playwright.config.ts` : 2 projets (`desktop` = Desktop Chrome, `mobile` =
  viewport iPhone 13 sur moteur Chromium — on n'installe que chromium).
  Reporter `list` + `html` (`open:'never'`). Artefacts confinés sous
  `tests/.report` + `tests/.results` (gitignorés via `tests/.gitignore`) pour
  ne pas polluer la racine. `webServer` lance `npm run dev` (reuse en local).
- Scripts `package.json` : `test:e2e`, `test:e2e:ui`.

### 12 specs (1 fichier par flux, `tests/`)
1. `landing.spec.ts` — / charge, hero + CTA → /dashboard.
2. `navigation.spec.ts` — chaque item de nav (sidebar desktop / bottom mobile)
   charge sans écran noir.
3. `songs.spec.ts` — créer un song → liste → détail.
4. `chords.spec.ts` — filtre root + qualité, tap accord sans crash.
5. `scales.spec.ts` — sélection de gamme → fretboard SVG highlighté.
6. `progressions-studio.spec.ts` — 4 slots au mount, "Tout générer", unlock.
7. `riffs-feed.spec.ts` — like (compteur +1), ordre du feed stable (frozenList).
8. `riffs-detail.spec.ts` — détail, tab visible, aucune erreur 400.
9. `setlists.spec.ts` — créer setlist, ajouter song, lancer mode lecture.
10. `practice-plan.spec.ts` — chemin 10 nodes, click node → drawer.
11. `tools.spec.ts` — Tuner (micro mocké), Métronome play/pause, Ear Training
    quiz init.
12. `theme-switching.spec.ts` — change thème → `data-theme` + couleurs CSS.

- `tests/helpers.ts` : `seedPrefs` (neutralise onboarding/tutorials/3D/audio +
  force la locale FR), `mockMicrophone`, `expectNoBlackScreen`,
  `collectConsoleErrors`.
- `tests/README.md` : lancer / mode UI / ajouter un test / flux couverts + snippet CI.

## Résultat

**30/30 runs verts** (15 cas × 2 projets desktop+mobile). `npm run build` OK.

```
30 passed (45.2s)
```

## Décisions / pièges rencontrés

- **Onboarding/tutorials bloquants** : `prefsStore` démarre avec
  `onboardingCompleted=false` etc. → overlays plein écran. Réglé via
  `seedPrefs` qui pré-écrit `rifflab-prefs` (version 9) dans localStorage
  avant chargement (`addInitScript`).
- **i18n en anglais sous Playwright** : `navigator.language` = en-US → UI EN,
  cassait les assertions FR. Réglé en forçant `rifflab-locale=fr` dans le seed.
- **Copie landing volatile** : on cible le CTA par `href="/dashboard"`, pas par
  son libellé marketing.
- **Sidebar contient son propre `<nav>`** (caché mobile) → `nav a[href]`
  matchait le lien caché. Réglé avec `:visible`.
- **FAB feedback superpose le FAB setlist** sur mobile → `click({ force:true })`.
- **iPhone 13 = WebKit par défaut** dans Playwright → override
  `browserName:'chromium'` pour rester sur le seul moteur installé.
- **Audio non assertable** (Tone.js sans vrai geste) : on vérifie l'absence de
  crash, pas le son.

## CI

`.github/` absent → workflow GitHub Actions **à faire après setup CI**. Le
snippet `e2e.yml` prêt à poser est dans `tests/README.md`.

## Git

- Fichiers touchés : `tests/`, `playwright.config.ts`, `package.json`,
  `package-lock.json`, ce log. Aucun fichier `src/` modifié.
- Merge `origin/main` (15 commits) résolu (conflit scripts `package.json`,
  les deux conservés). `npm run build` OK post-merge, 30/30 E2E verts.

✅ Mergé dans main (0289e4a)
