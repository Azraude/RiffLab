# RiffLab — guide pour Claude Code

> Web app pour guitaristes : carnet de sons perso + bibliothèque accords/gammes + entraînement quotidien.
> **Roadmap actuelle (source de vérité) : [`docs/ROADMAP.md`](docs/ROADMAP.md)** (v2, 7 phases).
> Vision/positionnement historique : [`docs/PLAN.md`](docs/PLAN.md).

---

## Décisions clés à retenir

- **Nom : RiffLab** (tranché, pas Riff ni Fret).
- **MOBILE-FIRST ABSOLU.** ~70 % de l'usage sera sur téléphone (Melvin l'utilise en répèt, tél sur stand). Toute UI commence à 375px, desktop ensuite. Inspi UX : Ultimate Guitar côté mobile. Tap targets ≥ 44px partout, jamais de scroll horizontal accidentel, formulaires utilisables au pouce.
- **Three.js : STRICTEMENT sélectif et décoratif.** Voir la policy ci-dessous. Le fretboard principal reste **SVG 2D** — jamais de 3D pour les outils de travail.
- **Fretboard : version SVG premium validée** (la version Three.js a été écartée — trop fiddly avec la souris, illisible pour scan rapide en répèt). Le rendu 3D des mockups (`docs/fretboard-mockup.html`) reste en archive de référence.
- **Pas de fond marron par défaut sur le manche.** Couleur par défaut : noir mat (`#0f0f10`) avec texture subtile, frets or, cordes effet bronze/argent, inlays nacre claire. Les manches "bois" reviennent via le **système de skins** (skin "Acoustique rosewood", etc.).
- **Pas de compte / pas de cloud avant Phase 5.** Tout en local via Dexie IndexedDB. Auth Supabase + sync + Stripe arrivent en Phase 5.

### Features décidées (cf. ROADMAP.md pour le détail)
- **Phase 2 (actuelle)** : audit mobile-first, refonte Fretboard2D, **système de skins** de manche, **tuner intégré** (mic + FFT), **métronome UI** (déjà câblé dans `audio.ts`), **capo intelligent** (suggère la position qui maximise les open chords), **stats + streak** quotidien.
- **Phase 3** (actuelle) : closeout **PracticeSession + Stats + Streak**, **setlists** + lecture enchaînée, **audio recorder par song** (MediaRecorder + Dexie Blob), **chord progressions library** (30+ progressions taggées par mood). Reste pour la session suivante : **speed trainer** (60→100 % du tempo), **ear training** mini-jeu, **practice plan** personnalisé, strum pattern editor.
- **Phase 3.5 (décalée)** : **Mode Lecture / teleprompter** (full-screen, wakeLock, accords énormes, défilement synchro tempo) — ouvre un problème non trivial de mapping chord-on-syllable. 3 pistes ouvertes : (a) mapping manuel avec `[ChordName]` inline dans les lyrics façon UG, (b) AI assist Phase 5 qui aligne automatiquement, (c) time-based estimation linéaire depuis `beats: n` (MVP imprécis mais zéro friction).
- **Phase 4** : Three.js sélectif (hero landing + cordes ambient Dashboard + toggle "Vue 3D" Scales, lazy chunk < 200 Ko), **thèmes UI** (Dark Gold default + Sunset / Studio Blue / Pure White / Néon), sons de strum custom, **shareable songs/setlists** via URL base64, **profil public** guitariste, riff de la semaine.
- **Phase 5** : AI (génération progressions, theory hints, composer assistant), auth Supabase, tier Free/Pro Stripe, **cosmetics shop** (skins/thèmes premium), AI credits.
- **Phase 6** : **extension Chrome** sur YouTube (bouton "📥 Capturer dans RiffLab"), détection d'accords mp3/SoundCloud.
- **Phase 7+** : marketplace setlists/leçons, **mode AR** (caméra au-dessus du manche, overlay des notes via MediaPipe/WebXR), voice command, Apple Watch, pédale Bluetooth.

### Process de validation
**À chaque étape majeure (refonte composant, nouveau système, feature complexe), je propose d'abord un plan ou un mockup HTML AVANT de coder.** Le user valide, puis j'implémente. Pas de gros refactor sans validation préalable.

---

## Three.js — policy stricte

**Three.js est décoratif, JAMAIS fonctionnel.** Règles dures :

| ✅ Usages autorisés (Phase 4+) | ❌ Usages interdits |
|---|---|
| Hero animé du landing (guitare flottante) | Fretboard principal de travail (Scales, SongDetail, Dashboard) |
| Cordes "ambient" vibrantes décoratives en arrière-plan du Dashboard | Diagrammes d'accords (`ChordDiagram`) |
| Toggle **optionnel** "Vue 3D" sur la page Gammes (off par défaut, lazy-loaded) | Tout outil mobile par défaut |
| Effets particules subtils | Formulaires, listes, tout ce qui sert au scan rapide |

- **Mobile** : pas de Three.js par défaut, même sur les éléments décoratifs. Détecter et fallback en SVG/CSS.
- **Bundle** : Three.js + R3F + drei = chunk lazy séparé < 200 Ko gzip, jamais dans le bundle initial.
- **Raison** : le user a explicitement écarté le 3D fretboard ("trop fiddly avec la souris, illisible"). Le SVG 2D premium est la vue de travail canonique.

---

## Stack

- **Vite + React 18 + TypeScript** (strict)
- **Tailwind CSS 3** — tokens du design system dans `tailwind.config.ts` ET dans `src/lib/theme.ts` (pour usage TS, ex: Three.js)
- **React Router v6** — `createBrowserRouter` dans `src/app/router.tsx`
- **Zustand** (+ middleware `persist`) — un store par domaine dans `src/stores/`
- **Framer Motion** — animations / transitions de page
- **Lucide React** — icônes (stroke 1.5, taille 18-20px)
- **Tone.js** — moteur audio (samples, strum, métronome plus tard)
- **Dexie.js** (+ `dexie-react-hooks`) — IndexedDB pour les sons & sessions
- **clsx** — pour les classes conditionnelles
- _(à venir Phase 3)_ `@react-three/fiber` + `@react-three/drei`
- _(à venir Phase 5)_ Supabase (auth + sync), Stripe

---

## Design system

### Palette
- **Fond** : `#0a0a0a` (`bg`), `#141414` (`surface`), `#1c1c1c` (`surface-2`)
- **Bordures** : `#2a2a2a` (`border`), `rgba(212,183,106,0.18)` (`border-gold`)
- **Texte** : `#ffffff` (`text`), `#9a9a9a` (`text-muted`), `#6a6a6a` (`text-soft`)
- **Or** (signature) :
  - `gold.DEFAULT` = `#d4b76a` (or chaud, doré principal)
  - `gold.bright` = `#f5d97a` (or éclatant, accents / glow)
  - `gold.soft` = `#9a8454` (or atténué, hover / gradients)
  - `gold.glow` = `rgba(245,217,122,0.35)` (halo)
- **Sémantique** : `#4caf85` (`success`), `#d4685e` (`danger`)

### Typographie
- **Display / branding** : `Cormorant Garamond` (serif, weight 500-700) — titres importants, hero, le mot "RiffLab"
- **UI / body** : `Inter` (sans, weight 300-700) — lisibilité parfaite, partout
- **Mono** : `JetBrains Mono` (weight 500/700) — noms d'accords (`Em`, `Cmaj7`), BPM, intervalles

Tailles spéciales (Tailwind) : `text-display-xl` (64px) / `display-lg` (48px) / `display-md` (38px) / `display-sm` (28px) — toujours via `.display` qui applique `font-serif font-semibold`.

### Classes utilitaires (dans `src/styles/globals.css`)
- `.display` — serif semibold (titres)
- `.eyebrow` — 11px gold uppercase tracking-2px (sur-titre)
- `.label-small` — 11px text-soft uppercase tracking-1.5px (labels de form)
- `.chip` — pastille gold/10 mono (tags, accords inline)
- `.card` — `bg-surface border border-border rounded-2xl p-6` (équivalent du composant `<Card />`)
- `.card-hover` — hover : translate-y-0.5 + border-gold-soft
- `.divider-gold` — séparateur gradient gold transparent
- `.text-gold-glow` — text-shadow doré subtil

### Composants visuels
- **Cartes** : `<Card hover>` (voir `src/components/ui/Card.tsx`) — rayon 16px, padding 24px, hover doré
- **Boutons primaires** : `bg-gold text-bg hover:bg-gold-bright` (couleur or chaud, texte noir)
- **Boutons secondaires** : `border border-border-gold hover:bg-gold/5`
- **Inputs / selects** : `h-10 rounded-xl border border-border bg-surface focus:border-gold-soft`
- **Animations** : 200ms `ease-out-quart` (`cubic-bezier(0.25, 1, 0.5, 1)`)

---

## Architecture & conventions

### Alias
`@/...` → `src/...` (configuré dans `vite.config.ts` et `tsconfig.json`). **Toujours utiliser `@/` dans les imports**, jamais de chemins relatifs longs.

### Structure
```
src/
├── main.tsx              # entrée + seed Dexie
├── app/
│   ├── router.tsx        # createBrowserRouter
│   └── layout/           # Layout, Sidebar (desktop), MobileNav (mobile)
├── pages/                # une page par route — Landing, Dashboard, Songs, SongNew, SongDetail, Chords, Scales, Jam, Settings
├── components/
│   ├── ui/               # primitives (Button, Card)
│   ├── chord/            # ChordDiagram (SVG), ChordCard
│   ├── fretboard/        # Fretboard2D (SVG), Fretboard3D (à venir)
│   ├── audio/            # (Tone.js wrappers — vide pour l'instant, logique dans lib/audio.ts)
│   └── three/            # (composants Three.js sélectifs — vide pour l'instant)
├── lib/                  # logique pure (théorie, DB, audio, theme)
│   ├── theory.ts         # notes, MIDI, intervalles, accordages, gammes
│   ├── chordDatabase.ts  # ~50+ accords précodés avec voicings
│   ├── scaleDatabase.ts  # 11 gammes avec metadata
│   ├── audio.ts          # wrappers Tone.js (initAudio, strumChord, playNote, setMasterVolume)
│   ├── db.ts             # Dexie + types Song/Section/PracticeSession + seed
│   └── theme.ts          # tokens TS (mirror du tailwind config pour usage runtime)
├── stores/
│   └── prefsStore.ts     # Zustand persisté (tuning, capo, audio, etc.)
├── hooks/
│   └── useAudio.ts       # hook qui expose strum/playChord/playMidi
└── styles/globals.css    # @tailwind + classes custom
```

### Routes
| Path             | Page         | Statut          |
|------------------|--------------|-----------------|
| `/`              | Landing      | scaffold        |
| `/dashboard`     | Dashboard    | Phase 1 livrée  |
| `/songs`         | Songs (liste)| Phase 1 livrée  |
| `/songs/new`     | SongNew      | Phase 1 livrée  |
| `/songs/:id`     | SongDetail   | Phase 1 livrée  |
| `/chords`        | Chords ref   | Phase 1 livrée  |
| `/scales`        | Scales       | Phase 1 livrée  |
| `/jam`           | Jam          | Phase 4 stub    |
| `/settings`      | Settings     | Phase 1 livrée  |

`Landing` est en dehors du `Layout` (pas de sidebar/nav). Les autres pages sont dans `<Layout />` qui rend `<Sidebar>` (≥md) + `<MobileNav>` (<md) + `<Outlet />`.

### Naming
- Composants React : **PascalCase**, named exports (`export function ChordDiagram() {...}`)
- Hooks : `useXxx` (camelCase)
- Stores : `useXxx` (ex: `usePrefs`) — un store par domaine, persist via middleware Zustand
- Types & enums : PascalCase (`type Song`, `type TuningId`)
- Fichiers : un composant = un fichier `PascalCase.tsx`, le reste en `camelCase.ts`
- Constantes globales : `UPPER_SNAKE_CASE` (ex: `NOTE_NAMES`, `CHORD_QUALITIES`)
- Pas de default exports (sauf `vite.config.ts` / `tailwind.config.ts`)

### TypeScript
- Strict on. Pas de `any` sauf cas exceptionnel commenté.
- Préférer `type` à `interface` sauf pour les props React (où `interface` est OK).
- Types persistés (Song, Section, etc.) vivent dans `src/lib/db.ts`.
- Types musique (Note, Tuning, Scale, Chord) vivent dans `src/lib/theory.ts`.

### Tailwind
- Mobile-first toujours : classes de base = mobile, puis `md:` / `lg:` pour élargir.
- Pas de styles inline sauf valeurs dynamiques (gradients, transforms calculés).
- Préférer les tokens du theme (`bg-gold`, `text-text-muted`) aux valeurs hex.

### State & data
- **Préfs utilisateur** → `usePrefs` (Zustand persist, clé `rifflab-prefs`)
- **Sons & sessions** → Dexie via `useLiveQuery` de `dexie-react-hooks` (réactif)
- **Pas de Redux**, pas de Context global hors React Router

### Audio
- Toute interaction audio passe par le hook `useAudio()` qui init Tone.js à la première utilisation (politique navigateur).
- Respecter `prefs.audioEnabled` et `prefs.volume`.

---

## Roadmap (v2, 7 phases)

> **Source de vérité : [`docs/ROADMAP.md`](docs/ROADMAP.md).** Résumé ici, détail là-bas.

| Phase | Focus | Statut |
|---|---|---|
| **1** | MVP utilisable — layout, CRUD songs, accords + gammes, audio Tone.js, prefs | ✅ livrée |
| **2** | **Mobile-first + fondations** : audit responsive, refonte Fretboard SVG, skins, tuner, métronome UI, capo intelligent | ✅ |
| **3** | **Performance & pratique** : PracticeSession + stats/streak, setlists, audio recorder, progressions library, (puis speed trainer + ear training + practice plan + strum editor en session suivante) | 🔴 en cours |
| **3.5** | Mode Lecture teleprompter (décalé après Phase 3 — mapping chord/syllabe à trancher) | ⏳ |
| **4** | Polish + partage : Three.js décoratif (hero, ambient), thèmes UI, sons strum custom, shareable songs, profil public, riff de la semaine | ⏳ |
| **5** | AI & monétisation : génération de progressions, theory hints, auth Supabase, Stripe Free/Pro, cosmetics shop | ⏳ |
| **6** | Extension Chrome (capture YouTube → RiffLab), détection d'accords mp3 | ⏳ |
| **7+** | Moonshots : marketplace, mode AR (caméra + overlay manche), voice command, watch app, pédale Bluetooth | 🌠 |

**Ordre Phase 3 (session actuelle, cf. ROADMAP §Phase 3)** :
1. PracticeSession + Stats + Streak (~2h) — closeout Phase 2G : bouton "J'ai pratiqué" sur DailyCard → écrit dans Dexie, StreakDisplay calcule depuis sessions, page `/stats` avec top accords/gammes + courbe 30j.
2. Setlists (~3h) — type `Setlist`, CRUD `/setlists`, mode lecture enchaînée, share base64.
3. Audio recorder par song (~3h) — table Dexie `recordings`, REC button + MediaRecorder + waveform AnalyserNode SVG + indicateur "🎙 N essais" sur SongCard.
4. Chord progressions library (~4h) — `src/lib/progressionDatabase.ts` (30+ progressions), `/progressions`, filtre mood/key/difficulty, preview audio loop, "Ajouter à un song".

**Reporté en session Phase 3 suivante** : Speed trainer, Strum editor, Ear training, Practice plan.

---

## Commandes

```bash
npm install          # deps
npm run dev          # vite, http://localhost:5173
npm run build        # tsc + vite build
npm run preview      # tester le build
npm run format       # prettier
npm run lint         # eslint
```

---

## Notes de collaboration

- Le user (Melvin) est francophone — réponses en FR par défaut, code en anglais.
- Quand il valide un design / une approche, c'est définitif — ne pas re-débattre dans les PRs suivants.
- Tout ce qui touche au manche / accords doit être lisible **en répèt sur téléphone à 50 cm de distance** : tailles généreuses, contraste fort, pas de truc qui demande de zoomer.
