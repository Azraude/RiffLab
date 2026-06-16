# Session 29 — Refonte Riffs en plateforme sociale

> Branche `claude/trusting-moore-b4036b`. Continue sess 28.
> 7 phases, 17-22h estimées. Brief autorise STOP après Phase 4 ou 5.

## 🔴 BUG BLOQUANT EN TÊTE
_(à compléter)_

---

## Phase 0 — Audit existant ✅

### Composants riffs existants (sess 27)
- `RiffCard.tsx` — card complète feed mode full-width
- `RiffPlayer.tsx` — player synchronisé (speed pills, loop, métronome)
- `RiffFilters.tsx` — Sheet de filtres avancés
- `RiffTabModal.tsx` — modal tab horizontal scroll
- `LearnRiffMode.tsx` — overlay focus apprendre
- `RiffOfTheDayHero.tsx` — hero gradient gold (déterministe par jour)
- `CollectionsCarousel.tsx` — scroll horizontal collections curées
- `RiffEditor.tsx` — wizard 3 steps création
- `BadgesStrip.tsx` — affichage badges unlock

### Tables Dexie existantes (v14)
- `masteredRiffs { id, masteredAt, playCount }` (sess 27)
- `userRiffs { id, title, ..., level, createdAt, updatedAt }` (sess 27)
- `userBadges { slug, unlockedAt }` (sess 27)
- `riffLikes / riffBookmarks / riffRatings` (sess 17+)

### Auth & Supabase
- `src/lib/supabase.ts` configuré
- `src/stores/authStore.ts` — magic link + Google OAuth + onAuthStateChange
- `isSupabaseConfigured` flag pour gating

### Page Riffs.tsx actuelle
- Layout `max-w-3xl mx-auto` centré (bords vides desktop = "blog")
- Hero "Riff du jour" + BadgesStrip + CollectionsCarousel **AVANT** le feed
- Tabs underline Pour toi/Trending/Récents
- Filtres Sheet
- Feed vertical de RiffCard full-width

### Ce qu'on garde tel quel
- Tous les composants riffs (Card en mode compact via prop, Player, Modal,
  Editor, Learn, Filters, BadgesStrip)
- Auth Supabase + RiffOfTheDay (sera dans sidebar right au lieu de hero)
- Collections (sidebar right + page collection détail intacte)
- Dexie tables locales (masteredRiffs, userRiffs, userBadges)

### Ce qu'on REFACTOR
- Layout `Riffs.tsx` : `max-w-3xl` → grid 3 cols `[main_feed | sidebar_right]`
  (sidebar gauche existe déjà dans `<Layout>`)
- RiffCard : ajout prop `compact` pour mode grille 2 cols
- Move RiffOfTheDayHero + CollectionsCarousel + BadgesStrip → sidebar right

### Ce qu'on AJOUTE
- Backend Supabase : 11 tables + RLS + triggers XP
- `src/lib/socialApi.ts` — wrappers Supabase
- `src/lib/xpSystem.ts` — niveau riffeur
- Pages : `/u/:username`, `/leaderboard`, `/battle`, `/riffs/tag/:tag`,
  `/riffs/editor-picks`
- Components : `RiffsSidebarRight`, `FollowButton`, `RiffsBattleCard`,
  `NotificationBell`, `EditorPickBanner`, `ActivityFeed`
- Activity feed widget Dashboard + sidebar right
- Notifications drawer
- Hashtags cliquables sur RiffCard tags

---

## Phase 1 — Backend Supabase 🟡 en cours

_(à compléter)_

---

## Stratégie pour cette session

Objectif réaliste : **Phases 0-4 propres** + phase 5/6 partielle si temps.
Phase 7 (editor picks) reportable en sess 30. Le brief le permet.
