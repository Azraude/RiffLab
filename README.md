# RiffLab

> Le carnet du guitariste moderne — pratique quotidienne, sons, accords, gammes.

Voir [`docs/PLAN.md`](docs/PLAN.md) pour la vision complète et la roadmap.

## Stack

- **Vite + React + TypeScript**
- **Tailwind CSS** (design system tokens dans `tailwind.config.ts`)
- **React Router** v6
- **Zustand** pour le state
- **Framer Motion** pour les animations
- **Lucide React** pour les icônes
- _(à venir)_ Tone.js, @react-three/fiber, Dexie.js

## Démarrage

```bash
# Une seule fois
npm install

# Lancer le dev server
npm run dev
# → http://localhost:5173
```

Autres commandes :

```bash
npm run build       # build production dans dist/
npm run preview     # tester le build localement
npm run format      # prettier sur tout le code
```

## Structure

```
src/
├── main.tsx                # entrée
├── app/
│   ├── router.tsx          # routes
│   └── layout/             # Sidebar, MobileNav, Layout
├── pages/                  # une page par route
├── components/
│   ├── ui/                 # primitives (Button, Card…)
│   ├── chord/              # ChordDiagram, ChordCard…
│   ├── fretboard/          # Fretboard 2D / 3D
│   ├── audio/              # AudioEngine, Metronome…
│   └── three/              # composants Three.js sélectifs
├── lib/                    # logique (théorie, audio, storage)
├── stores/                 # zustand stores
├── hooks/                  # hooks custom
└── styles/
    └── globals.css         # base CSS + tailwind layers
```

## Design system

- **Noir profond** (`#0a0a0a`) + **or chaud** (`#d4b76a` / `#f5d97a` bright) + **blanc**
- Typo : **Cormorant Garamond** (display serif) + **Inter** (UI) + **JetBrains Mono** (chord names, BPM)
- Tokens dans `tailwind.config.ts` (couleurs, fontSize, shadow, ease) ET dans `src/lib/theme.ts` pour usage TS (ex: Three.js)

## Routes

| Route | Page | Statut |
|---|---|---|
| `/` | Landing | ✅ scaffold |
| `/dashboard` | Dashboard quotidien | ✅ scaffold (placeholder data) |
| `/songs` | Liste des sons | ✅ scaffold |
| `/songs/new` | Ajouter un son | ⏳ Phase 1 |
| `/songs/:id` | Détail / play | ⏳ Phase 1 |
| `/chords` | Bibliothèque accords | ⏳ Phase 1 |
| `/scales` | Bibliothèque gammes | ⏳ Phase 1 |
| `/jam` | Mode jam | ⏳ Phase 4 |
| `/settings` | Préférences | ⏳ Phase 2 |

## Déploiement

Push sur GitHub → connecter Vercel → deploy auto.
Preview deploys sur chaque PR.

## License

Privé pour l'instant.
