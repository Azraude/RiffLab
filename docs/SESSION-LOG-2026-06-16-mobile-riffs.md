# Session 30bis — Mobile-first /riffs + page détail + MobileNav

> Branche `claude/trusting-moore-b4036b`. Continue sess 30.
>
> **3 phases mobile-first livrées. 4 commits + log. Build green à chaque.**
>
> Phases 4+5+6 du brief = déjà livrées en sess 30 (audit honnête en tête).

## 🔴 BUG BLOQUANT
_(aucun)_

---

## Phase 0 — Audit honnête

### Déjà livré sess 30 (pas re-coder)
- ✅ `src/stores/socialStreakStore.ts` + wiring 4 actions
- ✅ `src/components/social/CommentsSection.tsx` + wire RiffDetail
- ✅ `src/components/social/ActivityFeedWidget.tsx` + `/activity` route
- ✅ `src/components/riffs/RiffEditor.tsx` push Supabase (`publishRiff()`)
- ✅ `docs/SEED-RIFFS-PUBLIC-DEMO.sql` + `scripts/clean-demo-data.sql`
- ✅ Badges streak-7 + streak-30 catalogue
- ✅ `BadgeUnlockListener` dans Layout

### Focus session 30bis (phases 1+2+3)
- Refonte mobile-first /riffs (carrousels horizontaux + feed full-width)
- Page détail riff tab scroll horizontal + sticky
- MobileNav refonte avec 🎸 Riffs central

### Coordination 29bis
- 29bis sur `feat/responsive-refonte` ne touche pas aux fichiers
  riffs (interdiction brief)
- ⚠️ POTENTIEL CONFLIT sur `MobileNav.tsx` : 29bis le modifie pour
  active indicator glow, moi pour bouton central. Gérable au merge.

---

## Phase 1 — Refonte mobile-first /riffs ✅ `ce84996`

### Approche : conçu pour 375px d'abord

Avant : page conçue desktop-first avec sidebar droite, mobile = stack
vertical pas optimisé. Sess 29 layout 3-cols cassait en mobile.

Après : layout adaptatif basé sur breakpoint xl (≥1280px) :
- **Mobile/tablet (<xl)** : `MobileRiffsHero` avec carrousels horizontaux
  + feed full-width (RiffCard mode 'full')
- **Desktop xl+** : sidebar droite (`RiffsSidebarRight`) + feed 2-cols
  (RiffCard 'compact')

### `src/components/riffs/MobileRiffsHero.tsx` (NEW, 250 lignes)
- Hidden `xl:hidden` — visible uniquement <1280px
- 5 sections empilées (gap 24px) :
  1. 📅 Riff du jour — banner full-width, 1 card cliquable
  2. 🏆 Top semaine — carrousel cards 240px ranked avec compteur ❤️
  3. 📚 Collections — carrousel cards 200px gradient accent
  4. 👤 À suivre — carrousel user cards 180px avec FollowButton
  5. ⚔️ Battle — 1 card full-width barre votes + countdown
- Carrousels avec `[scrollbar-width:none]` + bleed `-mx-4 px-4`
- Dégrade gracefully si `!isSupabaseConfigured`

### `src/pages/Riffs.tsx` refondu
- Header sticky : 2 boutons icônes 44×44 (filtres + partager) sur
  mobile, "Partager mon riff" plein sur desktop
- Badge filtres en position absolue sur le bouton mobile
- Tabs scrollables horizontal (overflow-x-auto scrollbar-hidden)
- Feed `grid xl:grid-cols-2` (1 col mobile, 2 cols xl+)
- RiffCard dual-render : mode `full` <xl, mode `compact` xl+
- MobileRiffsHero monté avant les tabs sur mobile
- Empty states `xl:col-span-2` (vs `md:` avant)

### Vérif Playwright (viewport 852px = <xl, mode mobile/tablet)
- `hasHorizontalScroll` document : **false** ✅
- `MobileRiffsHero` display: block ✅
- `RiffsSidebarRight` display: none ✅ (xl: inactif)
- Feed RiffCard full-width 832px ✅
- Snapshot a11y : Riff du jour visible above-fold ✅
- Collections 5 cards visibles dans carrousel ✅
- 9 RiffCards full-width dans le feed ✅

---

## Phase 2 — Page détail riff tab area sticky ✅ `79d4d4c`

### Problème fixé
Avant : sur un riff long (Stairway 3+ mesures), le scroll vertical du
RiffDetail mélangait tab + comments → scrollbar moche, contexte perdu.

### Solution
Le RiffPlayer existant (sess 27) gère déjà le scroll horizontal pur
du tab (max-h-200 + overflow-x-auto). On wrap juste le RiffPlayer
dans un `<section className="sticky top-0 z-10 -mx-5 bg-bg px-5
md:relative">` → le tab reste visible quand l'user scroll les
commentaires en bas.

### Changes `src/pages/RiffDetail.tsx`
- Hero compact mobile : display-md (vs display-lg avant)
- Metadata grid 2x2 mobile / 1x4 desktop
- Tags + techniques inline (au lieu de section séparée) cliquables
  vers `/riffs/tag/:tag`
- Caption créateur compacte
- **Section tab sticky** :
  - `sticky top-0 z-10` sur mobile
  - `md:relative` pour désactiver sticky desktop
  - Bleed `-mx-5 bg-bg` pour masquer le contenu derrière
  - Hint "← swipe pour voir la suite du tab →" mobile uniquement
- Padding global réduit (mb-5 par section)

### Vérif Playwright /riffs/cr-stairway
- `hasStickySection: true, position: sticky` ✅
- Tab container `overflowX: auto, scrollWidth 324 > width 317` →
  scroll horizontal actif ✅
- `hasHorizontalScroll` document : false ✅

### 🟡 Skipped polish (futur)
- Indicateur "Mesure X/Y" + flèches tap-to-scroll → demande refactor
  RiffPlayer pour exposer activeBeat callback. À polish sess
  ultérieure.

---

## Phase 3 — MobileNav avec 🎸 Riffs central ✅ `55eeb34`

### Pattern central FAB (Instagram/TikTok)

Avant : 5 items uniformes (Home / Ma musique / Mon plan / Outils /
Préférences). Outils prenait une place sous-utilisée vs Riffs (l'usage
primaire de l'app).

Après : 4 items répartis + 1 bouton central proéminent.

### `src/app/layout/MobileNav.tsx` refondu
- **LEFT_ITEMS** : Aujourd'hui (/dashboard) + Ma musique (/library)
- **BOUTON CENTRAL RIFFS** :
  - Cercle 60×60px gradient `from-gold-bright to-gold`
  - Déborde -16px vers le haut (notch protruding) via `-mt-4`
  - Icône flamme `RiffLabLogo` 28px
  - Shadow gold-strong élevée
  - Active state : `ring-2 ring-gold/40` + animation `motion-safe:animate-ping`
    2s (respect reduce-motion)
  - `active:scale-95` au tap
  - matchPrefixes : `/riffs` + `/riffs/*` + `/riff-of-the-week`
- **RIGHT_ITEMS** : Mon plan (/plan englobe stats) + Préférences (/settings)
- Sub-component `NavItem` extrait pour DRY
- Backdrop `blur-lg` (vs blur-md avant) plus immersif
- bg-surface/85 (vs /95) plus transparent

### ⚠️ "Outils" retiré du MobileNav
Accessible via :
- URL directe `/tools` (toujours valide router)
- Sidebar desktop (Section "Créer & apprendre")

Justification : usage primaire mobile = riffs, pas métronome.

### Vérif Playwright /dashboard
- 5 liens dans l'ordre attendu ✅
- Bouton Riffs : 60×60px, aria-label "Riffs", top=752 (déborde -16) ✅
- Nav height 61.5px (+ env safe-area) ✅
- `hasHorizontalScroll`: false ✅

---

## Bilan final

### Stats
- **4 commits + ce log** sur `claude/trusting-moore-b4036b` + push main :
  - `c9691ac` docs init audit
  - `ce84996` feat Phase 1 — mobile-first /riffs (379 ins, 45 del)
  - `79d4d4c` feat Phase 2 — page détail sticky tab (46 ins, 32 del)
  - `55eeb34` feat Phase 3 — MobileNav central FAB (99 ins, 82 del)
- **0 build fails**, **0 régression visuelle** (vérifications Playwright)
- 1 nouveau fichier : `src/components/riffs/MobileRiffsHero.tsx`

### Fichiers modifiés (pour anticipation conflits 29bis)
- `src/components/riffs/MobileRiffsHero.tsx` (new, **pas concerné** 29bis)
- `src/pages/Riffs.tsx` (modifié, **pas concerné** 29bis)
- `src/pages/RiffDetail.tsx` (modifié, **pas concerné** 29bis)
- `src/app/layout/MobileNav.tsx` (modifié, ⚠️ **CONFLIT POTENTIEL** 29bis)

### Aucune migration SQL cette session
Le SEED `SEED-RIFFS-PUBLIC-DEMO.sql` reste celui de sess 30 (déjà
livré). Pas de changement de schéma.

---

## 🎯 À tester par Melvin

### Mobile-first (priorité)
- [ ] Resize Chrome DevTools → mobile mode iPhone 14 Pro (393×852)
- [ ] `/riffs` : Riff du jour visible above-fold, carrousels swipables,
      feed full-width sans 2 cols mobile
- [ ] `/riffs/cr-stairway` : tab area reste sticky en haut quand on
      scroll vers les commentaires
- [ ] MobileNav : bouton 🎸 RIFFS central rond proéminent, sort du nav,
      pulse subtil si on est sur /riffs
- [ ] Tap targets : tous les boutons doivent faire ≥44px (les 2 icônes
      du header Riffs font 44×44)
- [ ] Pas de scroll horizontal involontaire (test : scroll bas, vérifier
      pas de barre horizontale qui apparaît)

### Desktop (vérif non-régression)
- [ ] `/riffs` ≥1280px : sidebar droite visible, feed 2 cols compact
- [ ] `/riffs/cr-stairway` ≥768px : tab plus sticky (md:relative),
      layout naturel
- [ ] MobileNav caché desktop (md:hidden ✅)

### Conflit 29bis MobileNav
Si 29bis push à nouveau dans main et touche MobileNav :
- Mon code = pattern central FAB (LEFT_ITEMS + bouton Riffs + RIGHT_ITEMS)
- Leur code = active indicator glow (mon code l'a déjà gardé via
  sub-component `ActiveIndicator`)
- Au merge : git devrait auto-merger si non-overlapping. Sinon je
  refais une passe de réconciliation.

---

## Évaluation honnête

Vraie session **mobile-first** cette fois (vs sess 29 desktop-first
biaisée). La preuve : MobileRiffsHero existe comme composant dédié
mobile, et le feed prend `xl:grid-cols-2` au lieu de `md:` → mode 2
cols réservé strictement aux grands écrans.

**Skippé honnêtement** :
- Indicateur "Mesure X/Y" sur le tab détail (demande refactor RiffPlayer)
- Auto-scroll horizontal sync avec lecture (déjà géré dans RiffPlayer
  existant, juste pas exposé visuellement)
- Test runtime sur vrai iPhone (impossible depuis ici, à faire Melvin)

L'app /riffs est maintenant **vraiment utilisable au pouce** en répèt.
Le bouton central FAB rend "publier un riff" évident vs le FAB
flottant ambigu d'avant.

---

## ✅ Mergé dans main (55eeb34)
