# Tests E2E — RiffLab (Playwright)

Tests end-to-end qui couvrent les flux critiques de l'app. À lancer comme
regression check avant chaque ship.

## Lancer les tests

```bash
npm run test:e2e        # tous les tests (headless), projets desktop + mobile
npm run test:e2e:ui     # mode UI interactif (debug, time-travel, watch)
```

Quelques variantes utiles :

```bash
npx playwright test landing.spec.ts          # un seul fichier
npx playwright test --project=desktop         # un seul viewport
npx playwright test -g "écran noir"           # filtre par titre
npx playwright show-report                    # rouvre le dernier rapport HTML
```

Le `webServer` de [`playwright.config.ts`](../playwright.config.ts) lance
automatiquement `npm run dev` (Vite, port 5173) et le réutilise s'il tourne
déjà en local. Pas besoin de démarrer le serveur à la main.

## Setup (déjà fait)

```bash
npm i -D @playwright/test
npx playwright install chromium
```

Les deux projets (`desktop` = Desktop Chrome, `mobile` = viewport iPhone 13)
tournent sur le **moteur Chromium** : on n'installe que chromium, et le projet
mobile force `browserName: 'chromium'` (les `devices['iPhone 13']` visent WebKit
par défaut). Suffisant pour des assertions DOM mobile-first basées sur le
viewport.

## Conventions

- **`tests/helpers.ts`** centralise l'outillage commun :
  - `seedPrefs(page)` — injecte `rifflab-prefs` dans `localStorage` AVANT le
    chargement (via `addInitScript`). Désactive onboarding + tutorials (sinon
    overlays plein écran au 1er lancement), coupe les effets 3D (WebGL lourd)
    et l'audio. **À appeler dans le `beforeEach` de chaque spec.**
  - `mockMicrophone(page)` — mock `getUserMedia` (stream issu d'un oscillateur)
    pour tester le Tuner sans micro réel ni prompt de permission.
  - `expectNoBlackScreen(page)` — vérifie que `#main-content` est visible et
    non vide (garde-fou régression "écran noir" sur navigation).
  - `collectConsoleErrors(page)` — collecte erreurs console + page errors.
- Les sélecteurs privilégient `getByRole` + `aria-label` / `data-*` stables
  plutôt que des textes i18n fragiles.
- Données : Dexie est seedé au 1er mount (`seedIfEmpty` → 3 songs +
  1 setlist "Répèt du jeudi"). Chaque test a un contexte navigateur isolé
  (IndexedDB vierge) ⇒ le seed se rejoue, état déterministe.

## Ajouter un test

1. Crée `tests/<flux>.spec.ts`.
2. Importe `test, expect` de `@playwright/test` et les helpers nécessaires.
3. Ajoute `test.beforeEach(({ page }) => seedPrefs(page))`.
4. Préfère naviguer par URL (`page.goto('/route')`) puis asserter via rôles /
   aria-labels. Pour les flux viewport-dépendants (nav), branche sur
   `testInfo.project.name === 'mobile'`.

## Flux couverts (12)

| Fichier | Flux |
|---|---|
| `landing.spec.ts` | Landing charge, hero + CTA "Commencer" → /dashboard |
| `navigation.spec.ts` | Chaque item de nav (sidebar/bottom) charge sans écran noir |
| `songs.spec.ts` | Créer un song → liste → détail |
| `chords.spec.ts` | Filtre root + qualité, tap accord (lecture sans crash) |
| `scales.spec.ts` | Sélection de gamme → fretboard SVG highlighté |
| `progressions-studio.spec.ts` | 4 slots au mount, "Tout générer", unlock d'un slot |
| `riffs-feed.spec.ts` | Like un riff (compteur +1), ordre du feed stable |
| `riffs-detail.spec.ts` | Détail riff, tab visible, aucune erreur 400 |
| `setlists.spec.ts` | Créer setlist, ajouter song, lancer mode lecture |
| `practice-plan.spec.ts` | Chemin 10 nodes, click node → drawer |
| `tools.spec.ts` | Tuner (micro mocké), Métronome play/pause, Ear Training quiz init |
| `theme-switching.spec.ts` | Changement de thème → data-theme + couleurs CSS |

## Notes / limites connues

- **Audio non assertable** : Tone.js nécessite un vrai geste + contexte audio.
  Les tests vérifient que le clic ne crashe pas, pas que du son sort.
- **CI** : pas encore de workflow GitHub Actions (`.github/` absent à la
  création de ces tests). À faire après setup CI — voir le snippet ci-dessous.

### Snippet CI (à poser dans `.github/workflows/e2e.yml` une fois `.github/` créé)

```yaml
name: E2E
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```
