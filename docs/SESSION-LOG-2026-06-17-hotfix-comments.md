# Session HOTFIX — Bug 400 comments Supabase pour riffs seed

> Branche `claude/trusting-moore-b4036b`. Fix urgent + non-régressif.
> Coordination : ne pas toucher Riffs.tsx / RiffDetail.tsx / components/riffs/*
> (session refonte Riffs en parallèle).

## 🔴 BUG BLOQUANT (corrigé)

**Symptôme** : click sur n'importe quel riff seed (`cr-iron`, `cr-stairway`,
`cr-smoke`, etc.) → flood console :
```
GET /comments?riff_id=eq.cr-iron 400 (Bad Request)
```

**Cause racine** : la table Supabase `comments` a sa colonne `riff_id` typée
en UUID. Les seeds intégrés au bundle (`src/lib/communityRiffs.ts`) utilisent
des slugs courts (cr-iron) pas des UUIDs → Postgres rejette le WHERE.

---

## Phase 1 — Diagnostic ✅

### Fonctions Supabase prenant un `riffId` (toutes potentiellement vulnérables)

| Fonction | Call site critique | Bug observé |
|---|---|---|
| `getComments(riffId)` | `CommentsSection.tsx` (RiffDetail mount) | ✅ flood 400 |
| `postComment(riffId, text)` | submit form CommentsSection | latent (user pas connecté actuellement) |
| `getRiff(id)` | seul `socialApi.ts` interne | défensif |
| `likeRiff/unlikeRiff(riffId)` | pas appelé par cards seed (Dexie via `toggleRiffLike` dans db.ts) | défensif |
| `bookmarkRiff/unbookmarkRiff(riffId)` | idem | défensif |
| `voteBattle(battleId, riffId)` | uniquement UUIDs (battles DB-only) | non-concerné |

Pour les fonctions "défensives" (likes/bookmarks/getRiff) : le bug n'a pas
été observé en prod car les cards utilisent les helpers Dexie locaux pour
les seeds. Mais on wrap quand même au cas où un futur appel les trouve.

---

## Phase 2 — Fix ✅ `<sha>`

### `src/lib/socialApi.ts`

**Helpers ajoutés en haut** :
```typescript
function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
export function isSeedRiff(id: string): boolean {
  return !isUUID(id);
}
export const SEED_RIFF_READ_ONLY = 'SEED_RIFF_READ_ONLY';
function seedReadOnlyError() {
  return { data: null, error: new Error(SEED_RIFF_READ_ONLY) };
}
```

**Wrappers défensifs early-return** :
- `getRiff(id)` → `{data: null, error: null}` si seed
- `getComments(riffId)` → `{data: [], error: null}` si seed (le fix principal)
- `postComment` → `seedReadOnlyError()` si seed
- `likeRiff / unlikeRiff / bookmarkRiff / unbookmarkRiff` → `seedReadOnlyError()` si seed

### `src/components/social/CommentsSection.tsx`

- Import `isSeedRiff` de socialApi
- `const isSeed = isSeedRiff(riffId)` au sommet
- `useEffect` : skip le `void refresh()` si seed → setComments([]) + loading false (évite query inutile même si désormais no-op)
- Render : si `isSeed`, retourne **UI gracieuse** au lieu du compose+list :
  ```
  ✨ Les commentaires arrivent quand des utilisateurs partagent leurs
     propres riffs. Celui-ci est un exemple intégré.
  
  [Voir des riffs partagés →]  (h-10 gold pill, link /riffs)
  ```

### Pas touché (intentionnellement)
- `src/components/social/FollowButton.tsx` : prend un `userId` (UUID profile),
  pas un `riffId`. Bug non applicable.
- `src/lib/db.ts` : likes/bookmarks Dexie déjà en place pour seeds via
  `toggleRiffLike/toggleRiffBookmark`. Aucun changement nécessaire.

---

## Phase 3 — Tests ✅

### Validations Playwright (mobile 375)

| Test | Avant | Après |
|---|---|---|
| `/riffs/cr-stairway` ouvre sans flood 400 | ❌ flood | ✅ aucun GET supabase.co/comments |
| CommentsSection affiche UI gracieuse | ❌ chargement infini | ✅ "Les commentaires arrivent..." + bouton |
| `/riffs/cr-iron` même comportement | ❌ | ✅ "Iron Man" + UI gracieuse |
| `linkRiffsHref` → `/riffs` | n/a | ✅ |

### Console clean
- Aucun 400 sur navigation seed
- Aucun warning ajouté
- HMR a tout réflé sans nécessiter reload manuel

---

## Bilan final

### Stats
- **1 commit technique + ce log** sur `claude/trusting-moore-b4036b`
- 2 fichiers touchés (strictement la liste AUTORISÉE) :
  - `src/lib/socialApi.ts` (helpers + 6 wrappers)
  - `src/components/social/CommentsSection.tsx` (UI gracieuse)
- Build green
- Aucune régression sur les flows normaux (UUIDs continuent de query Supabase)

### Pattern de défense en profondeur
Le bug primaire venait de `getComments`. Mais on a wrap **toutes** les
fonctions Supabase prenant un riffId (6 au total) avec le même garde
`isSeedRiff()` pour éviter qu'un futur composant qui pointerait par
mégarde sur un seed reproduise le même symptôme.

### Pas touché
- `RiffDetail.tsx` (interdit — autre session)
- `Riffs.tsx` (interdit)
- `components/riffs/*` (interdit)
- `FollowButton.tsx` (pas concerné — userId UUID)

---

## ✅ Mergé dans main (220e3a9)

Fast-forward direct, aucune divergence avec origin/main (la session
refonte Riffs en parallèle n'a pas encore push). Pas de conflit.
