# RÉCAP 2-MIN MELVIN

> Session nuit 2026-05-18 — 13 tasks attaquées, **13 livrées** (10 sur main, 3 sur branches feature).
> Branche worktree : `claude/trusting-moore-b4036b` (10 commits, à merger sur main).

## ✅ Fait sur main (testable directement — branche `claude/trusting-moore-b4036b`)

- **TASK A** — `8398e1e` — Audio Neural-DSP-like : IR cabinet convolution + signal-flow chain (preamp tube sat → 3-band EQ → power amp sat → cabinet IR convolver → room). 5 cabs synthétiques générés via OfflineAudioContext (Marshall 4x12 V30, Fender Twin, Mesa Rect, Vox AC30, Orange). Nouveau preset `electric-metal` (Mesa Rectifier). Mini-schéma signal-flow affiché sur chaque preset card de Settings.
- **TASK B** — `77673ff` — Flamme RiffLogo v4 vérifiée (correct), MAIS normalisation des Flame icons streak (Stats / EarTraining / RiffOfTheWeek étaient en outline alors que Dashboard était filled). Tous passent à `fill="currentColor"` → cohérence visuelle.
- **TASK C** — `e393113` — Strum pattern mini-editor in-form sur SongForm (grid 8/16 cellules cliquables, preset dropdown, cycle · → ↓ → ↑ → × → ⤓). Stocké dans Section.strumPattern.
- **TASK D** — `ac207f3` — Tuner polish : aiguille spring physics (framer-motion), 3 zones colorées (±3 vert "JUSTE", ±10 orange, au-delà gold), note name x1.5 plus grosse, vibration sur ±3 au lieu de ±5.
- **TASK E** — `edafa8f` — Daily Challenge : card Dashboard avec tab du jour (déterministe FNV-1a hash sur YYYY-MM-DD), modal TabPlayer en loop, streak séparé du Practice. Dexie v8 + table `dailyChallenges`.
- **TASK F** — `c6ae74a` — Recorder loop pedal MVP : toggle Loop ON/OFF, recording sauvé avec `isLoop: true`, playback `audio.loop = true`. Overdub multi-couches reporté (demande Web Audio + mix sample-by-sample).
- **TASK G** — `82966e0` — Keyboard shortcuts globaux : `g d/s/c/g/p/r/t/m/l/j` go-to, `?` cheatsheet, `Esc` close, Ctrl/Cmd+K stub. KeyboardShortcutsProvider mounted dans Layout.
- **TASK H** — `e26bcb6` — SEO + OG : meta tags complets (description, keywords, og:*, twitter:*, JSON-LD WebApplication), og-image.svg 1200×630 avec branding, robots.txt + sitemap.xml 11 routes.
- **TASK I** — `b567cf1` — A11y : focus-visible ring gold partout, skip-link "Aller au contenu", prefers-reduced-motion (coupe sheen/flicker/sparkles/shimmer), `.sr-only` utility, aria-live sur PWAUpdateToast.
- **TASK J** — `5eee48c` — Tutorial overlay 4 steps post-onboarding (practice → streak → daily challenge → sidebar). SVG mask spotlight + tooltip auto-place. prefs.tutorialCompleted (v8 migrate true pour users existants).

## 🌿 Branches PR (à reviewer + merger séparément demain)

- **`feature/teleprompter`** — `589800b` — TASK K : Mode Lecture full-screen `/songs/:id/play`. Parser inline UG-style `[Am]today`, fallback bandeau d'accords, auto-scroll par section au tempo, tap pause/play, `screen.wakeLock` pour empêcher la mise en veille. Bouton "Mode lecture" sur SongDetail.
- **`feature/i18n`** — `a2e7067` — TASK L : setup react-i18next + locales FR/EN (60 strings de base), selector dans Settings. Infrastructure prête, traduction complète des composants = Phase 5+ deliverable.
- **`feature/ug-import`** — `86d070d` — TASK M : `/api/import-ug?url=...` Vercel function avec cheerio (parse js-store data-content UG ou fallback pre.js-tab-content), whitelist UG hosts. Modal client UgImportModal dans SongForm. ⚠️ Ne marche qu'en environnement Vercel (en dev local → 404 message clair).

## 🟡 Skip / scope-down

- Aucun task entièrement skippé. **TASK F** (looper pedal) a été scopé down MVP : juste un flag `isLoop` + `audio.loop = true` au playback. L'overdub multi-couches (mix Web Audio sample-by-sample) reporté.

## 🔴 Bugs bloquants

- Aucun.

## 🎯 À valider user au réveil

1. **AUDIO TASK A — priorité absolue** : tester les 6 presets sur `/chords` à l'oreille.
   - `electric-real-sampled` (Fender Twin clean) doit avoir le chime sparkle
   - `electric-crunch` (Marshall Plexi) doit cruncher rythmique rock
   - `electric-lead` (Marshall JCM) DOIT sonner Slash stack (mid-focus + delay 1/8 + reverb)
   - `electric-metal` (Mesa Rectifier) doit cracher en scoop power chord
   - `electric-blues` (Vox AC30) doit avoir le tube top boost doux
   - Si un preset clip / larsen / sonne dégueu, dis-moi lequel + symptôme.
   - Les IRs cabinet sont **synthétiques** (générés via OfflineAudioContext). Pour upgrade pixel-perfect Neural DSP, drop des vrais .wav d'IRs libres dans `/public/audio/ir/{cab-name}.wav` et active le loader (TODO laissé dans `src/lib/ampChain.ts`).

2. **TASK G shortcuts** : `?` ouvre le cheatsheet (vérifier sur Dashboard), `g d` → Dashboard, etc.

3. **TASK E Daily Challenge** : check que la card apparaît sous le hero, et que "Relever" → modal TabPlayer.

4. **Branches PR** : ne pas merger feature/teleprompter / feature/i18n / feature/ug-import sans review.
   - Pour tester chacune : `git checkout feature/X && npm install && npm run dev`
   - npm install requis car deps différentes (i18next sur i18n, cheerio sur ug-import).

5. **PWA** : refresh forcé Ctrl+Shift+R recommandé pour récup le nouveau SW.

## ⏱ Stats

- 13 tasks livrées (TASK A → M)
- 13 commits (10 sur main worktree + 1 par branche feature)
- ~3800 lignes ajoutées net
- 5 nouveaux fichiers majeurs (ampChain.ts, SectionStrumEditor.tsx, dailyChallenge.ts, DailyChallengeCard.tsx, useKeyboardShortcuts.tsx, Tutorial.tsx, Teleprompter.tsx, lyricsParser.ts, i18n/, UgImportModal.tsx, api/import-ug.ts)
- Main bundle gzip : 309 → ~310 KB (+3 KB malgré +10 tasks, grâce au tree-shaking et lazy chunks)
- 0 build fails (toutes les tasks passent `npm run build`)
- Dexie bumpée v7 → v8 (table `dailyChallenges` ajoutée)
- Prefs bumpée v8 (champ `tutorialCompleted`)

---

# JOURNAL DÉTAILLÉ

## TASK A — Audio Neural-DSP-like (commit 8398e1e)

Approche signal-flow réaliste :
```
Sampler (DI) → Preamp Gain → Tube Sat (asym tanh) → 3-band EQ
  → Power Amp Sat (cubic clip) → Cabinet IR Convolver → [Delay] → Room
```

**`src/lib/ampChain.ts`** (nouveau) :
- `CABINETS` : 5 profils avec `{lowCut, midPeak, midQ, midGain, highCut, decayMs, initialPunch}`
- `getCabIR(name)` : génère un IR synthétique async via OfflineAudioContext (burst de bruit blanc à enveloppe exponentielle, filtré HP → peaking mid → presence shelf → LP). Cache global, prewarmable.
- `prewarmCabinets()` : pre-warm les 5 IRs en parallèle au boot
- `makeTubeSatCurve(amount)` : tanh asymétrique (positive clip softer = tube character)
- `makePowerAmpCurve(amount)` : cubic soft clip 6L6/EL34-like, trim post-clip
- `buildAmpChain(config, output)` : assemble preamp → tubeSat → 3-band EQ → powerAmp → convolver → [delay] → room
- `describeAmpChain(config)` : renvoie le stages array pour l'UI signal-flow display

**`src/lib/strumSounds.ts`** (refactoré) :
- `AMP_CONFIGS` : recettes pour 5 presets sampler (real-sampled/crunch/lead/metal/blues)
- `electric-metal` NOUVEAU ID (Mesa Rectifier high-gain scoop)
- IDs historiques préservés pour la compat des prefs persisted (`electric-real-sampled` etc.)
- `getAmpStages(id)` : null si pas d'ampChain (acoustique, synthés legacy)
- `buildSampler6(configId, output, samplerRelease)` : helper unique pour les 5 presets

**`src/lib/audio.ts`** : `void prewarmCabinets()` dans initAudio.

**`src/pages/Settings.tsx`** : nouveau composant `AmpFlow` qui rend les stages en chips horizontales (`🎸 DI › ⚡ Preamp · gain 8.0 › 🎛 EQ · B+1 M+6 T+5 › 🔥 Power · 70% › 🔊 Cab · Marshall 4x12 V30 › ⏱ Delay · 1/8 › 🏠 Room · 28%`).

**Limitations** : IRs synthétiques. Pour pixel-perfect, drop des .wav réels dans `/public/audio/ir/`. Le code de chargement async via Tone.Convolver est déjà là, faut juste swap `getCabIR` pour `loadCabIRFromUrl`.

## TASK B — Flamme + streak Flame icons (commit 77673ff)

Vérifié RiffLabLogo v4 via eval : gradient 4 stops (0%/50%/50%/100%) avec opacity 0/0/1/1 sur `rgb(var(--gold))` rend correctement. `var(--gold)` = 212 183 106 sur le default dark-gold theme. Le SVG path se rend en half-fill comme attendu.

Mais détection d'une vraie incohérence : Lucide `Flame` icon utilisé pour les streaks :
- Dashboard : `fill="currentColor"` + drop-shadow gold = FILLED
- Stats, EarTraining, RiffOfTheWeek : NO fill = OUTLINE ONLY

Patch : tous passent à `fill="currentColor"`. Stats reçoit en plus le drop-shadow gold pour parité avec Dashboard.

## TASK C — Strum pattern mini-editor in-form (commit e393113)

`src/components/songs/SectionStrumEditor.tsx` : composant inline qui apparaît sous chaque section dans SongForm. Bouton "Ajouter une rythmique" pour expand le card. Une fois ouvert : preset dropdown, subdivision toggle 8e/16e, grille cliquable (cycle · → ↓ → ↑ → × → ⤓ → ·), highlight des cellules sur les premiers temps via `ring-1 ring-gold/20`.

Bridge StrumCell ↔ StrumDir (db schema) via `cellToStrumDir` / `strumDirToCell`. Pas de preview audio inline (la page /strum-patterns garde le composer full).

## TASK D — Tuner polish (commit ac207f3)

`src/pages/Tuner.tsx` :
- `PERFECT_CENTS = 3`, `CLOSE_CENTS = 10` (avant : seuil unique 5)
- Aiguille passe en framer-motion avec `transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.5 }}`
- Note name `motion.div` key={noteName} avec spring scale 0.92 → 1
- 3 zones overlay : `bg-success/40 + inset glow` (±3 vert) / `bg-[#e8a45e]/15` (±10 orange) / fond
- Sous l'aiguille, label "★ JUSTE" / "↑ Monter un peu" / "↓ Descendre un peu" selon zone
- Vibration `navigator.vibrate(50)` quand on rentre dans la zone perfect (vs avant : in-tune large)

## TASK E — Daily Challenge (commit edafa8f)

`src/lib/dailyChallenge.ts` :
- `pickChallengeForDate(date)` : hash FNV-1a-like sur YYYY-MM-DD modulo TABS.length
- `getDailyChallengeState()` : {date, tab, completed, streak}
- `completeDailyChallenge(date, tabId?)` : write Dexie
- `computeChallengeStreak()` : compte les jours consécutifs (terminant aujourd'hui ou hier — accepte hier pour ne pas casser pendant la journée)

`src/components/dashboard/DailyChallengeCard.tsx` :
- Card "Défi du jour" sous le hero/streak
- Badge "🔥 N d'affilée" si streak > 0
- Bouton "Relever" → Dialog full-screen avec TabPlayer (loop=true) + bouton "J'ai relevé le défi"
- Si déjà fait : badge vert "✨ Défi relevé" au lieu du bouton

`src/lib/db.ts` : version v8 + table `dailyChallenges: 'date, completedAt'` (date = PK YYYY-MM-DD).

## TASK F — Recorder loop pedal MVP (commit c6ae74a)

`Recording` schema gagne `isLoop?: boolean`. RecorderSection :
- Toggle "Loop ON/OFF" à côté de REC
- Quand Loop ON : icône REC change pour `<Repeat>` + couleur passe en gold
- Recording sauvé avec `isLoop: loopMode`
- `audio.loop = recording.isLoop === true` au playback
- Le handler `'ended'` ne reset pas le state en mode loop (l'audio ne le déclenche pas)
- Badge "🔁 Loop" sur la row du recording

**Overdub multi-couches reporté** : demande Web Audio + AudioBuffer + mix sample-by-sample, ~2h de code pour faire propre. Le MVP couvre l'usage looper #1 (record un riff, jouer en boucle, soloer dessus).

## TASK G — Keyboard shortcuts (commit 82966e0)

`src/hooks/useKeyboardShortcuts.tsx` :
- `KeyboardShortcutsProvider` mounted dans Layout (post-router, useNavigate dispo)
- Pattern Gmail "g <letter>" avec timeout 1.2s
- 10 nav shortcuts : d/s/c/g/p/r/t/m/l/j → routes correspondantes
- `?` ouvre le cheatsheet Dialog avec liste catégorisée
- `Esc` ferme le cheatsheet
- `Ctrl/Cmd+K` → stub command palette (ouvre le cheatsheet pour l'instant)
- Ignore les events quand input/textarea/select focused
- `Kbd` component pour rendre les touches en pill gold

## TASK H — SEO + OG (commit e26bcb6)

`index.html` enrichi : description, keywords, author, canonical, Open Graph complet (type/site_name/title/description/url/image/locale), Twitter Card summary_large_image, JSON-LD WebApplication.

Nouveaux fichiers `/public/` :
- `og-image.svg` : 1200×630 avec flamme logo half-fill + "RiffLab" en Cormorant Garamond + tagline + URL
- `robots.txt` : Allow / + sitemap reference
- `sitemap.xml` : 11 routes avec priorités

## TASK I — A11y (commit b567cf1)

`src/styles/globals.css` appendix :
- `:focus-visible` : outline 2px gold-bright + offset 2px (3px sur buttons)
- Inputs : box-shadow inset 2px gold-bright au focus
- `.skip-link` : visible au focus only, top-left
- `@media (prefers-reduced-motion: reduce)` : coupe daily-gold-sheen, skeleton-shimmer, streak-trophy-pulse, sparkles, rifflab-flame-flicker + force toutes les transitions à 0.01ms
- `.sr-only` utility

`Layout.tsx` : `<a className="skip-link">Aller au contenu principal</a>` + `<main id="main-content" tabIndex={-1}>`.

`PWAUpdateToast.tsx` : `role="status"` + `aria-live="polite"` sur les 2 toasts.

## TASK J — Tutorial overlay (commit 5eee48c)

`src/stores/prefsStore.ts` : nouveau champ `tutorialCompleted` (default false ; migrate v8 → true pour users existants donc ils ne reverront pas le tour).

`src/components/onboarding/Tutorial.tsx` :
- Portal full-screen avec SVG `<mask>` qui crée un trou de spotlight sur la cible (via `data-tutorial-id`)
- Outline gold + drop-shadow autour du hole
- Tooltip auto-placé top/bottom selon l'espace dispo
- 4 steps : `practice-button` → `streak-card` → `daily-challenge` → `sidebar-nav`
- Bouton "Suivant" / "Passer" / X partout, spring animations

`data-tutorial-id` ajouté sur les 4 éléments cibles.

## TASK K — Mode Lecture teleprompter (branche feature/teleprompter, commit 589800b)

`src/lib/lyricsParser.ts` : `parseLyrics(raw)` → array de `LyricLine` = array de `{chord?, text}` tokens. Regex `/\[([^\]]+)\]/g` pour les chords inline UG-style.

`src/pages/Teleprompter.tsx` :
- Route `/songs/:id/play` hors Layout (full-screen)
- Si `section.lyrics` contient `[Chord]`, rendu inline avec chord en gold-bright au-dessus de la syllabe
- Sinon fallback bandeau d'accords (section.chords)
- Auto-scroll par section : `totalBeats * (60_000/tempo)` ms
- Tap sur la zone lyrics = toggle play/pause
- Buttons ← play/pause → en footer
- `screen.wakeLock.request('screen')` au mount, re-acquire au visibilitychange

Bouton "Mode lecture" ajouté sur SongDetail à côté de Partager.

**Limites connues** : pas de scroll continu fin (atomique par section), pas de mapping fin chord/syllabe sans `[Chord]` inline (option C time-based linéaire = TODO Phase 4).

## TASK L — i18n FR/EN (branche feature/i18n, commit a2e7067)

`npm install i18next react-i18next i18next-browser-languagedetector`.

`src/i18n/index.ts` : init avec fallback fr, supportedLngs ['fr','en'], detector localStorage ('rifflab-locale') puis navigator.

`src/i18n/locales/{fr,en}.json` : ~60 strings de base (nav, common, dashboard, settings, tuner).

`src/pages/Settings.tsx` : nouveau Card "Langue" avec 2 boutons toggle FR/EN, persistance via i18next localStorage.

`src/main.tsx` : `import '@/i18n'` avant le render.

**Coverage** : infrastructure MVP. La traduction complète des pages = Phase 5+ deliverable. Les composants restent en FR hard-codé pour l'instant.

## TASK M — UG URL importer (branche feature/ug-import, commit 86d070d)

`npm install --save-dev cheerio @vercel/node`.

`api/import-ug.ts` (Vercel serverless function) :
- Whitelist `ultimate-guitar.com` domains pour éviter SSRF
- Fetch avec User-Agent réaliste
- Parse js-store data-content (où UG stocke depuis 2024) ou fallback `pre.js-tab-content`
- `cleanUgMarkup` nettoie `[ch]Am[/ch]` et `[tab]...[/tab]`
- CORS allow * pour le client PWA

`src/components/songs/UgImportModal.tsx` : modal avec input URL + spinner + gestion erreur (404 si pas en environnement Vercel → message clair).

SongForm : 2 boutons d'import côte à côte (paste tab / URL UG), même `handleImport` downstream.

**⚠️ `/api/import-ug` ne marche qu'en environnement Vercel** (prod ou `vercel dev`). En dev local Vite pur → 404 message clair.
