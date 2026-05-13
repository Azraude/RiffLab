# 🎸 GUITAR APP — Plan détaillé v0.1

> Outil de musicien intelligent : ta bibliothèque de sons, ta théorie, ton entraînement quotidien, tout en un.

---

## 1. Vision & positionnement

### Ce qu'on construit
Une application web (responsive, mobile-first) qui combine trois choses qu'aucun concurrent ne fait bien ensemble :

1. **Ton carnet personnel de morceaux** — tu ajoutes les sons que tu sais jouer, avec leurs accords, leur strum pattern, leur tonalité. C'est *ton* répertoire, pas une banque générique.
2. **Une référence complète et navigable** — toutes les gammes (10+), tous les accords (open / barrés / 7e / sus / add9...), filtrables et utilisables comme un outil de pro.
3. **Un coach quotidien** — chaque jour, l'app te propose un accord du jour, sa gamme correspondante, et une progression à travailler. Avec streak pour la régularité.

### Positionnement face à la concurrence
| Concurrent | Force | Faiblesse qu'on exploite |
|---|---|---|
| Ultimate Guitar | Banque énorme de tabs | Pas de carnet perso, UX vieillissante, pas de coach |
| Yousician | Gamification, audio recognition | Cher (15€/mois), pas de bibliothèque perso |
| ChordU / Chordify | Auto-detect des accords sur YouTube | Pas d'entraînement, pas de théorie |
| Songsterr | Tabs pro | Lecture seule, pas de personnalisation |

**Notre angle** : le **Notion / Obsidian du guitariste**. Outil léger, élégant, qui s'adapte à toi. Pas de gamification infantilisante. Vibe haut de gamme.

### Tagline candidates (à choisir)
- *"Ton carnet. Ta gamme. Ton son."*
- *"Le carnet du guitariste moderne."*
- *"Practice. Compose. Play."*

### Nom du projet (à choisir)
| Nom | Vibe | Disponibilité .com (à vérifier) |
|---|---|---|
| **Riff** | Court, universel, FR/EN | Probablement pris en .com, OK en .app |
| **Fret** | Technique, élégant | OK probable en .app |
| **Cadence** | Premium, jazz | Très utilisé, OK en .guitar peut-être |
| **Toneline** | Moderne, tech | Très libre |
| **Capo** | Court, instrumental | Pris en .com |
| **Setlist** | Concert, performance | Pris (apps connues) |
| **Strum** | Action, jeune | Libre potentiel |

*Recommandation perso : **Riff.app** ou **Fret.app** — court, mémorable, prononçable FR et EN.*

---

## 2. Stack technique

### Frontend
- **Vite + React + TypeScript** — base moderne, fast HMR, types pour pas se planter sur la data
- **Tailwind CSS** — design system rapide, mobile-first natif
- **React Router** v6 — navigation entre pages
- **Zustand** — state management léger (mieux que Redux pour notre taille)
- **Framer Motion** — animations smooth (transitions de page, hover effects)
- **Lucide React** — icônes propres et cohérentes

### Audio
- **Tone.js** — abstraction Web Audio, samples, synthés, séquenceur, metronome built-in
- Samples de guitare acoustique en local (`/public/samples/`) → 24 notes max, ~2MB total

### 3D (sélectif)
- **Three.js** + **@react-three/fiber** + **@react-three/drei** — intégration React clean
- **Utilisé seulement pour** :
  - Hero animé du landing
  - Toggle "Vue 3D" optionnel sur le fretboard de gammes
  - Background ambient subtil du Dashboard

### Persistence
- **Dexie.js** (IndexedDB) — pour stocker les sons, paramètres, historique de pratique. Capacité illimitée vs localStorage 5MB.
- Plus tard : **Supabase** pour sync cloud + auth

### Tooling
- **Vitest** + **React Testing Library** — tests unitaires
- **Prettier** + **ESLint** + **Husky** — code propre
- **Vercel** — hosting + CI/CD (push = deploy)

### Stack résumée
```
Vite + React + TS + Tailwind
└── Zustand (state)
└── React Router (nav)
└── Framer Motion (anim)
└── Tone.js (audio)
└── @react-three/fiber (3D sélectif)
└── Dexie (storage local)
└── Vercel (deploy)
```

---

## 3. Architecture de l'app

### Pages (routes)

| Route | Page | Description |
|---|---|---|
| `/` | **Landing** | Hero 3D, pitch, CTA "Commencer" |
| `/dashboard` | **Dashboard** | Entraînement du jour, raccourcis, stats |
| `/songs` | **Bibliothèque** | Liste de tes sons, filtres, recherche |
| `/songs/new` | **Ajouter un son** | Formulaire complet |
| `/songs/:id` | **Détail / Play** | Lyrics + accords sync, mode performance |
| `/chords` | **Accords** | Référence complète, filtrable |
| `/scales` | **Gammes** | Toutes les gammes, fretboard 2D/3D toggle |
| `/jam` | **Jam mode** | Backing tracks aléatoires sur ta gamme |
| `/settings` | **Préférences** | Accordage, capo défaut, thème, export |

### Composants réutilisables clés

```
<ChordDiagram />        — diagramme SVG 2D d'un accord
<ChordCard />           — carte cliquable avec nom + diagramme + audio
<Fretboard2D />         — fretboard SVG, prend props (highlightedNotes, tuning)
<Fretboard3D />         — version Three.js du même (toggle)
<StrumPatternPlayer />  — affichage + lecture audio d'un pattern (↓↓↑↑↓ etc.)
<Metronome />           — composant standalone
<DailyCard />           — carte "entraînement du jour"
<SongCard />            — preview d'un son dans la liste
<SongPlayer />          — vue performance avec lyrics scroll + chords sync
<Transposer />          — boutons +1 -1 pour shifter la tonalité
<TuningPicker />        — sélecteur d'accordage
<KeyPicker />           — sélecteur de tonalité (12 keys + mode major/minor)
<AudioEngine />         — provider context global, expose play(note), strum(chord)
```

### Modèle de données (TypeScript)

```ts
type Song = {
  id: string;
  title: string;
  artist?: string;
  key: Key;                 // 'C', 'C#', ... 'B' + mode
  mode: 'major' | 'minor';
  tempo: number;            // BPM
  capo: number;             // 0-12
  tuning: TuningId;         // 'standard', 'dropd', etc.
  tags: string[];           // ['chill', 'funk', 'pratiqué', 'à bosser']
  sections: Section[];
  notes?: string;           // markdown freeform
  createdAt: number;
  updatedAt: number;
};

type Section = {
  id: string;
  name: string;             // 'Intro', 'Couplet', 'Refrain', 'Pont', 'Solo'
  chords: ChordRef[];       // suite d'accords dans l'ordre
  strumPattern?: StrumPattern;
  lyrics?: string;          // markdown, accords entre <chord>X</chord> tags
  loop?: boolean;
};

type ChordRef = { name: ChordName; beats: number };   // ex: ('Em', 4)
type StrumPattern = { beats: ('down'|'up'|'mute'|'rest')[]; subdivision: 4|8|16 };

type ChordName = string;    // ex: 'Em', 'Cmaj7', 'F#7sus4'

type Chord = {
  name: ChordName;
  root: NoteName;
  quality: string;          // 'major', 'minor7', 'sus4'...
  voicings: Voicing[];      // plusieurs positions possibles
};

type Voicing = {
  frets: (number | null)[];   // 6 strings, null = mute, 0 = open
  fingers: (number | null)[]; // doigts 1-4
  barre?: { fret: number; fromString: number; toString: number };
  difficulty: 1 | 2 | 3 | 4 | 5;
};

type Scale = {
  id: string;
  name: string;             // 'Mineure pentatonique'
  intervals: number[];      // [0, 3, 5, 7, 10]
  modes?: string[];         // si applicable
  description: string;
  example: string;          // morceau célèbre qui l'utilise
};

type PracticeSession = {
  date: string;             // YYYY-MM-DD
  chord: ChordName;
  scale: ScaleId;
  progression: ChordName[];
  completed: boolean;
  durationSec?: number;
};

type Preferences = {
  defaultTuning: TuningId;
  defaultCapo: number;
  theme: 'dark-gold' | 'dark-orange' | ...;
  audioEnabled: boolean;
  showFretNumbers: boolean;
};
```

---

## 4. Roadmap par phases

### Phase 1 — MVP utilisable (semaine 1-2)
**Objectif** : tu peux ajouter tes sons et les consulter sur ton téléphone en répèt.

- [ ] Setup Vite + React + TS + Tailwind + routing
- [ ] Design system de base (couleurs, typo, composants atomiques)
- [ ] Layout responsive : sidebar desktop / bottom nav mobile
- [ ] CRUD Songs (ajout, édition, suppression, liste)
- [ ] Formulaire d'ajout de son avec sections + accords + strum
- [ ] Bibliothèque d'accords (50+ accords précodés en JSON)
- [ ] ChordDiagram SVG component
- [ ] Bibliothèque de gammes (10 gammes : majeure, mineure, penta maj/min, blues, dorien, phrygien, mixolydien, lydien, harm. min.)
- [ ] Fretboard2D component
- [ ] Page détail d'un son avec affichage des accords cliquables
- [ ] Audio basique : strum d'un accord au clic (Tone.js sampler)
- [ ] Persistence Dexie
- [ ] Deploy Vercel en preview

**Livrable** : tu peux ajouter "Stairway to Heaven", l'ouvrir sur ton tél, voir les accords, cliquer dessus, ça joue le son.

### Phase 2 — Pratique (semaine 3)
**Objectif** : l'entraînement quotidien fonctionne.

- [ ] Page Dashboard
- [ ] DailyCard : algo qui propose chord + scale + progression
- [ ] Streak tracker (avec localStorage + Dexie)
- [ ] Page Practice : timer, "j'ai fini" button
- [ ] Metronome global accessible partout
- [ ] StrumPatternEditor (grille cliquable ↓ ↑ X)
- [ ] Lecture audio du strum pattern
- [ ] Capo support : décale visuellement les accords

### Phase 3 — Three.js & polish (semaine 4)
**Objectif** : l'app devient *belle*.

- [ ] Hero 3D animé sur la landing (guitare flottante qui tourne)
- [ ] Toggle Fretboard 2D / 3D sur la page Scales
- [ ] Background ambient subtil sur le Dashboard (corde qui vibre quand tu joues)
- [ ] Animations Framer Motion (page transitions, hover cards)
- [ ] Mode "Performance" sur la page Song : lyrics scrollent en sync, accords s'affichent en gros
- [ ] Transposer (+1 / -1 buttons, change tout l'affichage)
- [ ] Dark mode polish, micro-interactions

### Phase 4 — Fonctionnalités smart (semaine 5-6)
**Objectif** : on dépasse les concurrents.

- [ ] AI helper : tu tapes un titre, l'app propose une structure d'accords (API OpenAI ou Claude)
- [ ] Backing track generator : choisis une progression, ça joue drums + bass + accords en boucle (Tone.js)
- [ ] Jam mode : génère des progressions aléatoires dans ta gamme
- [ ] Theory hints contextuels (pourquoi ces accords vont ensemble)
- [ ] Export / import JSON d'un son ou setlist
- [ ] Share link (encode le son dans l'URL, pas de backend nécessaire)
- [ ] Search avancée (par tag, key, BPM, difficulté)

### Phase 5 — Monétisation (semaine 7)
**Objectif** : on peut faire des sous.

- [ ] Auth Supabase (Google + email)
- [ ] Sync cloud des sons + sessions
- [ ] Tier Free vs Pro (limite à 10 sons gratuits, illimité Pro)
- [ ] Stripe checkout (4,99€/mois ou 39€/an)
- [ ] Landing page de vente avec témoignages futurs
- [ ] Onboarding flow propre

### Phase 6 — Plus tard
- App mobile (Capacitor ou React Native)
- Community : partage de setlists publiques
- Détection d'accords depuis un audio uploadé (lib externe ou backend Python)
- Plugin DAW Reaper ?
- Mode prof/élève (un prof partage des leçons)

---

## 5. Design system

### Palette
```
--bg            #0a0a0a   (noir profond, fond)
--surface       #141414   (cartes, panneaux)
--surface-2     #1c1c1c   (hover, élevé)
--border        #2a2a2a   (bordures subtiles)
--border-gold   rgba(212,175,55,0.15)
--text          #ffffff
--text-muted    #9a9a9a
--text-soft     #6a6a6a
--gold          #c9a961   (or chaud, doré principal)
--gold-bright   #f4d35e   (or éclatant, accents)
--gold-soft     #8a7548   (or atténué, hover, gradients)
--success       #4caf85
--danger        #d4685e
```

### Typographie
- **Display** : `'Cormorant Garamond'`, `'Playfair Display'` — serif élégant pour les titres importants et le branding
- **Body / UI** : `'Inter'` — sans-serif moderne, lisibilité parfaite
- **Mono** : `'JetBrains Mono'` — pour les accords (Em, Cmaj7...) et BPM

### Tailles
| Usage | Taille | Weight |
|---|---|---|
| H1 display | 48-64px serif | 600 |
| H2 section | 28-32px serif | 600 |
| H3 sub | 20px sans | 600 |
| Body | 15-16px sans | 400 |
| Caption | 12-13px sans | 400 |
| Chord name | 18-24px mono | 600 |

### Composants visuels
- **Cartes** : `bg-surface`, `border border-border`, `rounded-2xl`, `p-6`. Hover : `border-gold-soft`, légère élévation.
- **Boutons primaires** : `bg-gold text-black`, hover plus brillant
- **Boutons secondaires** : `border border-gold/30`, hover fill subtil
- **Inputs** : minimaux, bordure du bas seulement, focus = bordure gold
- **Sliders** : track gris fin, thumb doré rond
- **Ligne de séparation** : 1px gradient gold transparent au centre

### Iconographie
- Lucide React, stroke 1.5, taille 18-20px
- Couleur : `text-muted` par défaut, `text-gold` actif

### Animations
- Transitions : 200ms ease-out par défaut
- Hover scale : 1.02 max
- Page transitions : fade + slide léger 8px

---

## 6. Three.js : où exactement

### ✅ OUI — usages validés

1. **Hero du landing**
   - Guitare en lévitation au centre, tourne lentement, light qui pulse au rythme d'un riff démo
   - Particules dorées qui montent en background
   - Au scroll : la guitare se positionne en haut à gauche en miniature

2. **Background ambient du Dashboard**
   - 6 cordes horizontales qui vibrent doucement
   - Couleur : or désaturé sur noir
   - Réagissent légèrement quand tu cliques sur un accord ailleurs dans l'app

3. **Toggle Fretboard 3D (optionnel)**
   - Bouton "Vue 3D" sur la page Scales
   - Affiche le fretboard en perspective avec les notes en relief
   - Caméra rotatable pour voir sous différents angles
   - **Pas par défaut** — le 2D reste la vue principale

4. **Card hover effect**
   - Subtile parallaxe 3D au hover des chord cards (Vanilla CSS / Framer Motion suffit, pas Three.js)

### ❌ NON — où on évite la 3D
- Page Bibliothèque : besoin de scanner vite, 2D pur
- Page Accords (référence) : grilles 2D classiques, ultra lisibles
- Édition / formulaires : zéro 3D, juste de l'UI propre
- Mobile : 3D minimale (perf + lisibilité)

---

## 7. Structure de dossiers (projet React)

```
guitar-app/
├── public/
│   └── samples/              # samples audio .mp3
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── MobileNav.tsx
│   │       └── Layout.tsx
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Songs.tsx
│   │   ├── SongDetail.tsx
│   │   ├── SongNew.tsx
│   │   ├── Chords.tsx
│   │   ├── Scales.tsx
│   │   ├── Jam.tsx
│   │   └── Settings.tsx
│   ├── components/
│   │   ├── chord/
│   │   │   ├── ChordDiagram.tsx
│   │   │   ├── ChordCard.tsx
│   │   │   └── ChordPicker.tsx
│   │   ├── fretboard/
│   │   │   ├── Fretboard2D.tsx
│   │   │   └── Fretboard3D.tsx
│   │   ├── audio/
│   │   │   ├── AudioEngine.tsx
│   │   │   ├── Metronome.tsx
│   │   │   └── StrumPatternPlayer.tsx
│   │   ├── three/
│   │   │   ├── HeroGuitar.tsx
│   │   │   └── AmbientStrings.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Select.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── theory.ts          # logique de théorie musicale
│   │   ├── chordDatabase.ts   # 100+ accords précodés
│   │   ├── scaleDatabase.ts   # 10+ gammes
│   │   ├── audio.ts           # wrappers Tone.js
│   │   └── storage.ts         # wrappers Dexie
│   ├── stores/
│   │   ├── songsStore.ts
│   │   ├── practiceStore.ts
│   │   └── prefsStore.ts
│   ├── hooks/
│   │   ├── useAudio.ts
│   │   ├── useDailyPractice.ts
│   │   └── useStreak.ts
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.ts
│   └── main.tsx
├── tailwind.config.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 8. Déploiement

### Setup Vercel
1. Push sur GitHub
2. Connect Vercel au repo
3. Vercel build auto à chaque push sur `main`
4. Preview deploys auto sur chaque PR
5. Custom domain : achat `riff.app` ou `fret.app` (~50-80€/an)
6. Variables d'env : `VITE_OPENAI_KEY` (plus tard), `VITE_SUPABASE_URL` (plus tard)

### Performance budgets
- LCP < 2s
- Bundle initial < 200kb gzipped
- Three.js lazy-loaded (chunk séparé, chargé seulement sur landing + scales 3D)

---

## 9. Monétisation (préview, on en reparlera)

### Plans
- **Free** : 10 sons max, accès lecture aux 100 accords + 10 gammes, daily practice sans historique long
- **Pro 4,99€/mois ou 39€/an** : sons illimités, sync cloud, AI helper, backing tracks, jam mode complet, historique pratique illimité, export PDF setlists

### Acquisition
- TikTok / YouTube Shorts : tutos courts "comment ajouter ton son en 30 sec dans Riff"
- SEO : pages publiques "Accord Em — diagramme et exemples"
- Communautés guitare FR/EN sur Reddit, Discord

---

## 10. Premières étapes (à valider)

**Si tu valides ce plan, voilà l'enchaînement immédiat :**

1. **Tu valides** le nom (Riff.app ? Fret.app ? autre ?) et la direction visuelle (preview HTML en pièce jointe)
2. **Je scaffold** le projet React + Vite + Tailwind dans `~/Desktop/Projets/Guitar-App/` avec la structure de dossiers ci-dessus
3. **Je code la Phase 1** : layout + bibliothèque + 1 page CRUD + 1 chord diagram
4. **On itère** : tu testes, tu me dis ce qui est nul, je fix
5. **On déploie sur Vercel** dès que le squelette tient debout (genre fin de Phase 1)

---

## Questions encore ouvertes (à trancher quand on attaque)

- Compte / pas de compte en Phase 1 ? *(reco : pas de compte, tout en local, on rajoute en Phase 5)*
- Lyrics affichés ou pas en Phase 1 ? *(reco : oui, optionnel)*
- Détection d'accords depuis audio uploadé ? *(reco : Phase 6, c'est lourd)*
- Mode collaboratif (un son partagé entre 2 personnes en édition) ? *(reco : pas pour la v1)*
- Backend pour stockage cloud dès maintenant ou plus tard ? *(reco : plus tard, IndexedDB suffit largement)*

---

*Plan v0.1 — itérable. Tu commentes, tu coupes, tu rajoutes, on relance.*
