-- ════════════════════════════════════════════════════════════════
-- RiffLab — Migrations Supabase Session D (Voie B : audio réel par riff)
-- ════════════════════════════════════════════════════════════════
--
-- À EXÉCUTER dans le SQL Editor du dashboard Supabase :
-- https://supabase.com/dashboard/project/mneifpmfknreopfqfmyz/sql/new
--
-- Objectif : préparer le mécanisme pour qu'un riff puisse référencer un
-- VRAI enregistrement audio (MP3 / Opus) plutôt que la synthèse Tone.js.
-- Le front lit déjà ce champ (CommunityRiff.audio_url) et playRiff() le
-- joue via Tone.Player si présent.
--
-- IDEMPOTENT : re-run sans casser l'existant.
-- ════════════════════════════════════════════════════════════════

-- ─── 1. Colonne audio_url sur riffs_public ────────────────────────
-- Additif, nullable : les riffs existants restent en synthèse (NULL).
ALTER TABLE riffs_public ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- ─── 2. Storage bucket public 'riff-audio' ────────────────────────
-- Lecture publique (les riffs sont publics), upload réservé aux users
-- authentifiés (les contributeurs).
INSERT INTO storage.buckets (id, name, public)
VALUES ('riff-audio', 'riff-audio', true)
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Public read riff audio" ON storage.objects;
CREATE POLICY "Public read riff audio" ON storage.objects
FOR SELECT USING (bucket_id = 'riff-audio');

DROP POLICY IF EXISTS "Authors upload riff audio" ON storage.objects;
CREATE POLICY "Authors upload riff audio" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'riff-audio' AND auth.role() = 'authenticated'
);

-- (Optionnel mais recommandé) — autoriser un auteur à remplacer/supprimer
-- ses propres fichiers, en rangeant les uploads sous un dossier = user id :
--   `riff-audio/<auth.uid()>/<riff_id>.mp3`
DROP POLICY IF EXISTS "Authors update own riff audio" ON storage.objects;
CREATE POLICY "Authors update own riff audio" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'riff-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authors delete own riff audio" ON storage.objects;
CREATE POLICY "Authors delete own riff audio" ON storage.objects
FOR DELETE USING (
  bucket_id = 'riff-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ════════════════════════════════════════════════════════════════
-- DONE. Vérifie :
-- 1. Table Editor → riffs_public : la colonne `audio_url` (text, nullable)
--    est présente.
-- 2. Storage : le bucket `riff-audio` existe, public, avec les 4 policies.
--
-- Pour tester un riff audio réel plus tard :
--   - upload un MP3 dans riff-audio/<user_id>/<riff_id>.mp3
--   - set riffs_public.audio_url = URL publique du fichier
--   - playRiff() le jouera automatiquement.
-- ════════════════════════════════════════════════════════════════
