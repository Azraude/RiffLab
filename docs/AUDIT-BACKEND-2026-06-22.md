# Audit backend RiffLab — 22 juin 2026

> Audit exécuté le 2026-06-23 (fichier daté 22 juin par convention du brief).
> Backend Supabase live : `mneifpmfknreopfqfmyz.supabase.co`.

---

## ⚠️ Méthodologie & honnêteté (à lire en premier)

Cet audit combine **3 méthodes**, chacune avec un niveau de preuve différent.
Je le précise pour chaque flow — **ne prends pas un `✅` de wiring pour une
preuve end-to-end si la ligne "Méthode" dit autre chose.**

| Méthode | Ce que ça prouve | Fiabilité |
|---|---|---|
| **RUNTIME (curl live)** | La table/bucket/colonne existe vraiment, la RLS répond, des données réelles sont présentes. Testé contre la vraie instance Supabase avec la clé anon (publique, shippée dans le bundle). | 🟢 Preuve dure |
| **CODE-TRACE** | Le handler UI est câblé à la bonne fonction API/Dexie, avec les bons champs. Lu dans le code, **pas exécuté dans un navigateur**. | 🟡 Wiring vérifié, comportement présumé |
| **NON TESTABLE ICI** | Nécessite une session authentifiée réelle (magic link cliqué / OAuth Google) que je ne peux pas compléter dans cet environnement headless. | 🔴 Non vérifié |

**Ce que je N'AI PAS pu faire** (et donc ne prétends pas avoir testé) :
- Compléter un login (magic link = clic email ; Google = consentement OAuth) → **aucune écriture authentifiée n'a été exécutée**.
- Rendre l'UI React dans le navigateur headless (connu : `#root` reste vide en headless — cf. mémoire projet). Les flows Dexie sont donc **code-tracés**, pas cliqués.

**Ce que j'AI pu prouver en runtime** : l'intégralité du schéma backend (tables, colonnes, buckets, RLS) via curl sur l'API REST PostgREST + Storage. C'est le cœur de "est-ce que le backend existe et est correct" — et la réponse est **oui, le backend est déployé et verrouillé correctement**.

---

## Résumé exécutif

**Flows audités : 16/16 cœur + 4/4 bonus.**

| Statut | Cœur (1-16) | Détail |
|---|---|---|
| ✅ MARCHE | **9** | 3, 4, 6, 7, 9, 11, 12, 13, 16 |
| ⚠️ PARTIEL | **5** | 1, 2, 8, 10, 14 |
| ❌ PLANTE | **0** | — |
| 🚫 PAS IMPLÉMENTÉ | **2** | 5, 15 |

**Backend Supabase : sain.** Les 16 tables existent, RLS owner-only confirmée
(écriture anon → 401), les 2 buckets Storage existent, toutes les colonnes
profil étendues existent. Les 4 tables `user_*` du cloud-sync **ont bien été
migrées** par toi (HTTP 200).

### Recommandation prioritaire pour ship

Le backend est prêt. Les 3 vrais trous sont **côté wiring client**, pas backend :

1. **🔴 Likes & bookmarks ne persistent PAS dans le cloud** (flows 8, 10). Le
   handler UI écrit dans Dexie local uniquement — `socialApi.likeRiff` /
   `bookmarkRiff` / `getMyBookmarks` **ne sont jamais appelés**. Les compteurs
   bougent localement mais rien n'arrive dans Supabase et rien n'est visible
   par les autres users. **C'est le bug le plus impactant pour une feature
   "sociale".**
2. **🚫 Studio "sauvegarder progression" est mort** (flow 15) :
   `saveCustomProgression` n'a **aucun appelant** dans tout `src/`. Table + sync
   prêts, mais zéro bouton qui écrit.
3. **🚫 Upload d'avatar absent de l'UI active** (flow 5) : `uploadAvatar` + bucket
   `avatars` prêts, mais `ProfileEditDrawer` n'a pas de champ avatar (seulement
   cover).

Avant de communiquer "RiffLab est social", il faut câbler #1.

---

## Preuves backend runtime (curl live, clé anon)

### Existence des 16 tables — toutes HTTP 200
```
profiles 200 | riffs_public 200 | likes 200 | bookmarks 200 | follows 200
comments 200 | xp_events 200 | user_badges 200 | battles 200 | battle_votes 200
editor_picks 200 | notifications 200
user_sessions 200 | user_mastered_riffs 200 | user_practice_progress 200 | user_custom_progressions 200
```

### Volumétrie réelle (Content-Range, Prefer count=exact)
```
profiles      10 rows
riffs_public  12 rows   (timestamps quotidiens séquentiels → données SEED-RIFFS-PUBLIC-DEMO.sql)
likes         44 rows   (seed/historique — PAS écrites par l'app, cf. flow 8)
follows       27 rows
comments      15 rows
battles        1 row    (semaine 26/2026, ends_at 2026-06-29)
editor_picks   1 row    (type=week, 2026-06-20 → 2026-06-27)
bookmarks      */0      (RLS owner-only → anon voit 0, volume réel inconnu, NORMAL)
```

### RLS — écriture anonyme bloquée (preuve de sécurité)
```
POST likes (anon)         → HTTP 401  ✅ refusé
POST user_sessions (anon) → HTTP 401  ✅ refusé
SELECT user_sessions(anon)→ Content-Range */0  ✅ RLS filtre les lignes par owner
```

### Colonnes profil étendues — toutes présentes (HTTP 200)
```
display_name, bio, cover_url, instruments,
instagram_url, youtube_url, soundcloud_url, website_url
```
> Note d'honnêteté : ma première sonde a testé `social_links` (→ 400) et j'ai
> cru à une colonne manquante. **Faux** : l'app utilise des colonnes `*_url`
> séparées, qui existent toutes. Corrigé.

### Storage buckets
```
list avatars → HTTP 200  ✅ existe
list covers  → HTTP 200  ✅ existe
```

---

## Détail des flows

### Flow 1 : Login magic link
**Statut** : ⚠️ PARTIEL — **Méthode** : CODE-TRACE + backend live, e2e non testable ici.
- Handler `LoginModal.tsx:51` → `authStore.signInWithMagicLink` → `supabase.auth.signInWithOtp` (`authStore.ts:49`), `emailRedirectTo = ${origin}/dashboard`.
- UI : carte succès "email envoyé" (`LoginModal.tsx:151`).
- Backend auth joignable (projet live). **Non vérifié** : réception réelle de l'email + validité de l'URL de redirect en prod.
- **Reco** : Melvin teste avec son vrai email sur le déploiement Vercel. Vérifier dans Supabase → Auth → URL Configuration que `…/dashboard` est dans les Redirect URLs autorisées.

### Flow 2 : Login Google OAuth
**Statut** : ⚠️ PARTIEL — **Méthode** : CODE-TRACE, config provider non vérifiable ici.
- `LoginModal.tsx:71` → `signInWithGoogle` → `signInWithOAuth({provider:'google', redirectTo:${origin}/dashboard})` (`authStore.ts:64`). Pas de toast (le redirect prend le relais — correct).
- **Non vérifié** : que le provider Google soit *activé* dans Supabase Auth + client ID/secret configurés.
- **Reco** : confirmer Supabase → Auth → Providers → Google = ON. Tester le flow réel.

### Flow 3 : Création auto du profil au signup
**Statut** : ✅ MARCHE — **Méthode** : RUNTIME (10 profils live) + trigger déployé.
- Aucun handler client : c'est le trigger DB `handle_new_user()` (`SESSION-29.sql:29`) qui crée la row profil avec username `email_prefix-<4 hex>`.
- **Preuve** : `profiles` contient **10 lignes réelles** → le trigger tourne en prod.
- **Non observé** : un signup tout neuf cette session, mais l'évidence runtime est forte.

### Flow 4 : Édition profil (ProfileEditDrawer)
**Statut** : ✅ MARCHE — **Méthode** : RUNTIME (colonnes vérifiées) + CODE-TRACE wiring ; écriture authentifiée non exécutée.
- `ProfileEditDrawer.tsx:105` construit le patch `{display_name, bio, cover_url, instagram_url, youtube_url, soundcloud_url, website_url, instruments}` → `updateProfileExtended` (`profileApi.ts:81`) → `supabase.from('profiles').update().eq('id')`.
- **Preuve dure** : les 8 colonnes existent toutes (HTTP 200). RLS "Update own profile" présente.
- **Reco** : aucun trou détecté. Juste exécuter une fois connecté pour confirmer.

### Flow 5 : Upload avatar
**Statut** : 🚫 PAS IMPLÉMENTÉ (UI absente) — **Méthode** : CODE-TRACE + bucket live.
- `uploadAvatar` (`socialApi.ts:181`) + bucket `avatars` (HTTP 200) **existent**, MAIS `ProfileEditDrawer` **n'a aucun champ d'upload avatar** (commentaire ligne 6 : "avatar via Profile.tsx legacy"). La fonction n'est appelée par aucune UI active.
- **Conséquence** : un user ne peut pas changer son avatar depuis l'UI courante.
- **Reco** : ajouter un `<input type=file>` avatar dans `ProfileEditDrawer` qui appelle `uploadAvatar` puis met `avatar_url` dans le patch (le pattern cover est déjà là, à dupliquer).

### Flow 6 : Upload cover photo
**Statut** : ✅ MARCHE — **Méthode** : RUNTIME (bucket+colonne) + CODE-TRACE ; écriture non exécutée.
- `ProfileEditDrawer.tsx:74` `handleCoverUpload` → `uploadCover` (`profileApi.ts:115`) → bucket `covers` (HTTP 200, upsert), puis `setCoverUrl` → patch → `cover_url` (colonne live). Toast "Cover uploadée". Validation 3 Mo.
- **Reco** : aucun trou. À confirmer connecté.

### Flow 7 : Publier un riff (RiffEditor)
**Statut** : ✅ MARCHE — **Méthode** : RUNTIME (table) + CODE-TRACE ; publication authentifiée non exécutée.
- `RiffEditor.tsx:170` `handlePublish` : (1) **sauve toujours en local** `saveUserRiff` → `userRiffs` ; (2) **si auth** `publishRiff` (`socialApi.ts:205`) → insert `riffs_public` (id, author_id, title, artist, description, bpm, tuning, capo, key, difficulty, techniques, tags, tab_data, duration_ms). Gate `requireAuth('publier')` (`RiffEditor.tsx:171`). Navigue vers `/riffs/:id` après 800 ms.
- **Nuance** : les 12 riffs présents ressemblent à du SEED (timestamps quotidiens). Je ne peux pas prouver qu'une publication via l'UI a réussi, mais le wiring + la table sont prêts.

### Flow 8 : Like un riff (UUID Supabase)
**Statut** : ⚠️ PARTIEL — **Méthode** : CODE-TRACE (preuve grep dure).
- Le handler `RiffCard.tsx:72` / `RiffDetail.tsx:81` appelle **`toggleRiffLike` (Dexie local, `db.ts:679`)** — **PAS** `socialApi.likeRiff`.
- **Preuve** : `grep likeRiff` sur tout `src/` (hors socialApi.ts) → **0 appel** (seul hit = commentaire de doc dans `useAuthGate.tsx`).
- **Conséquence** : le ❤️ bouge le compteur **localement** (via `useLiveQuery`) mais **rien n'est écrit dans la table `likes` Supabase**. Les 44 likes en base sont du seed. Les likes ne sont ni partagés, ni cross-device, ni visibles par l'auteur.
- **Reco (CRITIQUE)** : câbler le handler sur `socialApi.likeRiff`/`unlikeRiff` pour les riffs UUID (garder le fallback Dexie pour les seeds). Voir flow 9.

### Flow 9 : Like un riff seed (slug `cr-sevennation`)
**Statut** : ✅ MARCHE — **Méthode** : CODE-TRACE.
- Même handler `toggleRiffLike` (Dexie), qui marche pour n'importe quel id sans distinction. **Aucun appel Supabase → aucun 400 console**, le compteur monte via Dexie. C'est exactement le comportement attendu par le brief pour les seeds.
- `socialApi` a bien `isSeedRiff()` + `SEED_RIFF_READ_ONLY` pour bloquer les writes seed côté API, mais l'UI ne passe de toute façon jamais par l'API pour les likes.

### Flow 10 : Bookmark
**Statut** : ⚠️ PARTIEL — **Méthode** : CODE-TRACE (preuve grep).
- `RiffCard.tsx:77` / `RiffDetail.tsx:85` → `toggleRiffBookmark` (Dexie local). `socialApi.bookmarkRiff` **jamais appelé**. `getMyBookmarks` (lecture cloud) **jamais utilisé** dans l'UI → **pas d'onglet Bookmarks cloud**.
- **Conséquence** : bookmark local uniquement, non synchronisé, pas de vue cloud.
- **Reco** : si les bookmarks doivent être cross-device, câbler `bookmarkRiff` + un onglet alimenté par `getMyBookmarks`. Sinon, assumer "local-only" explicitement.

### Flow 11 : Commenter un riff
**Statut** : ✅ MARCHE — **Méthode** : RUNTIME (15 comments live) + CODE-TRACE.
- `CommentsSection.tsx:72` `handlePost` → `postComment` (`socialApi.ts:561`) → insert `comments` (author_id, riff_id, text), puis `refresh()` (refetch). Seeds gérés proprement (message read-only, pas de 400). Gate `requireAuth('commenter')`.
- **Preuve** : table `comments` = 15 lignes réelles + trigger notif (`notif_on_comment`). Écriture authentifiée non exécutée ici, mais wiring + table + données prouvés.

### Flow 12 : Follow un user
**Statut** : ✅ MARCHE — **Méthode** : RUNTIME (27 follows live) + CODE-TRACE.
- `FollowButton.tsx:46` → `followUser`/`unfollowUser` (`socialApi.ts:462`) insert/delete `follows`. Update optimiste du bouton (revert sur erreur). Toast + `recordActivity()` streak.
- **Preuve** : table `follows` = 27 lignes + trigger XP/notif `grant_xp_on_follow`.
- **⚠️ Caveat** : le **compteur de followers ne se rafraîchit pas** après follow (`UserProfile.tsx` charge `counts` au mount, pas de refetch) → reste figé jusqu'au reload.

### Flow 13 : Daily "J'ai pratiqué aujourd'hui"
**Statut** : ✅ MARCHE — **Méthode** : CODE-TRACE + RUNTIME (table sync live).
- `Dashboard.tsx:129` `logSession({date, chord, scale, progression:[], completed:true})` → `db.sessions.add` (`db.ts:838`). Streak recalculé via `computeStreak` (`Dashboard.tsx:90`, `useLiveQuery`).
- **Cross-device** : ✅ couvert. `cloudSync.ts` migre `sessions` → `user_sessions` (table live, RLS vérifiée 401/owner-only). Push au 1er login, pull sur nouveau device.

### Flow 14 : Practice Plan auto-validation
**Statut** : ⚠️ PARTIEL — **Méthode** : CODE-TRACE.
- `markInteraction` câblé : `Chords.tsx:115` (`'chord'`) et `Scales.tsx:164` (`'scale'`) → `db.interactions`. `PracticePlan.tsx` complète le node quand tous les chords/scales requis ont une interaction → `markNodeCompleted` → `db.practiceProgress`.
- **Trou cross-device** : `practiceProgress` est synced (✅ `user_practice_progress` live), mais **`interactions` n'est PAS dans cloudSync**. Sur un nouveau device, les nodes déjà complétés se restaurent, mais l'auto-validation ne se re-déclenchera pas tant que l'user ne re-interagit pas localement.
- **Reco** : si l'auto-validation doit être cohérente cross-device, ajouter `interactions` au cloud-sync (table à créer côté Supabase).

### Flow 15 : Studio — sauvegarder une progression
**Statut** : 🚫 PAS IMPLÉMENTÉ — **Méthode** : CODE-TRACE (preuve grep dure).
- `saveCustomProgression` (`db.ts:435`) a **zéro appelant** dans tout `src/` (vérifié `grep -rn` `.ts`/`.tsx` hors db.ts → vide). Aucun bouton "Sauvegarder la progression" trouvé.
- **Ironie** : la table `user_custom_progressions` (live) ET le cloud-sync (`cloudSync.ts:113`) sont prêts — mais rien n'écrit jamais dans `customProgressions` localement. **Feature morte côté écriture.**
- **Reco** : câbler le bouton save du Studio sur `saveCustomProgression`. Le reste (Dexie + sync cloud) suivra automatiquement.

### Flow 16 : Setlists — créer + ajouter song + play
**Statut** : ✅ MARCHE (local) — **Méthode** : CODE-TRACE.
- Create `Setlists.tsx:29` `saveSetlist` → `db.setlists`. Add/reorder `SetlistDetail.tsx:60/65/72/80`. Play `SetlistPlay.tsx` (lecture seule, `getSetlist`). Pas de crash détecté dans le flow.
- **⚠️ Caveat cloud** : `setlists` **n'est pas synchronisé** (hors scope cloudSync) → perdues au changement de device. Acceptable si assumé "local".

---

## Flows bonus

### Flow 17 : Recordings (enregistrer un riff)
**Statut** : ✅ MARCHE (local par design) — **Méthode** : CODE-TRACE.
- `RecorderSection.tsx:42` `saveRecording` → `db.recordings` (Blob + mimeType + durationMs). Playback via Blob URL. **Non synced** (Blobs trop lourds — choix assumé, futur via Storage).

### Flow 18 : Export PDF setlist
**Statut** : ✅ MARCHE — **Méthode** : CODE-TRACE + build (chunk jspdf présent).
- Bouton `SetlistDetail.tsx:174` → `exportSetlistToPdf` (`setlistPdf.ts`) avec `await import('jspdf')` (lazy, vu dans le build : `jspdf.es.min … 390 kB`). Mode "ink saver" par défaut. `doc.save()`.
- **Non vérifié** : le rendu visuel exact du PDF (pas exécuté en navigateur).

### Flow 19 : Notifications bell
**Statut** : ✅ MARCHE — **Méthode** : RUNTIME (table) + CODE-TRACE.
- `NotificationBell.tsx` : `getUnreadNotifCount` (badge), poll 60 s, `getMyNotifications` (drawer), `markNotificationsRead` à l'ouverture. Table `notifications` live + triggers (like/comment/follow) qui l'alimentent. Visible seulement connecté.

### Flow 20 : Stats heatmap calendaire
**Statut** : ✅ MARCHE — **Méthode** : CODE-TRACE.
- `Stats.tsx:25` `lastYearPracticed` (`db.ts:941`) → 365 jours depuis `db.sessions` (completed=true), rendu `PracticeHeatmap` (52×7). Données réelles Dexie, live via `useLiveQuery`.

---

## Priorités de fix

### 1. Critique (bloquant pour pitcher "social")
- **Câbler likes & bookmarks sur Supabase** (flows 8, 10). Aujourd'hui 100 % Dexie-local : invisibles pour les autres, non cross-device. Brancher `likeRiff`/`unlikeRiff`/`bookmarkRiff` sur les riffs UUID + garder le fallback Dexie pour les seeds.

### 2. Important (UX dégradée, ship possible)
- **Studio save progression mort** (flow 15) : câbler le bouton sur `saveCustomProgression`.
- **Upload avatar absent de l'UI** (flow 5) : ajouter le champ dans `ProfileEditDrawer`.
- **Compteur followers figé** (flow 12) : refetch `getFollowCounts` après follow/unfollow.
- **Auth e2e non vérifié** (flows 1, 2) : Melvin teste magic link (email réel) + Google OAuth en prod ; vérifier Redirect URLs + provider Google activé.

### 3. Nice-to-have / dette assumée
- `interactions` non synced → auto-validation Plan incohérente cross-device (flow 14).
- `setlists` non synced (flow 16) — assumé local.
- `recordings` non synced (flow 17) — assumé local (futur Storage).
- Onglet Bookmarks cloud (`getMyBookmarks`) jamais branché.

---

## Tables Supabase à créer/modifier

**Aucune création urgente.** Le schéma backend est complet et correct pour
tout ce qui est déjà câblé. Optionnel selon décisions produit :

- `user_interactions` (si on veut sync l'auto-validation Plan cross-device — flow 14).
- `user_setlists` (si on veut sync les setlists — flow 16).

## Migrations SQL à exécuter

**Aucune.** Toutes les migrations existantes (`SESSION-29`, `PROFILE`,
`USER-DATA` cloud-sync) sont **déjà appliquées en prod** (vérifié : les 16
tables + colonnes + buckets répondent HTTP 200). Rien à rejouer.

---

## Conclusion honnête

Le **backend est en bien meilleur état que le wiring client**. Tout le schéma
(tables, RLS, buckets, colonnes, triggers, cloud-sync user_*) est déployé et
verrouillé correctement — c'est solide. Les vrais problèmes sont des **fils non
branchés côté React** : likes/bookmarks qui ne montent pas dans le cloud, un
bouton Studio qui n'existe pas, un champ avatar manquant. Ce sont des fixes
ciblés de quelques lignes chacun, pas des chantiers backend.

Ce que je **ne peux pas certifier** sans toi : les flows authentifiés exécutés
de bout en bout (publication, like cloud, commentaire, follow, édition profil,
uploads) — le wiring et le backend sont prêts, mais il faut une vraie session
(login email/Google) pour confirmer le dernier maillon. À tester en prod Vercel.
