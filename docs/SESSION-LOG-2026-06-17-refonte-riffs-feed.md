# Session refonte page Riffs — feed social mobile-first (2026-06-17)

> Objectif : transformer `/riffs` en VRAI feed type Twitter/Insta. Épurer
> le feature creep (hero géant, sidebar droite, badges strip, editor pick,
> carrousels) et passer à une grille de cards taille fixe cliquables.

## Coordination
Session hotfix comments 400 en parallèle → je me suis strictement limité à
`Riffs.tsx` + `components/riffs/*`. **Pas touché** : `socialApi.ts`,
`components/social/*`, `RiffDetail.tsx`.

---

## Phase 1 — Nettoyage

`Riffs.tsx` réécrit. **Supprimés** (composants + fichiers) :
- `MobileRiffsHero.tsx` (carrousels hero mobile)
- `RiffsSidebarRight.tsx` (sidebar droite desktop)
- `BadgesStrip.tsx`
- `EditorPickBanner.tsx`
- `CollectionsCarousel.tsx` (déjà orphelin)
- `RiffOfTheDayHero.tsx` (déjà orphelin)

Vérifié par grep qu'aucun n'était utilisé ailleurs (sauf entre eux). Bundle
principal : 1658 → 1616 Ko.

**Gardé** (utilisés hors scope, pas touchés) : `RiffTabModal` (RiffCollection /
RiffsByTag), `RiffFilters` (déjà un Sheet propre), `RiffEditor` (publication),
`LearnRiffMode` (page détail).

Tabs : 4 → **3** (Pour toi · Trending · Récents). L'onglet « Suivis » retiré
(épure, cf. règle « en cas de dilemme, épure »). La logique `following` reste
dans `communityRiffs.ts` (non touchée), juste non exposée.

Filtres : restent dans le **Sheet** `RiffFilters` (déjà mobile-friendly),
déclenché par l'icône à droite des tabs. Pas inline.

Retiré aussi le « Badges strip + bouton Actualiser » et le re-tri manuel
(`refreshBump`) — le feed se re-trie au changement de tab/filtre. Pattern
**frozenList** conservé (un like ne re-shuffle pas l'ordre : `likedIds` lu via
ref, hors deps du `useMemo`).

## Phase 2 — RiffCard taille fixe, click-to-detail

`RiffCard.tsx` entièrement réécrit en **card teaser** :
- Hauteur **fixe** : 320px mobile / 280px ≥sm (grille cohérente).
- **Toute la card cliquable** → `onOpenDetail()` (le parent fait
  `navigate('/riffs/:id')`). `role="link"` + `tabIndex` + Enter/Espace.
- Boutons/liens internes (like, save, ▶, avatar, tags) font
  `stopPropagation` → n'enclenchent pas la navigation.
- Layout vertical : header (avatar @user · ⭐ · date + badge niveau) → titre +
  artiste · BPM → tags (2 max) → **tab mini-preview** (flex-1, overflow hidden
  strict + double gradient fade) → footer actions.
- Footer : ❤ count · 💬 count · 🔖 · ▶. Tap targets ≥ 44px, counts compacts
  (`1.2k`). ▶ = preview audio en place (`onListen` → 8 notes via `playMidi`).
- Plus de boutons « Voir le tab » / « Apprendre » / « Partager » dans la card
  (tout est sur la page détail). La card est un pur teaser.
- Mode `compact` supprimé : une seule card pour toute la grille 1/2/3.

**Compat hors-scope** : `RiffCollection` et `RiffsByTag` partagent cette card et
passaient encore `onViewTab/onLearn/onShare/compact`. Pour ne pas casser leur
build (fichiers hors scope), ces props sont gardés **optionnels et ignorés**
dans l'interface. Ils afficheront donc la nouvelle card teaser — cohérent avec
le feed (« même RiffCard que le feed principal »).

## Phase 3 — Grid responsive + header sticky

- Conteneur : `mx-auto max-w-7xl`.
- Grille : `grid-cols-1` / `sm:grid-cols-2` / `lg:grid-cols-3`, `gap-4 md:gap-6`.
- Header **sticky** `top-0` backdrop-blur : titre + (desktop) « Partager mon
  riff » / (mobile) **FAB** flottant bottom-right au-dessus du MobileNav.
- Tabs underline scroll-x (`overflow-x-auto`, scrollbar masquée) + icône
  filtres (badge count si actifs).
- **Infinite scroll** : `IntersectionObserver` sur une sentinelle, +12 cards
  par palier (`rootMargin: 400px`). Reset à 12 au changement de tab/filtre.
  (Seed actuel = 10 riffs → tout s'affiche d'emblée, mais le mécanisme est en
  place pour le futur backend.)

## Phase 4 — Tests / vérif

- ✅ `npm run build` (tsc strict + vite) **vert**. Build = gate autoritaire.
- ⚠️ **Honnêteté** : pas de test visuel Playwright/preview possible dans cet
  environnement headless (le preview tool rend un `#root` vide ici, cf. mémoire
  projet). Vérification faite par revue statique des classes responsive :
  - `grid-cols-1 / sm:2 / lg:3` ⇒ 375px=1 col, 640px=2, 1024px=3, ≥1280
    plafonné `max-w-7xl`. ✓
  - Cards hauteur fixe `h-[320px] sm:h-[280px]`. ✓
  - Footer 4 actions (~154px) rentre dans la card 375px (~343px utile). ✓
  - Header tabs `overflow-x-auto` ⇒ scroll-x si étroit, pas d'overflow viewport. ✓
  - Click card → nav ; actions `stopPropagation` ⇒ ne navigue pas. ✓ (revue code)
  - FAB mobile `md:hidden`, offset au-dessus du MobileNav. ✓
  - **À confirmer à l'œil par Melvin** sur device réel (surtout 375px) une fois
    pull + dev relancé.

## Fichiers touchés
- `src/pages/Riffs.tsx` (réécrit)
- `src/components/riffs/RiffCard.tsx` (réécrit, taille fixe)
- supprimés : MobileRiffsHero, RiffsSidebarRight, BadgesStrip, EditorPickBanner,
  CollectionsCarousel, RiffOfTheDayHero

---

✅ Mergé dans main (82f7b04).

**Traçage merge (procédure fetch→merge→build→push)** :
- SHA d'`origin/main` **pullé/mergé AVANT mon merge** : `91cc1f2`
  (tip de la session hotfix comments 400 : commits 220e3a9 + 15d7153 +
  91cc1f2, fichiers socialApi.ts / CommentsSection.tsx — non touchés par moi
  → zéro conflit).
- `git fetch origin` → `git merge --no-ff origin/main` → `npm run build` (vert)
  → `git push origin <branche>:main`.
- Résultat du push de la refonte : `82f7b04`. Doc finale : `b508f93`.
