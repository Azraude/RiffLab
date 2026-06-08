# Phase 5.2 — Sync cloud Dexie ↔ Supabase Postgres

> **Statut** : spec (pas implémenté). Cible : 1 user, 2+ devices, expérience seamless.
> **Effort estimé** : **6–8h** (3h schéma+RLS+migrations / 5h hooks+tests).
> **Prérequis** : Phase 5.1 Auth Supabase livrée ✅ (sess 22).
> **Reste à coder** : tout ce qui est dans `src/lib/sync/` ci-dessous.

---

## 1. Use case — pourquoi maintenant

Un user qui utilise RiffLab sur **téléphone en répèt** ET **laptop à la maison** doit retrouver :

- Ses songs (titres, accords, sections, recordings meta)
- Ses setlists
- Sa progression Practice Plan (nodes complétés, quiz best score)
- Son streak et son historique de sessions
- Ses préférences (theme, tuning, capo default)

Les **blobs audio** des recordings restent **local-first** : trop gros pour push 50 MB de WAV à chaque save. Phase ultérieure si vraiment demandé.

---

## 2. Schéma Supabase Postgres

### 2.1 Tables

```sql
-- 2.1.a Songs ----------------------------------------------------------
create table public.songs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  artist        text,
  key           text not null,           -- 'C' / 'F#' / 'Bb' etc
  mode          text not null check (mode in ('major', 'minor')),
  tempo         integer not null check (tempo between 20 and 300),
  capo          integer not null default 0 check (capo between 0 and 12),
  tuning        text not null default 'standard',
  status        text not null check (status in ('à bosser', 'en cours', 'maîtrisé')),
  tags          text[] not null default '{}',
  sections      jsonb not null default '[]'::jsonb,
  lyrics        text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz                          -- soft-delete pour merge tombstone
);
create index songs_user_id_updated_at on public.songs(user_id, updated_at desc);
create index songs_user_id_deleted on public.songs(user_id) where deleted_at is null;

-- 2.1.b Setlists -------------------------------------------------------
create table public.setlists (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  song_ids      uuid[] not null default '{}',         -- ordre préservé
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index setlists_user_id_updated_at on public.setlists(user_id, updated_at desc);

-- 2.1.c Recordings meta (blobs restent local) --------------------------
create table public.recordings_meta (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  song_id       uuid references public.songs(id) on delete set null,
  label         text,
  duration_ms   integer not null,
  size_bytes    integer not null,
  blob_hash     text,                                 -- sha256, pour dedupe + futur sync blob
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index recordings_user_song on public.recordings_meta(user_id, song_id);

-- 2.1.d Practice sessions ----------------------------------------------
create table public.practice_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,                        -- YYYY-MM-DD local user
  duration_min  integer not null default 0,
  items         jsonb not null default '[]'::jsonb,   -- [{type: 'chord', name: 'Em7', count: 12}, ...]
  created_at    timestamptz not null default now()
);
create unique index practice_sessions_user_date on public.practice_sessions(user_id, date);

-- 2.1.e Practice progress (nodes complétés + quiz best scores) --------
create table public.practice_progress (
  user_id       uuid not null references auth.users(id) on delete cascade,
  node_id       text not null,                        -- 'level-1-chords-cowboys', etc
  completed_at  timestamptz not null default now(),
  quiz_best     integer,                              -- 0-3, null si pas de quiz
  primary key (user_id, node_id)
);

-- 2.1.f User preferences (synced subset de prefsStore) -----------------
create table public.user_prefs (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  theme         text not null default 'dark-gold',
  tuning        text not null default 'standard',
  capo          integer not null default 0,
  fretboard_skin text not null default 'noir-mat',
  strum_sound   text not null default 'electric-clean',
  level         text not null default 'beginner',
  language      text default 'fr',
  updated_at    timestamptz not null default now()
);
```

### 2.2 RLS policies — user voit que ses données

```sql
-- À répliquer sur les 6 tables. Exemple pour songs :
alter table public.songs enable row level security;

create policy "user reads own songs"
  on public.songs for select
  using (auth.uid() = user_id);

create policy "user inserts own songs"
  on public.songs for insert
  with check (auth.uid() = user_id);

create policy "user updates own songs"
  on public.songs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user deletes own songs"
  on public.songs for delete
  using (auth.uid() = user_id);
```

Répéter pour `setlists`, `recordings_meta`, `practice_sessions`, `practice_progress`, `user_prefs`.

### 2.3 Trigger updated_at automatique

```sql
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Sur toutes les tables qui ont updated_at (songs, setlists, user_prefs)
create trigger trg_songs_updated_at before update on public.songs
  for each row execute function set_updated_at();
```

---

## 3. Stratégie de conflit — Last Write Wins (LWW)

**Choix : LWW basé sur `updated_at`**, pas CRDT.

### Pourquoi LWW

- Single user → 99% des conflits = "j'ai édité le même song sur 2 devices en parallèle dans la même semaine" → ultra rare
- Quand ça arrive, le user préfère **clairement** que la version la plus récente gagne (pas une fusion automatique qui ne ressemble à rien)
- Implémentation : 30 lignes vs 800 pour CRDT (Yjs / Automerge)
- Coût accepté : si l'user édite le même song offline sur 2 devices et reconnecte les 2, le 2e prend (avec un toast "Une version plus récente a été chargée du cloud — ton édit a été conservée localement comme `<title> (conflit)`" pour transparence)

### Alternative envisagée et rejetée

CRDT (Yjs) : trop d'overhead pour le besoin. À reconsidérer SI multi-user collaboration arrive Phase 7+ (setlists partagées en live).

---

## 4. Hooks de sync

Layout `src/lib/sync/` (à créer) :

```
src/lib/sync/
├── index.ts                # Public API : initSync, syncOnce, useSync
├── pullFromCloud.ts        # server → local (login + reconnect)
├── pushToCloud.ts          # local → server (mutation Dexie)
├── conflict.ts             # LWW logic + tombstone merge
├── queue.ts                # pending mutations offline queue
└── mappers.ts              # Song ↔ DB row converters
```

### 4.1 Au login (PullFromCloud)

```typescript
// pseudo-code
async function pullFromCloud(userId: string) {
  // 1. Fetch toutes les rows updated_at > local lastSyncAt
  const since = (await getLastSyncAt()) ?? new Date(0);
  const remoteSongs = await supabase
    .from('songs')
    .select('*')
    .gte('updated_at', since.toISOString());

  // 2. Pour chaque, LWW vs local
  for (const r of remoteSongs.data) {
    const local = await db.songs.get(r.id);
    if (!local || new Date(local.updatedAt) < new Date(r.updated_at)) {
      // Soft-delete : si remote.deleted_at set, supprimer local
      if (r.deleted_at) await db.songs.delete(r.id);
      else await db.songs.put(toLocalSong(r));
    } else if (new Date(local.updatedAt) > new Date(r.updated_at)) {
      // Local plus récent → on push à la prochaine flush
      // (rien à faire ici, queue handle ça)
    }
  }

  // 3. Si local a un .deleted local pas remote → on l'a déjà soft-delete
  // remote au moment du delete (mutation hook). Sinon il était offline,
  // queue handle.

  await setLastSyncAt(new Date());
}
```

### 4.2 Sur mutation Dexie (PushToCloud — write-through)

Hook Dexie middleware ou wrapper de `saveSong / saveSetlist / etc` :

```typescript
async function saveSong(song: Song) {
  await db.songs.put({ ...song, updatedAt: Date.now() });
  // Async, non-blocking pour l'UX :
  void enqueuePush('songs', song.id, song);
}

async function flushQueue() {
  if (!navigator.onLine) return; // garde
  const pending = await db.pendingMutations.toArray();
  for (const m of pending) {
    try {
      await supabase.from(m.table).upsert(m.payload);
      await db.pendingMutations.delete(m.id);
    } catch (err) {
      // Retry exponential backoff, max 5 tries
      await retryWithBackoff(m);
    }
  }
}
```

### 4.3 Reconnexion réseau

```typescript
window.addEventListener('online', () => {
  void flushQueue();
  void pullFromCloud(authStore.user.id); // pull aussi pour récup les changements distants
});
```

### 4.4 Hook React `useSync()`

```typescript
export function useSync() {
  const user = useAuth((s) => s.user);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    if (!user) return;
    void initSync(user.id);
    const tick = setInterval(() => void flushQueue(), 30_000); // flush 30s
    return () => clearInterval(tick);
  }, [user]);

  return { syncing, lastSync, syncNow: () => syncOnce(user.id) };
}
```

---

## 5. Gestion offline

### Pending mutations queue (Dexie table v11)

```typescript
// Dexie table ajouter en migration v11 :
pendingMutations: '++id, table, recordId, createdAt'

interface PendingMutation {
  id?: number;
  table: 'songs' | 'setlists' | 'recordings_meta' | 'practice_sessions' | 'practice_progress' | 'user_prefs';
  recordId: string;
  payload: Record<string, unknown>;
  createdAt: number;
  tries: number;
}
```

- Sur mutation Dexie → enqueue
- Online + auth ok → flush en tâche de fond
- Retry exponentiel : 1s / 4s / 16s / 1min / 5min puis abandon + toast "Sync impossible, retry plus tard"

### Indicateur UI

Footer Sidebar + AuthMenu : petit dot vert/orange/rouge :
- 🟢 Synced (lastSync < 30s)
- 🟠 Pending (queue > 0 ou syncing en cours)
- 🔴 Offline (pas de réseau OU 5 retries failed)
- ⚪ Disabled (user pas loggé)

---

## 6. Étapes d'implémentation (6-8h)

| # | Étape | Temps |
|---|---|---|
| 1 | SQL migrations Supabase : 6 tables + RLS + triggers | 1.5h |
| 2 | `src/lib/sync/mappers.ts` (DB row ↔ local type, jsonb sections) | 0.5h |
| 3 | `src/lib/sync/queue.ts` + table Dexie v11 + migrate | 1h |
| 4 | `src/lib/sync/pushToCloud.ts` + wrapping saveSong/Setlist/etc | 1h |
| 5 | `src/lib/sync/pullFromCloud.ts` + LWW conflict | 1.5h |
| 6 | `src/lib/sync/index.ts` initSync + useSync hook | 0.5h |
| 7 | Indicateur UI sync status (dot Sidebar) | 0.5h |
| 8 | Tests manuels 2 devices + cas conflict + offline → online | 1h |
| 9 | Migration auto pour users existants (push DB local → cloud au 1er login post-deploy) | 0.5h |

**Total : 6–8h** selon les surprises (cf. risques §7).

---

## 7. Risques identifiés

1. **Migration users existants** — un user avec 30 songs local doit voir tous ses songs apparaître dans le cloud au premier login post-deploy. Sinon panique. Solution : au 1er sync, si remote vide et local plein → push all puis flag `firstSyncDone` en localStorage.
2. **Conflits jsonb sections** — si le user édite le même song sur 2 devices ET sur des sections différentes, LWW perd les édits du device le moins récent. Acceptable mais à documenter dans un toast "Une version plus récente du cloud a été chargée. Ta version a été sauvegardée comme `Wonderwall (conflit local)`".
3. **Pagination** — un user avec 500 songs au pull initial : passer en pagination par page de 50 (`range(0, 50)`).
4. **Practice sessions par jour** — l'unique constraint `(user_id, date)` peut conflict si l'user a une session avec le même date sur 2 devices. À gérer : MERGE des items[] au lieu d'UPSERT brutal (custom RPC Postgres).
5. **Recordings blobs** — Phase ultérieure. Pour cette phase juste la métadonnée. UI doit clairement dire "tes recordings audio restent locaux" pour pas créer de confusion.
6. **Rate limiting Supabase** — free tier 500 req/min. Pour 1 user en édition active : OK. Pour scale, batch les pushes.

---

## 8. Test manuel scénario "happy path"

1. Device A login → DB Supabase remplie depuis local (30 songs / 5 setlists)
2. Device B login → pull → 30 songs / 5 setlists apparaissent
3. Device A édite Wonderwall (change tempo 87 → 90) → push instant
4. Device B refresh OU 30s plus tard → tempo 90 visible
5. Device B offline → édite Smoke on the Water → tempo 113 + new section
6. Device B online → flush queue → push réussi
7. Device A 30s plus tard → tempo 113 et new section visibles

Si tous les 7 ✓ : ship Phase 5.2.

---

## 9. Pas dans cette phase

- Sync des blobs audio recordings → Phase 5.2.1
- Sync multi-user partagé (setlists collaboratives) → Phase 7+
- Sync conflict UI sophistiquée avec resolve manuel → Phase 5.4 si demandé
- Backup explicite "Export tout sur cloud comme fichier" → Phase 5.3

---

## 10. Décisions ouvertes (à trancher avant impl)

1. **Frequency push** : write-through (à chaque mutation) ou debounced (toutes les 5s) ? → Reco : write-through, latence neg pour 1 user, queue retry pour offline.
2. **Practice sessions** : sync ou local-only ? → Reco : SYNC (sinon le streak diffère entre devices = WTF user).
3. **User prefs** : sync ou local-only ? → Reco : sync UNIQUEMENT le subset utile multi-device (theme, language, level, tuning, capo). PAS l'onboarding/tutorial flags (chaque device sa propre intro).
4. **Tombstones** : combien de temps garder soft-delete avant hard-delete ? → Reco : 90 jours.
