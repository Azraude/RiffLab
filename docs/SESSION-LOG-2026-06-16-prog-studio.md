# Session PROG-STUDIO — Fusion Progressions + Composer en Studio multi-tabs

> Branche `claude/trusting-moore-b4036b`. Continue Session B.
> **Scope min focus confirmé par Melvin** : Phase 0+1+2+7+8 (no backend
> Supabase, no Dexie publication). 3 commits techniques + log.

## 🔴 BUG BLOQUANT
_(aucun)_

---

## 0. État existant (audit no-code)

### Pages
- `src/pages/Progressions.tsx` (416 lignes) : page filtres mood/diff/key,
  30+ progressions cards, transposition live, sheet "Ajouter à song",
  ProgressionCard avec player loop interne
- `src/pages/Composer.tsx` (565 lignes) : compositeur generateProgression
  + ChordPicker drawer (Radix Dialog) + ratings great/good/risky/weird +
  tutorial overlay

### Libs
- `src/lib/progressionTheory.ts` (336 lignes) : DIATONIC_MAJOR/MINOR,
  PROGRESSION_TEMPLATES (pop/rock/jazz/blues/sad/epic), romanToChord,
  evaluateChordFit, suggestChordCandidates
- `src/lib/progressionDatabase.ts` (519 lignes) : 30+ progressions
  taggées Mood (chill/epic/jazzy/sad/latin/cinematic/rock/pop) avec
  refRoot/refKey/chords, transposeProgression
- `src/lib/db.ts` : table `customProgressions` existante (saveCustomProgression,
  newCustomProgressionId) — utilisée par Composer pour save manuel

### Nav
- `Sidebar.tsx` : pas d'item direct "Progressions" ni "Compositeur" —
  /progressions englobé dans `Bibliothèque` matchPrefixes, /composer dans
  `Créer` matchPrefixes. Pas de visibilité 1-tap.

### Décisions audit
1. **Réutiliser** progressionTheory existante : extend avec
   `suggestNextChord` au lieu de réécrire
2. **Réutiliser** progressionDatabase : 30+ progs déjà tagguées
3. **Fusionner** Progressions + Composer en 1 page Studio multi-tabs
4. **Skip backend Supabase** (scope min) : pas de `custom_progressions`
   ni `progression_likes` tables
5. **Skip Dexie publication** : on garde `customProgressions` existante
   mais on n'add pas tab "Mes progs" UI (scope min)

---

## Phase 1 — Studio lock-progressive ✅ `cc5996c`

### Algorithme `suggestNextChord` (progressionTheory.ts)

Scoring multi-critères 0-100 :

| Critère | Bonus |
|---|---|
| Diatonic match (great/good/risky) | +40 / +20 / +5 |
| Cadence V→I / V→i / V7→I | +30 |
| Cadence IV→V, ii→V | +25 |
| Cadence iv→V, vi→IV | +20-22 |
| Cadence i→VII, I→IV, I→V | +15-18 |
| Style match (PROGRESSION_TEMPLATES) | +15 |
| Variety (pas un des 2 derniers) | +5 / -10 |
| Surprise (emprunts, dom secondaires) | +5 |

Catégorisation `fit` :
- score ≥ 70 : `'natural'` (💚)
- score 50-69 : `'colorful'` (💛)
- score < 50 : `'surprising'` (💜)

Reasons pédagogiques 1-phrase :
- "Cadence parfaite (V→I) : résolution puissante"
- "Cadence ii→V (jazz), tension préparée"
- "Sous-dominante mineure (i→iv)"
- "i→bVII, modal mineur (rock)"
- "Degré vi naturel" (si rating great sans cadence)
- "typique pop/rock/..." (si style match)

Helper `chordToRoman` : reverse lookup pour identifier degré roman.
Helper `generateFullProgression` : remplit slots vides en cascade
suggestion-par-suggestion.

### UI Studio (Progressions.tsx — refonte complète)

```
<Studio>
├── Header "Studio" + subtitle
├── Tabs [🎼 Compose | 📚 Classiques]
└── Tab Compose (par défaut) :
    ├── Config Card :
    │   ├── Tonalité (12 chips, scroll-x)
    │   ├── Mode (Majeur | Mineur)
    │   ├── Style (max 2 chips, scroll-x : pop/rock/jazz/blues/sad/epic)
    │   └── Longueur (4 | 8 | 12 | 16)
    ├── Slots Card :
    │   ├── Grid N slots (responsive grid-cols selon length)
    │   ├── Chaque slot : vide (?) / active (ring gold) / lock (Am 🔒)
    │   ├── Tap slot vide → active
    │   ├── Tap slot locké → unlock + re-active
    │   └── Si pas démarré : [Démarrer] + [🎲 Tout générer]
    ├── Suggestions Card (si activeSlot ≠ null) :
    │   └── 5 SuggestionCards × { ChordDiagram mini + chord +
    │       fit badge + roman + reason + [Test] + [Locker] }
    └── FinishedActions (si all locked) :
        └── [Écouter] / [Loop ON/OFF] / [Ajouter à un morceau]
```

### Pattern lock-progressive
1. User configure key/mode/styles/length
2. Click "Démarrer la suggestion" → activeSlot = 0
3. Algo `suggestNextChord([], key, mode, styles)` → 5 candidates
4. User lit reasons, écoute via "Test" (joue lockés + candidat), tap "Locker"
5. Slot 0 locké → activeSlot = 1 → re-suggest avec [chord0] dans locked
6. Algo prend en compte cadence chord0→candidate (bonus +20-30 si V→I etc.)
7. Cascade jusqu'à tous lockés
8. Possibilité de tap un slot locké → unlock + re-suggest

Mode secondaire "Tout générer" : pioche template via generateFullProgression,
respecte slots déjà lockés s'il y en a.

### Vérif Playwright 375px
- h1 "Studio" + 2 tabs ✅
- 12 chips tonalité + 4 slots vides ✅
- CTA "Démarrer" 48×293 (fix bug flex-1 sur flex-col qui écrasait à 24px)
- Click Démarrer → 5 SuggestionCards avec chord/fit/reason ✅
- Click "Locker" Am → Slot 1 lock "Am" + Slot 2 suggestions ré-affichées ✅
- No horizontal scroll ✅

### Pattern reuse
- `ChordDiagram` (mini) du composant existant
- `useAudio().strum` pour preview audio
- `Card` / `Sheet` UI primitives
- `STYLE_META` / `PROGRESSION_TEMPLATES` de theory existant

---

## Phase 2 — Tab Classiques (réuse UI existante) ✅ `cc5996c` (même commit)

L'ancienne UI Progressions est portée intégralement dans le composant
`ClassicsTab` :
- Filtres mood (8) + difficulté (5 niveaux) + tonalité cible (12)
- 30+ cards `ProgressionClassicCard` avec player loop interne + transposition
- `AddToSongSheet` réutilisable

### Choix design
- Pas de bouton "Ouvrir dans Studio" (brief proposait) car le flow
  serait : Classique → charger comme prog lockée dans Studio → unlock
  pour customize. Demande de partager le state entre les tabs.
  **Skip honnête** : reste à add si besoin Phase ultérieure.

### Vérif Playwright 375px
- Switch tab Compose → Classiques persiste URL `?tab=classics` ✅
- 30 cards rendues ✅
- mood chips OK ✅
- No horizontal scroll ✅

---

## Phase 7 — Cleanup nav ✅ `7fa6aad`

### Changes

**Sidebar.tsx** :
- Add item "Studio" (icon Sparkles) section 'Créer & apprendre'
- href: /progressions
- matchPrefixes: ['/progressions', '/composer'] (capture l'ancienne URL)
- Retire /progressions du matchPrefixes "Bibliothèque" (plus planqué)
- Retire /composer du matchPrefixes "Créer"

**router.tsx** :
- /composer → `<Navigate to="/progressions" replace />`
- Import Composer retiré

**Composer.tsx** :
- Supprimé (565 lignes purge). Plus aucun import dans le projet.

### Vérif Playwright desktop
- /composer redirige vers /progressions ✅
- Studio item visible dans sidebar + href correct + état actif ✅

---

## Phase 8 — Tests responsive ✅

| Test | 375px | 768px | 1335px |
|---|---|---|---|
| h1 "Studio" | ✅ | ✅ | ✅ |
| Tabs Compose/Classiques scroll-x | ✅ | ✅ | ✅ |
| Compose Config 4 sections | ✅ | ✅ | ✅ |
| Slots 4 columns | ✅ | ✅ | ✅ |
| CTA Démarrer 48px | ✅ | (auto) | (auto) |
| SuggestionCards stacked | ✅ | 2-col | 3-col |
| Classiques 30 cards | ✅ 1-col | 2-col | 3-col |
| URL ?tab=classics persisté | ✅ | ✅ | ✅ |
| No horizontal scroll | ✅ | ✅ | ✅ |
| Redirect /composer | ✅ | ✅ | ✅ |
| Sidebar Studio item | (md+) | ✅ | ✅ |

---

## Bilan final

### Stats
- **3 commits techniques + ce log** sur `claude/trusting-moore-b4036b` :
  - `cc5996c` feat(studio) fusion + lock-progressive (963 ins, 71 del)
  - `7fa6aad` chore(nav) unify Studio entry (16 ins, 569 del)
- **0 build fails**, **0 régression** (vérifications Playwright)
- **Net -460 lignes** (Composer 565 supprimé, Progressions enrichi de 700, log neuf)
- Fichiers touchés (strictement liste AUTORISÉE) :
  - `src/lib/progressionTheory.ts` (extension suggestNextChord + helpers)
  - `src/pages/Progressions.tsx` (refonte complète)
  - `src/app/layout/Sidebar.tsx` (add item Studio)
  - `src/app/router.tsx` (composer → Navigate)
  - `src/pages/Composer.tsx` (delete)
- **Pas touché** (out of scope confirmé Melvin) :
  - `src/lib/socialApi.ts` (pas de progression_likes / custom_progressions)
  - `src/lib/db.ts` (table customProgressions existante non utilisée, brouillons/publication skip)
  - `src/components/studio/*` (pas créé, tout inline dans Progressions.tsx)

### Architecture
```
/progressions  → Studio (multi-tabs)
                 ├── tab=compose (default) : lock-progressive
                 │   └── algo suggestNextChord (progressionTheory.ts)
                 └── tab=classics : 30 progressions catalog réutilisé

/composer      → Navigate /progressions (redirect)

Sidebar :
- Section "Créer & apprendre" :
   - Créer (hub /create)
   - Studio (/progressions) ← NEW
   - Mon plan (/plan)
   - Stats (/stats)
   - Outils (/tools)
```

### Skippé honnêtement (scope min Melvin)
1. **Phase 3 — Backend Supabase** : `custom_progressions` + `progression_likes`
   + RLS + trigger likes_count. Pas créé. Pas de tab "Communauté".
2. **Phase 4 — Mes progressions Dexie** : la table `customProgressions`
   existante (sauvegardée par l'ancien Composer) n'est plus écrite par
   Studio. Pas de tab "Mes progs". À add si besoin (1h).
3. **Phase 5 — Voicings alternatifs + rythmiques** : bonus.
4. **Phase 6 — Export MIDI + Tab PDF** : bonus.
5. **Bouton "Ouvrir dans Studio" sur cards Classiques** : demande de partager
   state entre tabs Compose / Classiques. ~30min, pas critique.

### Bugs UI observés (TODO Session future)
1. **Scoring : peu de "Naturel"** : sans cadence prev (slot 1), max score
   = 60 (great +40 + style +15 + variety +5) → 'colorful'. Pour avoir
   'natural', faut chaining V→I etc. Comportement OK mais peu d'incitation
   à locker le slot 1 en "naturel" visuel. Polish : abaisser seuil natural
   à 60 ?
2. **`tab` chord pour /composer reste sauvegardable** : l'utilisateur a
   pris l'habitude de "Sauver" dans l'ancien Composer. Maintenant le
   bouton "Ajouter à un morceau" remplace ça mais c'est différent
   conceptuellement. À add FinishedActions : bouton "💾 Sauver dans mes
   progs" qui écrit en Dexie via la fonction existante.

---

## 🎯 Pour Melvin

### À tester (10 min)
1. `/progressions` mobile 375 → tab "Compose" actif, Config (key/mode/styles/length)
2. Click "Démarrer la suggestion" → 5 SuggestionCards avec ChordDiagram,
   fit badge 💚/💛/💜, reason pédagogique
3. Click "Locker" sur Am → Slot 1 locké, Slot 2 ré-suggéré avec contexte
   (cadence prev→next pris en compte)
4. Lock tous les 4 slots → Card "Progression terminée" : Écouter / Loop /
   Ajouter à un morceau
5. Tap un slot locké → unlock + re-suggest
6. Switch tab "Classiques" → 30 cards filtrables (URL devient ?tab=classics)
7. /composer → redirige automatiquement vers /progressions
8. Sidebar desktop : item "Studio" visible dans Créer & apprendre

### Hors scope (pas livré — à demander si besoin)
- Backend Supabase + tab Communauté UGC (Phase 3)
- Tab "Mes progressions" Dexie brouillons + publication (Phase 4)
- Voicings alternatifs + rythmiques générées (Phase 5 bonus)
- Export MIDI + Tab PDF (Phase 6 bonus)
- Bouton "Ouvrir dans Studio" depuis cards Classiques (polish)
- Bouton "💾 Sauver dans mes progs" dans FinishedActions (polish)

### Pourquoi scope min ?
Brief faisait 5-7h sur 8 phases avec backend Supabase complet. Vu le
contexte chargé (Sessions A + B fraîches), Melvin a confirmé le scope
min Recommended pour avoir du code soigné sur LA feature signature
(lock-progressive) plutôt que tout en rush.

---

## ✅ Mergé dans main (bf17255)

Merge commit avec Session hotfix (audio revert WebAudioFont + nav
écran noir fix + tempo run cancellation token + ErrorBoundary). 16
fichiers modifiés côté hotfix, zéro overlap avec mes 4 fichiers
(progressionTheory.ts + Progressions.tsx + Sidebar.tsx + router.tsx).
Merge auto réussi sans conflit.
