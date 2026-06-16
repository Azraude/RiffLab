-- ════════════════════════════════════════════════════════════════
-- RiffLab — Migrations Supabase Session 29 (refonte plateforme social)
-- ════════════════════════════════════════════════════════════════
--
-- À EXÉCUTER dans le SQL Editor du dashboard Supabase :
-- https://supabase.com/dashboard/project/mneifpmfknreopfqfmyz/sql/new
--
-- Toutes les tables, RLS, triggers et bucket storage nécessaires
-- pour la couche sociale (profils, riffs publics, follow, likes,
-- bookmarks, comments, XP, badges, battles, editor picks, notifs).
--
-- Le script est IDEMPOTENT : tu peux le re-run sans casser l'existant
-- (IF NOT EXISTS partout). Sauf les CREATE POLICY qui doivent être
-- drop avant re-run — Postgres ne supporte pas IF NOT EXISTS sur policies.
-- ════════════════════════════════════════════════════════════════

-- ─── 1. Profils utilisateurs (extends auth.users) ─────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger : créer auto un profile au signup (avec username dérivé de l'email)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    -- username = avant le @ de l'email + 4 chars random (évite collisions)
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '-' || SUBSTRING(MD5(NEW.id::text), 1, 4),
    SPLIT_PART(NEW.email, '@', 1)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 2. Riffs publiés publiquement ────────────────────────────────
CREATE TABLE IF NOT EXISTS riffs_public (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  artist TEXT,
  description TEXT,
  bpm INT NOT NULL,
  tuning TEXT DEFAULT 'standard',
  capo INT DEFAULT 0,
  key TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner','intermediate','advanced','expert')),
  techniques TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  tab_data JSONB NOT NULL,
  duration_ms INT,
  published_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 3. Interactions (likes, bookmarks, follows) ──────────────────
CREATE TABLE IF NOT EXISTS likes (
  user_id UUID REFERENCES profiles(id) NOT NULL,
  riff_id UUID REFERENCES riffs_public(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, riff_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id UUID REFERENCES profiles(id) NOT NULL,
  riff_id UUID REFERENCES riffs_public(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, riff_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) NOT NULL,
  followed_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

-- ─── 4. Comments ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  riff_id UUID REFERENCES riffs_public(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 5. Gamification (XP + badges) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS xp_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  event_type TEXT NOT NULL,
  xp_amount INT NOT NULL,
  ref_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES profiles(id) NOT NULL,
  badge_slug TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, badge_slug)
);

-- ─── 6. Battles hebdo + votes ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS battles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_number INT NOT NULL,
  year INT NOT NULL,
  riff_a_id UUID REFERENCES riffs_public(id) NOT NULL,
  riff_b_id UUID REFERENCES riffs_public(id) NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  winner_riff_id UUID REFERENCES riffs_public(id),
  UNIQUE(year, week_number)
);

CREATE TABLE IF NOT EXISTS battle_votes (
  user_id UUID REFERENCES profiles(id) NOT NULL,
  battle_id UUID REFERENCES battles(id) ON DELETE CASCADE NOT NULL,
  voted_for_riff_id UUID REFERENCES riffs_public(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, battle_id)
);

-- ─── 7. Curation manuelle (editor picks) ───────────────────────────
CREATE TABLE IF NOT EXISTS editor_picks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  riff_id UUID REFERENCES riffs_public(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  editor_note TEXT,
  type TEXT DEFAULT 'week' CHECK (type IN ('day','week','month'))
);

-- ─── 8. Notifications ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 9. Indexes performance ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_likes_riff ON likes(riff_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_riffs_author ON riffs_public(author_id);
CREATE INDEX IF NOT EXISTS idx_riffs_published_at ON riffs_public(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_riff ON comments(riff_id);
CREATE INDEX IF NOT EXISTS idx_xp_user ON xp_events(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user_unread ON notifications(user_id, read_at);

-- ─── 10. RLS policies ──────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE riffs_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE editor_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop d'abord (idempotence) puis re-create
DROP POLICY IF EXISTS "Public read profiles" ON profiles;
DROP POLICY IF EXISTS "Insert own profile" ON profiles;
DROP POLICY IF EXISTS "Update own profile" ON profiles;
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public read riffs" ON riffs_public;
DROP POLICY IF EXISTS "Insert own riffs" ON riffs_public;
DROP POLICY IF EXISTS "Update own riffs" ON riffs_public;
DROP POLICY IF EXISTS "Delete own riffs" ON riffs_public;
CREATE POLICY "Public read riffs" ON riffs_public FOR SELECT USING (true);
CREATE POLICY "Insert own riffs" ON riffs_public FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Update own riffs" ON riffs_public FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "Delete own riffs" ON riffs_public FOR DELETE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Public read likes" ON likes;
DROP POLICY IF EXISTS "Like as me" ON likes;
DROP POLICY IF EXISTS "Unlike as me" ON likes;
CREATE POLICY "Public read likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Like as me" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unlike as me" ON likes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Read own bookmarks" ON bookmarks;
DROP POLICY IF EXISTS "Bookmark as me" ON bookmarks;
DROP POLICY IF EXISTS "Unbookmark as me" ON bookmarks;
CREATE POLICY "Read own bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Bookmark as me" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Unbookmark as me" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read follows" ON follows;
DROP POLICY IF EXISTS "Follow as me" ON follows;
DROP POLICY IF EXISTS "Unfollow as me" ON follows;
CREATE POLICY "Public read follows" ON follows FOR SELECT USING (true);
CREATE POLICY "Follow as me" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Unfollow as me" ON follows FOR DELETE USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Public read comments" ON comments;
DROP POLICY IF EXISTS "Comment as me" ON comments;
DROP POLICY IF EXISTS "Delete own comment" ON comments;
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Comment as me" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Delete own comment" ON comments FOR DELETE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Read own XP" ON xp_events;
CREATE POLICY "Read own XP" ON xp_events FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read user_badges" ON user_badges;
CREATE POLICY "Public read user_badges" ON user_badges FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read battles" ON battles;
CREATE POLICY "Public read battles" ON battles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read battle_votes" ON battle_votes;
DROP POLICY IF EXISTS "Vote in battle as me" ON battle_votes;
CREATE POLICY "Public read battle_votes" ON battle_votes FOR SELECT USING (true);
CREATE POLICY "Vote in battle as me" ON battle_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Public read editor_picks" ON editor_picks;
CREATE POLICY "Public read editor_picks" ON editor_picks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Read own notifs" ON notifications;
DROP POLICY IF EXISTS "Update own notifs" ON notifications;
CREATE POLICY "Read own notifs" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Update own notifs" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- ─── 11. Triggers XP automatique ───────────────────────────────────
-- Like reçu → +5 XP à l'auteur du riff
CREATE OR REPLACE FUNCTION grant_xp_on_like()
RETURNS TRIGGER AS $$
DECLARE
  author UUID;
BEGIN
  SELECT author_id INTO author FROM riffs_public WHERE id = NEW.riff_id;
  IF author IS NOT NULL AND author != NEW.user_id THEN
    INSERT INTO xp_events (user_id, event_type, xp_amount, ref_id)
    VALUES (author, 'receive_like', 5, NEW.riff_id);
    -- Notification au passage
    INSERT INTO notifications (user_id, type, payload)
    VALUES (
      author,
      'like',
      jsonb_build_object('from_user', NEW.user_id, 'riff_id', NEW.riff_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS xp_on_like ON likes;
CREATE TRIGGER xp_on_like AFTER INSERT ON likes
FOR EACH ROW EXECUTE FUNCTION grant_xp_on_like();

-- Riff publié → +50 XP à l'auteur
CREATE OR REPLACE FUNCTION grant_xp_on_publish()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO xp_events (user_id, event_type, xp_amount, ref_id)
  VALUES (NEW.author_id, 'publish_riff', 50, NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS xp_on_publish ON riffs_public;
CREATE TRIGGER xp_on_publish AFTER INSERT ON riffs_public
FOR EACH ROW EXECUTE FUNCTION grant_xp_on_publish();

-- Follow reçu → +10 XP + notification
CREATE OR REPLACE FUNCTION grant_xp_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO xp_events (user_id, event_type, xp_amount, ref_id)
  VALUES (NEW.followed_id, 'receive_follow', 10, NEW.follower_id);
  INSERT INTO notifications (user_id, type, payload)
  VALUES (
    NEW.followed_id,
    'follow',
    jsonb_build_object('from_user', NEW.follower_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS xp_on_follow ON follows;
CREATE TRIGGER xp_on_follow AFTER INSERT ON follows
FOR EACH ROW EXECUTE FUNCTION grant_xp_on_follow();

-- Comment reçu → notification au propriétaire du riff
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  riff_author UUID;
BEGIN
  SELECT author_id INTO riff_author FROM riffs_public WHERE id = NEW.riff_id;
  IF riff_author IS NOT NULL AND riff_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, payload)
    VALUES (
      riff_author,
      'comment',
      jsonb_build_object(
        'from_user', NEW.author_id,
        'riff_id', NEW.riff_id,
        'comment_id', NEW.id,
        'text', LEFT(NEW.text, 120)
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notif_on_comment ON comments;
CREATE TRIGGER notif_on_comment AFTER INSERT ON comments
FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- ─── 12. Storage bucket avatars ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Avatar images public read" ON storage.objects;
CREATE POLICY "Avatar images public read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatar upload own" ON storage.objects;
CREATE POLICY "Avatar upload own" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Avatar update own" ON storage.objects;
CREATE POLICY "Avatar update own" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ════════════════════════════════════════════════════════════════
-- DONE. Vérifie dans le Table Editor du dashboard que les 11 tables
-- sont là : profiles, riffs_public, likes, bookmarks, follows,
-- comments, xp_events, user_badges, battles, battle_votes,
-- editor_picks, notifications.
--
-- Pour tester :
-- 1. Crée un compte via /login dans l'app
-- 2. Va dans Authentication → Users : tu dois voir ton user
-- 3. Va dans Table Editor → profiles : un profil auto-créé doit
--    apparaître (trigger handle_new_user)
-- ════════════════════════════════════════════════════════════════
