# Session 30 — Social wiring + seed démo

> Branche `claude/trusting-moore-b4036b`. Continue sess 29.
> Coordination : sess 29bis tourne en parallèle sur `feat/responsive-refonte`
> et ne touche PAS RiffEditor/RiffDetail/socialApi/supabase. Dashboard
> est sa zone.

## 🔴 BUG BLOQUANT
_(à compléter)_

---

## Phase 0 — État au démarrage

- HEAD : `2364245` (fin sess 29)
- `socialApi.ts` : `publishRiff`, `getComments`, `postComment`,
  `deleteComment`, `unlockBadgeServer` déjà définis ✅
- `RiffEditor` save Dexie local seulement (`userRiffs` table v13)
- `RiffDetail` section commentaires = placeholder
- Pas de streak store
- Pas de widget activity feed
- `src/components/social/` : `FollowButton`, `NotificationBell`

---

_(tâches au fil de l'eau)_
