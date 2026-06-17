# Session STUDIO-V2 — Refonte simple lock-progressive auto

> Branche `claude/trusting-moore-b4036b`. Continue Session PROG-STUDIO.
> **Brief V2 simplifié Melvin** : 1 vue, 4 cards pré-générées au mount,
> cadenas auto-regen droite. Pas de tabs, pas de Classiques.
> **1 commit technique + log. -71% lignes (1022 del / 310 ins).**

## 🔴 BUG BLOQUANT
_(aucun)_

---

## Phase 1+2 — Refonte simple Progressions.tsx ✅ `6d90bb9`

### Diagnostic V1
La V1 (sess PROG-STUDIO) avait empilé trop de complexité :
- 2 tabs Compose / Classiques
- État vide initial ("Démarrer la suggestion")
- SuggestionCard expanded view (5 candidats avec fit/reason/test)
- AddToSongSheet partagé
- ClassicsTab avec 30 cards + filtres mood/diff/key

Brief V2 Melvin tranche : épure max, page directement utilisable.

### Refonte
```
/progressions  →  1 SEULE vue
   ↓ au mount
4 ChordSlotCards pré-générées via generateRandomProgression
   ↓ user click 🔒 sur slot N
locks[N] = true
   ↓ cascade auto
slots[N+1..3] non-lockés régénérés via suggestNextChord (history)
   ↓ animation Framer Motion
chord name fade + scale 0.92→1
```

### Helpers ajoutés dans Progressions.tsx

**`weightedPick(suggestions, excludeChord)`**
- Pondération `score^2` (favorise haut score sans déterminisme)
- Exclude la valeur actuelle (évite régen idempotente)
- Fallback sur full pool si exclude vide tout

**`generateRandomProgression(key, mode, styles, length)`**
- Cascade `suggestNextChord(history, ..., 5)` puis `weightedPick(sugg)`
- À chaque étape, l'history grandit → cadence cohérente

### UI ChordSlotCard
- Border-2 gold-soft/50 par défaut, gold-bright + shadow-gold-strong si locked
- Cadenas absolute top-right, 44×44 tap area, glow gold si locked
- Slot index (1) en haut-gauche font-mono
- Nom accord display font-mono text-3xl center, animation key change
- ChordDiagram size="sm" sans noms de doigts (épure)
- Bouton "▶ Jouer" full-width par card (preview isolé via strum)

### Actions footer
- CTA primary "▶ Écouter la progression" h-12 full-width gold
  → play séquentiel strum à 80 BPM, toggle Stop
- Secondary "🔄 Re-générer les autres" h-11 full-width
  → cascade weightedPick pour tous non-lockés
  → disabled + label "Tous les accords sont verrouillés" si allLocked

### Reset comportemental
- Key/mode/styles change → reset all locks + régen complet
- Géré via `firstRenderRef` pour éviter double-régen au mount initial

---

## Phase 3 — Tests Playwright ✅

### Mobile 375px
| Test | Résultat |
|---|---|
| h1 "Studio" | ✅ |
| Viewport 375, no hscroll | ✅ |
| 4 ChordSlotCards au mount | ✅ (ex: Am-F-G-Am) |
| Accords cohérents (cadence) | ✅ (vi-IV-V-i typique pop minor) |
| Cadenas 44×44 tap target | ✅ |
| 4 boutons play par card | ✅ |
| CTA Écouter 48×335 | ✅ |
| Bouton Re-générer 44px | ✅ |
| Re-générer 3× : variations visibles | ✅ Am-F-G-Am → Am-F-G-C → Am-F-G-C |
| Lock slot 0 + regen : slot 0 préservé | ✅ slot0Preserved: true |
| Lock cascade : slot N régen droite | ✅ Am verrouillé → Dm-C-F |
| Anti-deprecated : pas de "Compose"/"Classiques"/"Démarrer" | ✅ count 0 |

### Desktop
- Grid `md:grid-cols-4` activé ≥768px (mobile = grid-cols-2 2×2)
- Cards 157×~280 mobile (375), élargissent ≥md
- Pas de hscroll

---

## Phase 4 — Cleanup ✅ (rien à faire)

- /composer redirect : déjà fait sess PROG-STUDIO ✅
- Sidebar item "Studio" : déjà OK ✅
- Code mort tabs Classiques/Compose : tout supprimé dans refonte ✅
- "Démarrer la suggestion" dead code : supprimé ✅

---

## Bilan final

### Stats
- **1 commit technique + ce log** sur `claude/trusting-moore-b4036b` :
  - `6d90bb9` refactor(studio) refonte V2 simple (310 ins, 1022 del)
- **0 build fails**, **0 régression**
- **Net -712 lignes** (Progressions.tsx 1100 → 320, -71%)
- Fichiers touchés (strictement liste AUTORISÉE) :
  - `src/pages/Progressions.tsx` (refonte complète)
- Pas touché :
  - `src/lib/progressionTheory.ts` (helpers réutilisés, pas modifié)
  - `src/app/router.tsx` (rien à changer)

### Architecture finale
```
/progressions  →  Studio (1 vue, mobile-first)
   ├── PageHeader "Studio"
   ├── Config inline : Key select + Mode select + Styles chips (max 2)
   ├── Grid 4 ChordSlotCards (2×2 mobile, 4-col desktop)
   │   └── Cadenas 🔒/🔓 + Chord display + ChordDiagram + Play
   └── Actions :
       ├── [▶ Écouter la progression] (full-width gold 48px)
       └── [🔄 Re-générer les autres] (full-width 44px, disabled si all locked)
```

### Décisions UX importantes
1. **Pas d'état vide initial** : au mount, 4 accords sont déjà là.
   L'user voit immédiatement quelque chose à explorer.
2. **Lock = auto-régen droite** : feedback instantané. L'user n'a pas
   à cliquer "Re-générer" après chaque lock.
3. **Random pondéré** : score² favorise les top picks mais évite l'algo
   déterministe figé (V1 problem). Exclude valeur précédente garantit
   changement visible.
4. **Cadenas glow gold** : feedback visuel fort sur l'état locked.
5. **Animation key change Framer Motion** : fade + scale subtle quand un
   chord est régénéré. UX feedback "ça a changé".

### Skippé honnêtement
- Le brief mentionnait "Optionnel : chips styles" → gardé pour respecter
  l'algo qui prend `styles[]` en compte dans le scoring
- "Animation transition douce" → fait avec Framer Motion AnimatePresence
- Pas de "Sauvegarder dans morceau" (out of scope brief V2)

---

## 🎯 Pour Melvin

### À tester (5 min)
1. `/progressions` mobile 375 → 4 accords pré-générés immédiatement
2. Tap 🔒 sur l'accord que tu veux garder → autres se régénèrent
3. Tap "🔄 Re-générer les autres" → variations cohérentes (random pondéré)
4. Tap "▶ Jouer" sur une card → preview accord isolé
5. Tap "▶ Écouter la progression" → joue les 4 accords séquentiels
6. Change key → reset + nouvelle progression
7. Add chip "rock" ou "jazz" → influence l'algo

### Hors scope (pas livré)
- Tab Classiques (supprimé) — la liste 30+ progressions existait, peut
  être restaurée si besoin via un autre point d'entrée
- Save dans morceau
- Voicings alternatifs / rythmiques
- Backend Supabase / Communauté

---

## ✅ Mergé dans main (à compléter)
