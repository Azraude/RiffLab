-- ════════════════════════════════════════════════════════════════
-- RiffLab — Migrations Supabase USER DATA (cloud-sync Dexie → Postgres)
-- ════════════════════════════════════════════════════════════════
--
-- À EXÉCUTER dans le SQL Editor du dashboard Supabase :
-- https://supabase.com/dashboard/project/mneifpmfknreopfqfmyz/sql/new
--
-- Tables qui stockent les DONNÉES DE PRATIQUE PERSO d'un user (par
-- opposition aux tables sociales de SESSION-29.sql). Ces tables sont
-- alimentées par le pipeline cloud-sync (src/lib/cloudSync.ts) au
-- moment du login : on pousse les données Dexie locales vers le cloud
-- pour qu'elles survivent à un changement de device / clear du cache.
--
-- Le script est IDEMPOTENT : re-run sans casser l'existant.
--  - CREATE TABLE IF NOT EXISTS partout.
--  - Les tables qui n'ont pas de clé naturelle (sessions, custom
--    progressions) embarquent une colonne `local_id` UNIQUE (l'id Dexie)
--    pour que l'upsert `onConflict` soit ré-entrant : re-sync = no-op,
--    jamais de doublon.
--  - CREATE POLICY droppé avant re-create (Postgres ne supporte pas
--    IF NOT EXISTS sur les policies).
-- ════════════════════════════════════════════════════════════════

-- ─── 1. Sessions de pratique (Dexie `sessions`) ───────────────────
-- Dexie PracticeSession : { id(++), date, chord, scale, progression[],
-- completed, durationSec, createdAt }. `local_id` = l'id auto-increment
-- Dexie stringifié, sert de clé d'idempotence par user.
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  local_id TEXT,                       -- id Dexie (idempotence)
  date DATE NOT NULL,
  chord_id TEXT,
  scale_id TEXT,
  progression TEXT[] DEFAULT '{}',
  completed BOOLEAN DEFAULT true,
  duration_sec INT,
  source TEXT DEFAULT 'manual',        -- 'manual' | 'auto-validation'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, local_id)
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_date ON user_sessions(user_id, date);

-- ─── 2. Mastered riffs (Dexie `masteredRiffs`) ────────────────────
-- Dexie MasteredRiff : { id, masteredAt, playCount }. riff_id supporte
-- les slugs (cr-iron) ET les UUIDs (riffs publiés) → TEXT, pas UUID.
CREATE TABLE IF NOT EXISTS user_mastered_riffs (
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  riff_id TEXT NOT NULL,
  play_count INT DEFAULT 0,
  mastered_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, riff_id)
);

-- ─── 3. Practice path progress (Dexie `practiceProgress`) ─────────
-- Dexie PracticePathNode : { id, completedAt }. La présence d'une ligne
-- = node complété (pas de flag à false côté Dexie).
CREATE TABLE IF NOT EXISTS user_practice_progress (
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  node_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT true,
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, node_id)
);

-- ─── 4. Custom progressions (Dexie `customProgressions`) ──────────
-- Dexie CustomProgression : { id(prog_xxx), name, key, mode, style,
-- romans[], chords[], createdAt }. `local_id` = l'id Dexie pour
-- l'idempotence (l'id Dexie n'est pas un UUID Postgres valide).
CREATE TABLE IF NOT EXISTS user_custom_progressions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  local_id TEXT,                       -- id Dexie (idempotence)
  name TEXT,
  key TEXT,
  mode TEXT,
  style TEXT,
  romans JSONB DEFAULT '[]'::jsonb,
  chords JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, local_id)
);
CREATE INDEX IF NOT EXISTS idx_user_custom_prog_user ON user_custom_progressions(user_id);

-- ─── 5. RLS policies (owner-only read + write) ────────────────────
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mastered_riffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_practice_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_custom_progressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_sessions_owner" ON user_sessions;
CREATE POLICY "user_sessions_owner" ON user_sessions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_mastered_riffs_owner" ON user_mastered_riffs;
CREATE POLICY "user_mastered_riffs_owner" ON user_mastered_riffs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_practice_progress_owner" ON user_practice_progress;
CREATE POLICY "user_practice_progress_owner" ON user_practice_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_custom_progressions_owner" ON user_custom_progressions;
CREATE POLICY "user_custom_progressions_owner" ON user_custom_progressions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════
-- DONE. Vérifie dans le Table Editor que les 4 tables user_* sont là :
-- user_sessions, user_mastered_riffs, user_practice_progress,
-- user_custom_progressions.
--
-- Pour tester :
-- 1. Joue en local (pratique daily, master un riff, complète un node)
-- 2. DevTools → Application → IndexedDB → rifflab : vérifie tes data
-- 3. Connecte-toi → toast "🎉 Données sauvegardées"
-- 4. Table Editor → user_sessions : tes lignes doivent apparaître
-- 5. Logout + login → toujours là (et pas de doublon = idempotence OK)
-- ════════════════════════════════════════════════════════════════
