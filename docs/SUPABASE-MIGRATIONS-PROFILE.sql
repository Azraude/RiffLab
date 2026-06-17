-- ════════════════════════════════════════════════════════════════════
-- Migration : enrichissement profiles (sess PROFIL)
-- ════════════════════════════════════════════════════════════════════
-- À exécuter dans l'éditeur SQL Supabase (https://app.supabase.com).
-- Idempotent : peut être lancé plusieurs fois sans casser.
--
-- Ajoute :
--   - cover_url        : URL cover photo profil (par défaut 1 des 5 SVG bundled)
--   - instagram_url    : lien Instagram
--   - youtube_url      : lien YouTube
--   - soundcloud_url   : lien SoundCloud
--   - website_url      : site perso
--   - instruments      : tableau 'acoustic' | 'electric' | 'classical' | 'bass'
--
-- + bucket Storage `covers` pour les uploads custom.

-- ─── Colonnes profiles ────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS soundcloud_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instruments TEXT[] DEFAULT '{}';

-- Bio est déjà dans le schéma sess 29 (TEXT, nullable). Si absente :
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- ─── Storage bucket covers ───────────────────────────────────────
-- Public-read : tous les visiteurs (non auth inclus) peuvent voir
-- les covers profil. Upload réservé aux users authentifiés.
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Public read on covers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read covers'
  ) THEN
    CREATE POLICY "Public read covers" ON storage.objects
      FOR SELECT USING (bucket_id = 'covers');
  END IF;
END $$;

-- Authenticated upload to covers (chemin <userId>/cover-<ts>.<ext>)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authors upload covers'
  ) THEN
    CREATE POLICY "Authors upload covers" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'covers'
        AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

-- Authors can update/delete their own cover files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authors update covers'
  ) THEN
    CREATE POLICY "Authors update covers" ON storage.objects
      FOR UPDATE USING (
        bucket_id = 'covers'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Authors delete covers'
  ) THEN
    CREATE POLICY "Authors delete covers" ON storage.objects
      FOR DELETE USING (
        bucket_id = 'covers'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;

-- ─── Vérification (optionnelle, comment out en prod) ─────────────
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'profiles'
-- ORDER BY ordinal_position;
