# Audit responsive mobile-first — RiffLab (2026-06-16, session 29bis)

> Méthode : audit **code-level** des pages autorisées (sess 29 tourne en
> parallèle sur les fichiers riffs/social → non touchés). Lecture complète
> de chaque page + composants partagés, raisonnement aux 5 breakpoints
> (375 / 414 / 768 / 1024 / 1280). Légende sévérité :
> 🔴 critique (cassé/inutilisable mobile) · 🟠 important (gênant) · 🟡 cosmétique.

## Verdict global

**La fondation mobile est déjà solide** (sessions 26-27 ont fait le gros) :
- `body` tue le tap-delay iOS (`touch-action: manipulation`), `-webkit-tap-highlight-color: transparent`.
- `Layout` réserve `pb-[calc(72px+env(safe-area-inset-bottom))]` → le contenu n'est jamais masqué par la MobileNav.
- `Sheet` = bottom-drawer mobile avec drag handle + safe-area, modal centré desktop. Très bon.
- Grilles partout en mobile-first (`grid-cols-1` base → `sm:`/`md:`). Aucune grille multi-colonnes piégée au base sur les pages de contenu.
- Barres de filtres en `-mx-2 overflow-x-auto px-2` → pas d'overflow horizontal.
- Fretboards en `min-w-[640px]` dans conteneur `overflow-x-auto` + gradient fade : scroll horizontal **assumé** (un manche 6 cordes × 12 cases n'est pas lisible compressé à 375px).
- Toasts en `top-4 right-4 z-[200]` → jamais derrière la MobileNav.
- Focus rings clavier, skip-link, `prefers-reduced-motion` gérés.

Donc l'app n'a **pas** de gros trou responsive. Ce qui manque pour le feeling
« vraie app mobile » est de la **finition** : feedback tactile, états de
hover qui collent au touch, glow de nav active, états loading, et ~6 fixes
ponctuels de tap-target / theming.

---

## Composants partagés

### Card (`src/styles/globals.css` `.card` / `.card-hover`)
- 🟠 `.card-hover` applique `hover:-translate-y-0.5 hover:border-gold-soft`. Sur tactile, le hover « colle » après le tap (sticky hover) → la carte reste surélevée/dorée jusqu'au prochain tap ailleurs. À gater en `@media (hover:hover)`.
- 🟡 Pas de feedback de tap (`active:scale`) → manque le « rebond » natif.
- 🟡 Padding fixe `p-6` (24px) même à 375px.

### Button (`src/components/ui/Button.tsx`)
- 🟡 Pas d'état `loading` (spinner) — demandé au brief. Les appels async (générer progression, partager…) n'ont pas de feedback inline.
- 🟡 Pas de variant icon-only normalisé (taille carrée 44px).
- 🟡 Pas de haptique (`navigator.vibrate`) sur tap primaire. Déjà `whileTap scale` OK.
- ✅ Tailles tactiles correctes : `md` = `h-11` mobile / `h-10` desktop, `lg` = `h-12`.

### Toggle (`src/components/ui/Toggle.tsx`)
- 🟠 Le commentaire annonce « wrapper hits the 44px tap target via padding » mais **il n'y a pas de padding** : la zone tappable = la track 44×24px (24px de haut seulement). En dessous des 44px verticaux.

### Sheet / PageHeader / Skeleton
- ✅ Sheet : exemplaire (drag handle, safe-area, spring, ESC + backdrop).
- ✅ PageHeader : gear Réglages injecté mobile, titre `text-display-md`, actions shrink-0.
- ✅ Skeleton : shimmer présent.

### MobileNav (`src/app/layout/MobileNav.tsx`)
- 🟠 État actif = simple `text-gold`. Pas de barre/indicateur ni glow → l'onglet actif ne « ressort » pas assez (brief demande « gold underline + glow »).
- ✅ 5 items, safe-area-inset-bottom, backdrop-blur, icônes 20px.

### Layout (`src/app/layout/Layout.tsx`)
- 🟡 Pas de `<ScrollRestoration />` (brief Phase 4.4) → pas de scroll-to-top fiable à la navigation ni de restauration au retour.

---

## Pages — findings retenus (vérifiés en lisant le code)

### /stats — Stats.tsx
- 🟠 **L.161/174** : la courbe SVG 30j a des couleurs **hardcodées** (`#2a2a2a`, `#d4b76a`). Sur les thèmes non-dark-gold (Pure White, Sunset, Studio Blue, Néon…) les barres sont fausses/invisibles. → passer en `rgb(var(--border))` / `rgb(var(--gold))`.

### /strum-patterns — StrumPatterns.tsx
- 🟠 **L.69/84** : chips de filtre par tag en `h-8` (32px), sous le minimum tactile 44px. C'est le moyen principal de filtrer. → `h-9` (aligné sur les autres chips de l'app) au minimum.

### /jam — Jam.tsx
- 🟠 **L.197/219/241** : boutons de contrôle live (Tonalité 12 notes, Mode, Mood) en `h-9` (36px). Jam = usage live, tél sur stand → bumper à `h-11`.

### /setlists/:id/play — SetlistPlay.tsx & /plan — PracticePlan.tsx
- 🟡 Header sticky `top-0` avec marges négatives : en PWA standalone sur device à notch, passe sous la barre de statut. → `pt-[env(safe-area-inset-top)]` (no-op en navigateur, correct en PWA).
- ℹ️ Le « gros bouton Suivant » en bas de SetlistPlay n'est **pas** masqué par la MobileNav : la page est dans `<Layout>` qui réserve déjà le padding bas (contredit une alerte d'audit initiale — vérifié).

### Pages vérifiées **propres** (rien à corriger)
- **Landing** : hero `flex-col sm:flex-row`, titres responsive, cartes `grid-cols-1 → lg:grid-cols-3`.
- **Dashboard** : grilles responsive, 3D `md:block` (hors mobile), fretboard en scroll assumé avec fade.
- **Songs / SongDetail / SongNew** : FAB safe-area, grilles d'accords `grid-cols-2 → lg:grid-cols-6`, formulaire full-width + `focusScroll` anti-clavier.
- **Chords / Scales / Progressions / Composer** : chips scrollables, grilles mobile-first, modals via Sheet/Radix.
- **Setlists / SetlistDetail** : FAB safe-area, lignes de song en `truncate` (pas d'overflow), Sheet partagé.
- **Tuner** : sélecteur de cordes `h-14` (56px) — gros et tappable. Affichage note `text-[88px] md:text-[128px]`. RAS.
- **Metronome** : Start/Stop `h-14 w-full`, ±BPM `h-11 w-11`. RAS (padding `px-12` du slider = cosmétique mineur, non bloquant).
- **EarTraining** : grilles `sm:grid-cols-2`, gros bouton play 80×80. RAS.
- **About / RiffOfTheWeek / SharePreview / Hubs** : layouts en cartes responsive, CTA `h-12`. RAS.

---

## Plan de correction (cette session)

| # | Fix | Fichier | Sévérité |
|---|-----|---------|----------|
| 1 | Hover des cartes gaté `hover:hover` + tap `active:scale` + padding `p-5 md:p-6` | globals.css | 🟠 |
| 2 | Button : prop `loading` (spinner), icon-only, haptique tap | Button.tsx | 🟡 |
| 3 | Toggle : zone tactile 44px verticale | Toggle.tsx | 🟠 |
| 4 | MobileNav : indicateur + glow sur onglet actif | MobileNav.tsx | 🟠 |
| 5 | Layout : `<ScrollRestoration />` | Layout.tsx | 🟡 |
| 6 | Stats : couleurs SVG theme-aware | Stats.tsx | 🟠 |
| 7 | StrumPatterns : chips `h-8 → h-9` | StrumPatterns.tsx | 🟠 |
| 8 | Jam : contrôles live `h-9 → h-11` | Jam.tsx | 🟠 |
| 9 | SetlistPlay + PracticePlan : `pt-safe` sticky header | SetlistPlay.tsx, PracticePlan.tsx | 🟡 |

Non retenus (cosmétiques marginaux, risque/gain défavorable) : padding slider
Metronome, densité grille chord-picker Composer à 375px, line-clamp titres,
tailles `text-xs` de stats de jeu.
