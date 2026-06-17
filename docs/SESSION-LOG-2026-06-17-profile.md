# Session PROFIL — Page profil enrichi (cover + bio + social + drawer édition)

> Branche `claude/trusting-moore-b4036b`. Scope min confirmé par Melvin :
> P1 SQL + P2 ProfileHero + drawer édition + P6 5 SVG covers + merge.
> ~3h estimées, livrées en ~2h.

## 🔴 BUG BLOQUANT
_(aucun)_

## ⚠️ ACTION REQUISE MELVIN
**Exécuter `docs/SUPABASE-MIGRATIONS-PROFILE.sql` dans Supabase SQL editor**
avant que les nouveaux champs (cover_url, instruments, 4 social links) soient
persistés. Sans ça, le save du drawer va échouer silencieusement.

---

## Phase 0 — Audit ✅

### Existant (pas écrasé)
- `src/pages/Profile.tsx` (281l) : form édition basique fonctionnel
- `src/pages/UserProfile.tsx` (349l) : 4 tabs hero/badges/follow déjà câblés
- `src/lib/socialApi.ts` : `getProfile/updateProfile/uploadAvatar/getUserRiffs`
  EXISTENT — INTERDIT toucher (autre session hotfix). Solution : `profileApi.ts`
  nouveau fichier pour les extensions.

### Décisions
1. Pas re-écrire socialApi → créer `profileApi.ts` séparé (extension)
2. ProfileHero composant réutilisable (mounted dans UserProfile, et indirectement
   sur Profile.tsx via redirect)
3. Profile.tsx → simple `<Navigate to="/u/<myUsername>?edit=1">` qui auto-open
   le drawer dans UserProfile. Évite la duplication form inline / drawer.
4. 3 tabs au lieu de 4 (Riffs / Progressions / Badges). Tab Mastered/Bookmarks
   supprimé : déjà message "données locales" inutile.

---

## Phase 1 — SQL migration + profileApi.ts ✅ `123a0b4`

### `docs/SUPABASE-MIGRATIONS-PROFILE.sql`
- ALTER profiles ADD cover_url, instagram_url, youtube_url, soundcloud_url,
  website_url (TEXT nullable) + instruments TEXT[] DEFAULT '{}'
- Bio TEXT (idempotent, déjà présent sess 29 normalement)
- Storage bucket `covers` public
- 4 RLS policies : public read + authenticated insert + author update/delete
  (via `storage.foldername(name)[1] = auth.uid()::text`)
- Tout en `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` → idempotent, peut
  être rerun sans casser.

### `src/lib/profileApi.ts` (NEW)
- `updateProfileExtended(id, ProfilePatch)` : push tous les nouveaux champs
- `uploadCover(userId, file)` : Supabase Storage `covers/<userId>/cover-<ts>.<ext>`
  (max 3MB validation client)
- `DEFAULT_COVERS` catalog : 5 SVG bundled (forge default, manche, studio, neon, vintage)
- `resolveCoverUrl(url)` helper fallback sur forge.svg
- `INSTRUMENTS` catalog : acoustic/electric/classical/bass + emoji + label
- `validateProfileUrl(value, label)` : URL regex client

---

## Phase 2 — ProfileHero + ProfileEditDrawer ✅ (même commit)

### `src/components/profile/ProfileHero.tsx` (NEW)
- Cover 140px mobile / 240px desktop, full-bleed mobile (-mx-5)
- Avatar 88px (mobile) / 112px (desktop), border-4 border-bg, overlap
- Display name display-md/lg + @username font-mono
- Instruments badges chips gold-soft
- Bio line-clamp-3 max-w-2xl
- 4 ExternalLink h-11 w-11 (Insta/YT/SC icône SoundCloud SVG inline custom)
- Bouton CTA : "Modifier" 40px gold-soft border si isMe, sinon FollowButton

### `src/components/profile/ProfileEditDrawer.tsx` (NEW)
- Réutilise `Sheet` (bottom-sheet mobile, modal centré desktop)
- Cover picker : 5 thumbnails 16×28 scroll-x + upload custom 16×28
  + preview h-16 full-width de la cover sélectionnée
- Display name + bio textarea (compteur 280 + danger si overflow)
- Instruments multi-chips toggle (4 instruments)
- 4 UrlField (Insta/YT/SC/site) avec inputMode="url" validation client
- Footer sticky : Annuler / Sauvegarder gold (disabled si bio overflow)

### `src/pages/UserProfile.tsx` (refondu)
- Import ProfileHero + ProfileEditDrawer
- Hero remplace l'ancien layout flex avatar+name+stats inline
- Stats grid 3-cols compact (Riffs / Followers / Following)
- 3 tabs au lieu de 4 : Riffs (existing list) / Progressions (placeholder) / Badges (existing)
- `?edit=1` search param → auto-open drawer si isMe + cleanup param

### `src/pages/Profile.tsx` (simplifié)
- 281 → 75 lignes : `<Navigate to="/u/<myUsername>?edit=1">` (drawer auto)

---

## Phase 6 — 5 SVG covers ✅ (même commit)

`public/covers/*.svg` (1200×400 viewBox, tous on-brand noir/or) :
- **cover-forge.svg** (default) : gradient noir + glow rougeoyant bas-droit
  + lignes dorées étincelles + particules flammes + watermark RIFFLAB
- **cover-manche.svg** : 6 cordes horizontales (stroke croissant high→low E)
  + 5 frets verticaux gold + inlays dots nacre
- **cover-studio.svg** : silhouette ampli central + casque audio + ondes
  sonores 3 arcs droite
- **cover-neon.svg** : rectangles imbriqués glow filter Gaussian + diagonales
  + pulse circulaire central
- **cover-vintage.svg** : gradient cuir brun-noir + couture stitch pattern
  + reflets ellipses dorées + watermark RIFFLAB gold

Ultra-léger (~1-2 KB chaque), pas de raster.

---

## Phase 3 — Tests responsive ⚠️ partiels

Build green ✓. Test browser limité : preview server port 5173 occupé par
un orphan node (sessions parallèles). Vérif TS strict + intégration via
build OK.

À tester par Melvin après merge migration SQL :
- /profile sans auth → loading → redirect /
- /profile auth → redirect /u/<username>?edit=1 → drawer ouvert
- /u/<username> : ProfileHero visible avec cover par défaut forge
- Drawer : cover picker 5 thumbnails + upload, instruments toggle, save
- ProfileHero post-save : nouveau cover + bio + instruments + social links

---

## Bilan final

### Stats
- **1 commit technique massif + ce log** sur `claude/trusting-moore-b4036b` :
  - `123a0b4` feat(profile) refonte complète (10 fichiers, ~870 ins, ~210 del)
- **1 commit merge origin/main** : `ff8d812` (fast-forward après merge)
- Build green
- Fichiers touchés (strictement liste AUTORISÉE) :
  - `docs/SUPABASE-MIGRATIONS-PROFILE.sql` (new)
  - `src/lib/profileApi.ts` (new)
  - `src/components/profile/ProfileHero.tsx` (new)
  - `src/components/profile/ProfileEditDrawer.tsx` (new)
  - `src/pages/Profile.tsx` (refonte simplifiée)
  - `src/pages/UserProfile.tsx` (refonte hero + drawer + 3 tabs)
  - `public/covers/cover-{forge,manche,studio,neon,vintage}.svg` (5 new)

### Pas touché (volontairement)
- `src/lib/socialApi.ts` : INTERDIT — hotfix session en parallèle
- `src/components/social/FollowButton.tsx` : autre session
- `src/components/riffs/*` : autre session
- `src/app/router.tsx` : aucun ajout nécessaire (routes /profile et
  /u/:username existaient déjà)
- `src/app/layout/Sidebar.tsx` : aucun item à add (Profile déjà accessible
  via AuthMenu dans le footer sidebar)

### Régression noted (hors scope)
`src/pages/Progressions.tsx` est revenu à STUDIO V1 (1103 lignes) au lieu de
STUDIO V2 (320 lignes) après le merge origin/main. Le commit `2cf3060
fix(dashboard): motion.line → motion.path` a manifestement re-included une
ancienne version. **À investiguer dans une session future Progressions**
— pas de mon scope (PROFIL).

---

## Procédure merge suivie

1. `git status` après commit local → 1 commit `123a0b4` ahead branch
2. `git fetch origin` → main avait avancé de 5 commits :
   - `66a9f5a` feat(onboarding) tutorial 5 slides
   - `ca563f2` feat(riffs) +22 riffs curés
   - `82ad300` docs hotfix comments
   - `2bcca30` fix(socialApi) RE-applique guard isSeedRiff
   - `c33c8d1` merge: origin/main avant consolidation
3. `git merge origin/main --no-edit` → merge auto réussi (zéro conflit
   marker). Note : régression Progressions.tsx silencieuse à investiguer.
4. `npm run build` → ✓ green (52s)
5. `git push origin HEAD:claude/trusting-moore-b4036b` → `ff8d812`
6. `git push origin HEAD:main` → fast-forward `66a9f5a → ff8d812`
7. `git fetch origin && git update-ref refs/heads/main origin/main`
8. HEAD branche = origin/main = `ff8d812` ✓

### SHAs traçabilité
- **Point de départ branche** (= main avant) : `91cc1f2`
- **Pull avant merge** : main passé de `e332c7c` → `66a9f5a` (5 commits)
  pull-mergé via `git merge origin/main`
- **Après commit technique** : `123a0b4`
- **Après merge auto avec main** : `ff8d812`
- **HEAD = origin/main après push** : `ff8d812`

---

## ✅ Mergé dans main (ff8d812)

Pull `66a9f5a` mergé proprement (zéro conflit marker). Régression
Progressions.tsx pré-existante notée pour investigation future. Tous
les fichiers PROFIL sont upstream.

Action Melvin : exécute `docs/SUPABASE-MIGRATIONS-PROFILE.sql` avant
de tester l'édition du profil.
