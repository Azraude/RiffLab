# Session A — Fix bug like + RiffCard mobile-first

> Branche `claude/trusting-moore-b4036b`. Continue sess 30bis.
> **4 phases du brief, 4 livrées. 3 commits + log. Build green à chaque.**
> Coordination 29bis OK (pas touché aux fichiers interdits).

## 🔴 BUG BLOQUANT
_(aucun)_

---

## Phase 1 — Fix bug "posts qui bougent au like" ✅ `4322760`

### Diagnostic
Le `useMemo` calculant `visible` (la liste affichée) avait `likedIds` +
`masteredIds` dans son dep array. Chaque like Dexie → `riffLikes` change
→ `likedIds` recompute → useMemo réévalue → `sortFeedRiffs` (algo "Pour
toi") re-shuffle l'ordre. Cards bougeaient visuellement.

### Fix : pattern frozenList (Twitter/Instagram)

`src/pages/Riffs.tsx` :
- 3 `useRef` (`likedIdsRef`, `masteredIdsRef`, `userLevelRef`) capturent
  les valeurs stale mais sont mis à jour en arrière-plan via useEffect
- `useState refreshBump` (compteur) pour déclencher un re-sort
  intentionnel au click du bouton
- `useMemo` dep array = `[filters, sort, refreshBump]` UNIQUEMENT
  (lint-disable react-hooks/exhaustive-deps justifié par commentaire
  inline)
- `sortFeedRiffs` lit `likedIdsRef.current` etc — capture du dernier
  refresh
- **Bouton "↻ Actualiser"** 36×36 rond discret à droite du BadgesStrip,
  aria-label + title explicites

Le `RiffCard` interne reste réactif via `useLiveQuery` (likes count +1
instant côté card), mais l'**ORDRE** de la liste parent est stable.

### Vérif Playwright /riffs
- 10 cards mode `full` (xl:hidden) visibles ✅
- Click Like sur Stairway (card #3) → **`orderStable: true`** ✅
- titlesBefore === titlesAfter (5 premières comparées) ✅

---

## Phase 2 — RiffCard mode `full` refonte mobile-first ✅ `984169d`

### Header — avatar + meta + badge
- **Avatar + @username cliquables** vers `/u/:username` (avant : juste
  décoratif). Stoppropagation pour pas trigger l'ouverture détail.
- Étoiles avec `aria-label="X étoiles sur 5"`
- Badge difficulté pill couleur reste top-right

### Caption + tags
- Caption `line-clamp-3` (avant : pas de clamp, captions longues
  explosaient la card)
- Tap caption (zone vide) → ouvre détail
- Tags + techniques cliquables vers `/riffs/tag/:tag` avec stopPropagation

### Mini-encart tab — POINT CRITIQUE FIX
**Avant** : tab preview avec overflow-hidden mais TabReader interne
pouvait propager un scroll-x qui conflictait avec scroll-y du feed.

**Maintenant** :
- `max-h-[80px] overflow-hidden` STRICT (vs max-h-[112px] avant)
- TabReader wrappé dans `<div className="pointer-events-none">` →
  ZÉRO interaction tactile sur le tab. L'user ne peut PAS swipe-x le
  preview, donc pas de conflit avec scroll-y du feed.
- Tap sur l'encart entier → ouvre détail
- lineHeight=12 beatWidth=11 (vs 14/12) pour plus compact

### Actions row — HIÉRARCHISÉE
**Avant** : 3 boutons grid 3-cols qui s'écrasaient sur mobile (labels
tronqués via `split(' ')[0]` → "Voir" sans contexte).

**Maintenant** :
- **CTA PRIMARY full-width** : "▶ Écouter le riff" (gradient gold,
  h-11, shadow-gold, active:scale-[0.99])
- **2 secondaires grid 2-cols** : "Voir le tab" / "Apprendre" (h-11)
- Hiérarchie visuelle claire = Écouter > Voir/Apprendre

### Footer social — MOBILE-SAFE
- **`formatCount()` helper** : 412 → "412", 1234 → "1.2k", 1500000 →
  "1.5M" → évite overflow horizontal sur mobile 375px
- `font-mono tabular-nums` pour stabilité visuelle
- SocialBtn `h-11` (≥44px tap target), `px-2` (vs px-2.5) pour gain de
  place sur 4 boutons + Share
- `active:scale-95` micro-feedback tap
- Heart / MsgCircle / Bookmark groupés à gauche, Share isolé droite

### Vérif Playwright
- Tab `overflowX: hidden, overflowY: hidden` STRICT ✅
- `hasHorizontalScroll`: false ✅
- TabReader wrapped pointer-events-none ✅

---

## Phase 3 — RiffCard mode `compact` polish desktop ✅ `9ebe9f3`

### Tags 3 → 2 max
- `slice(0, 2)` pour limiter à 2 chips visibles
- "+N" indicator si plus de 2 tags (text-soft, non cliquable)
- Gain visuel sur cards étroites 280-320px

### Tab preview : `pointer-events-none` wrapper
Cohérent avec mode full Phase 2 — STRICT no interaction tactile,
overflow-hidden + gradient fade right.

### CompactBtn — count caché par défaut, visible hover
**Avant** : count toujours visible à côté de chaque icône → 4 chiffres
sur card étroite = trop dense.

**Maintenant** :
- Count caché par défaut (`hidden group-hover:inline`)
- `title` attribute avec count formaté (1.2k) pour tooltip natif
- `aria-label` inclut le count pour a11y (lecteurs d'écran)
- Mobile/tablet sans hover → design épuré
- Desktop hover de la card → counts apparaissent
- `tabular-nums` pour stabilité visuelle

### Vérif Playwright @xl viewport
- compact card 315.5×235px ✅ (dans la fourchette 280-320 + height auto)
- tagCount: 2 ✅
- tabOverflow: hidden ✅
- tabReaderWrapped: true ✅
- hasHorizontalScroll: false ✅

---

## Phase 4 — Tests responsive + smoke ✅

### Tests menés
| Test | Résultat |
|---|---|
| Feed `/riffs` xl viewport | 10 full + 10 compact rendus (dual-render via CSS), pas de scroll horizontal ✅ |
| Bouton Actualiser présent | ✅ |
| Click Like → ordre stable | ✅ (Phase 1 fix confirmé) |
| Tab preview overflow hidden strict | ✅ (les 2 modes) |
| Tab preview pointer-events-none | ✅ (les 2 modes) |
| Tap targets ≥ 44px (h-11) | ✅ (full mode boutons + footer) |
| `/riffs/cr-stairway` non-régression | ✅ comments + no horizontal scroll |
| Sticky tab désactivé desktop (md:relative) | ✅ comportement voulu sess 30bis |

### Breakpoints validés
- xl ≥1280px : mode compact visible, 2-cols grid
- <xl : mode full visible, 1-col stack (testé via classes Tailwind +
  build green, viewport Playwright simulant md)

---

## Bilan final

### Stats
- **3 commits + ce log** sur `claude/trusting-moore-b4036b` + push main :
  - `4322760` fix(riffs) frozenList pattern (61 ins, 13 del)
  - `984169d` feat(riffs) RiffCard full mobile-first (107 ins, 35 del)
  - `9ebe9f3` feat(riffs) RiffCard compact polish (29 ins, 8 del)
- **0 build fails**, **0 régression** (vérifications Playwright)
- Fichiers touchés : strictement `Riffs.tsx` + `RiffCard.tsx` (respecté
  les fichiers interdits du brief)

### Pattern frozenList utilisé
3 `useRef` (stale values) + `useState refreshBump` (compteur) +
`useMemo` avec dep array intentionnellement restreint à `[filters, sort,
refreshBump]`. Le RiffCard interne reste réactif (useLiveQuery local
pour like count +1 instant), mais la POSITION dans la liste est figée
jusqu'au refresh explicite.

### Bugs UI observés pendant les tests (TODO Session future)
1. **Tab preview du mode full pourrait être plus court** : actuellement
   max-h-[80px], si un riff a beaucoup de notes sur la 1ère ligne, on
   coupe au milieu d'une mesure. Pas critique mais polish possible.
2. **CompactBtn count en hover seulement** : sur mobile (pas de hover),
   le count n'apparait jamais visuellement (seulement via aria-label).
   Compromis accepté (mode compact = desktop). Si on veut le count
   mobile, le card est trop étroite pour le faire propre.
3. **L'avatar du mode full n'a pas explicitement h-11** : c'est
   l'Avatar component qui fait 40×40. Tap target effectif via le Link
   wrapper = ~40px. Pattern Instagram accepté mais à <44px ; polish
   possible avec padding sur le Link.

---

## 🎯 Pour Melvin

### À tester (5 min)
1. `/riffs` → like un post du milieu → l'ordre NE BOUGE PAS ✅
2. Click bouton "↻" en haut du feed → re-trie intentionnel
3. RiffCard mode full : CTA gold "Écouter le riff" plus visible, "Voir
   le tab" + "Apprendre" en dessous
4. Footer social : counts en format "1.2k" si > 1000
5. Mobile DevTools 375px : pas de scroll horizontal, tap targets OK

### Hors scope (pas touché)
- RiffDetail.tsx (Session B)
- RiffPlayer.tsx (Session B)
- Backend / Supabase / Dexie (Session C)
- Tous les autres composants riffs (RiffFilters, RiffEditor,
  MobileRiffsHero, EditorPickBanner, BadgesStrip, RiffsSidebarRight,
  LearnRiffMode, RiffTabModal)

---

## ✅ Mergé dans main (9ebe9f3)
