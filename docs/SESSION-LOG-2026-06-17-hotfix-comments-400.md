# Session hotfix 400 comments riffs (2026-06-17)

> Bug : click sur un riff seed (`cr-sevennation`, `cr-iron`, `sw-stairway`…)
> → flood console `GET .../comments?...&riff_id=eq.cr-sevennation 400`.
> Cause : `riff_id` est UUID-only en DB Supabase ; les slugs seed → 400.

## ⚠️ Découverte importante : le fix avait RÉGRESSÉ sur main

Phase 0 (check de l'existant) : le fix avait bien été fait une 1re fois par une
session parallèle (commit `220e3a9`). **MAIS au moment de cette session,
`origin/main` était à `6a2b05f` et ne contenait PLUS le fix** — `socialApi.ts`
n'avait plus aucun guard `isSeedRiff`, `getComments` querytait sans garde.

Cause de la régression : une autre session (`2cf3060` "fix(dashboard):
motion.line → motion.path") a poussé sur main une branche qui, au merge, a
**écrasé** `socialApi.ts` + `CommentsSection.tsx` avec une version pré-fix (et a
au passage reverté le fix WebGL DisposeOnUnmount d'une session précédente — voir
note plus bas). Bug 400 de nouveau LIVE sur main.

➡️ J'ai donc **ré-appliqué le fix** (ce n'était plus de la simple consolidation).

## Ce qui a été (ré)appliqué

### `src/lib/socialApi.ts`
- Helpers `isUUID()` / `isSeedRiff()` (UUID v4 strict) + `SEED_RIFF_READ_ONLY`
  + `seedReadOnlyError()`.
- Guards `isSeedRiff` early-return sur **toutes** les fonctions atteignables avec
  un riffId seed :
  - `getComments` → `{ data: [], error: null }` (source du bug 400). ✓
  - `postComment` → `seedReadOnlyError()`. ✓
  - `getRiff` → early-return (évite 400 sur `id`). ✓
  - `likeRiff` / `unlikeRiff` / `bookmarkRiff` / `unbookmarkRiff` → gardés. ✓
- `getLikesCount` / `getCommentsCount` non gardés mais appelés uniquement via
  `getRiff` (gardé) ou avec des UUIDs DB → jamais atteints avec un slug seed.

### `src/components/social/CommentsSection.tsx`
- `isSeed = isSeedRiff(riffId)` : skip le query Supabase dans l'effet ET message
  gracieux dédié (Card "exemple intégré" + lien `/riffs`).

### Audit de couverture (grep exhaustif)
- `.eq('riff_id', …)` hors socialApi : **aucun**.
- `social/*` qui call Supabase avec un riff_id : seul `CommentsSection` (géré) ;
  `NotificationBell` / `ActivityFeedWidget` queries par `user_id`/`author_id`.
- Appelants hors socialApi de `likeRiff/bookmarkRiff/getRiff` : **aucun** — les
  like/bookmark des cards passent par **Dexie** (`@/lib/db`), donc les seeds
  likent en local sans toucher Supabase (fallback Phase 1.3 déjà effectif).

## Note coordination (hors scope mais à signaler)
Le commit `2cf3060` d'une autre session a **reverté le fix WebGL
`DisposeOnUnmount`** (libération du contexte WebGL au démontage) que j'avais
livré pour l'écran noir, et l'a remplacé par un fix `motion.line → motion.path`
sur le Dashboard. Le kill-switch `useCanRender3D` reste en place comme filet.
**Je n'y ai pas touché** (hors scope de ce hotfix) — à valider par Melvin que
l'écran noir reste bien réglé avec leur approche.

## Tests
- ✅ `npm run build` vert.
- Audit de code conclusif : aucune query Supabase avec un riff_id seed ne part
  → plus de 400 au click sur un riff démo.
- Tests navigateur non rejouables en headless ici (preview = `#root` vide).

## Procédure merge (traçage SHA)
- `git fetch origin` → `origin/main` **AVANT merge** : `6a2b05f`
  (contenait la régression du fix comments + le revert WebGL).
- `git merge --no-ff origin/main` (le merge a appliqué la régression de main) →
  **ré-application du fix par-dessus** → `npm run build` (vert) →
  `git push origin <branche>:main`.

---

✅ Mergé dans main (2bcca30). SHA d'`origin/main` pullé avant merge : `6a2b05f`
(qui avait la régression). Fix ré-appliqué par-dessus, build vert. Vérifié
post-push : `git show origin/main:src/lib/socialApi.ts` contient bien les guards
`isSeedRiff` (8 occurrences). Bug 400 comments de nouveau réglé sur main.
