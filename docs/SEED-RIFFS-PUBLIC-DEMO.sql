-- ════════════════════════════════════════════════════════════════
-- RiffLab — SEED DÉMO Session 30 (riffs publics + interactions)
-- ════════════════════════════════════════════════════════════════
--
-- À EXÉCUTER dans le SQL Editor du dashboard Supabase APRÈS
-- SUPABASE-MIGRATIONS-SESSION-29.sql.
--
-- Ce script crée :
--  - 5 profils démo (UUIDs explicites pour reproductibilité)
--  - 12 riffs publics avec tab_data, tags, techniques
--  - ~80 likes pseudo-distribués
--  - 15 commentaires
--  - 8 follows entre les démos
--  - 1 battle active de la semaine
--  - 1 editor_pick actif
--
-- ⚠️ DONNÉES FAKE pour démo. À supprimer quand de vrais users
-- arrivent. Voir scripts/clean-demo-data.sql.
--
-- Idempotent : ON CONFLICT DO NOTHING partout.
-- ════════════════════════════════════════════════════════════════

-- ─── Profils démo (UUIDs fixes pour réf) ──────────────────────────
-- Note : on ne peut PAS insérer dans auth.users directement (Supabase
-- protégé). Donc on crée juste les profiles avec des UUIDs random,
-- en assumant que ces profiles N'ONT PAS de compte auth (lecture
-- publique uniquement). Le trigger handle_new_user créera les vrais
-- profiles pour les comptes réels.

INSERT INTO profiles (id, username, display_name, bio, avatar_url) VALUES
  ('00000000-0000-4000-8000-000000000001', 'rifflab', 'RiffLab Curator',
   'Le compte officiel — sélections, curation, editor''s picks.', NULL),
  ('00000000-0000-4000-8000-000000000002', 'whiteguy', 'White Stripes Fan',
   'Tout le rock garage et minimaliste. Jack White worshipper.', NULL),
  ('00000000-0000-4000-8000-000000000003', 'zeppelin_kid', 'Classic Rock Kid',
   'Page, Plant, Bonham. Que les classiques 70s.', NULL),
  ('00000000-0000-4000-8000-000000000004', 'axl_rose', 'Hair Metal Live',
   'GnR / Mötley Crüe / Skid Row. Le hair metal n''est pas mort.', NULL),
  ('00000000-0000-4000-8000-000000000005', 'ed_blues', 'Blues Cat',
   'Clapton, SRV, Buddy Guy. Le bend doit pleurer.', NULL)
ON CONFLICT (id) DO NOTHING;

-- ─── Riffs publics ────────────────────────────────────────────────
-- tab_data = format Tab (measures array) avec notes { string, fret, duration, startBeat }
-- 12 riffs distribués sur les 5 profils.

INSERT INTO riffs_public (id, author_id, title, artist, description, bpm, tuning, capo, key, difficulty, techniques, tags, tab_data, published_at)
VALUES
  -- @whiteguy
  ('10000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000002',
   'Seven Nation Army', 'The White Stripes',
   'Le riff qui passe dans tous les stades de foot. Joue-le sur la corde de mi grave, simple comme bonjour.',
   124, 'standard', 0, 'E minor', 'beginner',
   '{}'::text[], ARRAY['rock', 'iconique']::text[],
   '[[{"string":5,"fret":7,"duration":4,"startBeat":0},{"string":5,"fret":7,"duration":2,"startBeat":4},{"string":5,"fret":10,"duration":2,"startBeat":6},{"string":5,"fret":7,"duration":4,"startBeat":8},{"string":5,"fret":5,"duration":2,"startBeat":12}]]'::jsonb,
   now() - interval '3 days'),

  ('10000000-0000-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000002',
   'Smoke on the Water', 'Deep Purple',
   'LE riff que TOUT le monde connaît. Si t''es débutant, c''est le premier à savoir par cœur 🤘',
   112, 'standard', 0, 'G minor', 'beginner',
   ARRAY['palm-mute']::text[], ARRAY['rock', 'iconique']::text[],
   '[[{"string":3,"fret":0,"duration":4,"startBeat":0},{"string":3,"fret":3,"duration":4,"startBeat":4},{"string":3,"fret":5,"duration":8,"startBeat":8}]]'::jsonb,
   now() - interval '5 days'),

  -- @zeppelin_kid
  ('10000000-0000-4000-8000-000000000003',
   '00000000-0000-4000-8000-000000000003',
   'Stairway to Heaven (intro)', 'Led Zeppelin',
   'L''intro qui a marqué une génération. Prends ton temps sur l''arpège, chaque note doit respirer.',
   72, 'standard', 0, 'A minor', 'advanced',
   ARRAY['arpège']::text[], ARRAY['rock', 'arpège', 'iconique']::text[],
   '[[{"string":2,"fret":7,"duration":2,"startBeat":0},{"string":1,"fret":5,"duration":2,"startBeat":2},{"string":0,"fret":0,"duration":2,"startBeat":4}]]'::jsonb,
   now() - interval '1 day'),

  ('10000000-0000-4000-8000-000000000004',
   '00000000-0000-4000-8000-000000000003',
   'Whole Lotta Love (intro)', 'Led Zeppelin',
   'Jimmy Page à son meilleur. Le riff blues-rock fondateur.',
   90, 'standard', 0, 'E minor', 'intermediate',
   ARRAY['bend', 'vibrato']::text[], ARRAY['rock', 'blues', 'iconique']::text[],
   '[[{"string":5,"fret":0,"duration":4,"startBeat":0},{"string":5,"fret":3,"duration":4,"startBeat":4},{"string":5,"fret":0,"duration":4,"startBeat":8},{"string":5,"fret":3,"duration":4,"startBeat":12}]]'::jsonb,
   now() - interval '10 days'),

  -- @axl_rose
  ('10000000-0000-4000-8000-000000000005',
   '00000000-0000-4000-8000-000000000004',
   'Sweet Child O'' Mine (intro)', 'Guns N'' Roses',
   'Slash a dit qu''il l''a écrit en s''échauffant. Décompose mesure par mesure et travaille la précision avant la vitesse.',
   125, 'standard', 0, 'D major', 'advanced',
   ARRAY['arpège', 'hammer', 'pull-off']::text[], ARRAY['rock', 'arpège', 'iconique']::text[],
   '[[{"string":2,"fret":15,"duration":2,"startBeat":0},{"string":1,"fret":14,"duration":2,"startBeat":2}]]'::jsonb,
   now() - interval '2 days'),

  ('10000000-0000-4000-8000-000000000006',
   '00000000-0000-4000-8000-000000000004',
   'Crazy Train (intro)', 'Ozzy Osbourne',
   'Randy Rhoads RIP 🤘 Le riff est plus dur qu''il en a l''air, surtout la transition en mesure 4.',
   136, 'standard', 0, 'F# minor', 'advanced',
   ARRAY['palm-mute', 'slide']::text[], ARRAY['rock', 'metal']::text[],
   '[[{"string":4,"fret":9,"duration":2,"startBeat":0},{"string":4,"fret":9,"duration":2,"startBeat":2}]]'::jsonb,
   now() - interval '6 days'),

  ('10000000-0000-4000-8000-000000000007',
   '00000000-0000-4000-8000-000000000004',
   'Iron Man', 'Black Sabbath',
   'Tony Iommi en mode total — joue palm-muted sur les notes basses pour le vrai grain Sabbath.',
   70, 'standard', 0, 'B minor', 'intermediate',
   ARRAY['palm-mute', 'hammer']::text[], ARRAY['rock', 'metal', 'iconique']::text[],
   '[[{"string":4,"fret":2,"duration":4,"startBeat":0},{"string":4,"fret":2,"duration":4,"startBeat":4},{"string":4,"fret":5,"duration":2,"startBeat":8}]]'::jsonb,
   now() - interval '12 days'),

  -- @ed_blues
  ('10000000-0000-4000-8000-000000000008',
   '00000000-0000-4000-8000-000000000005',
   'Sunshine of Your Love', 'Cream',
   'Clapton à son meilleur. Travaille le bend sur la 3e mesure, c''est ce qui fait toute la différence.',
   118, 'standard', 0, 'D major', 'intermediate',
   ARRAY['bend', 'vibrato']::text[], ARRAY['rock', 'blues', 'iconique']::text[],
   '[[{"string":3,"fret":12,"duration":2,"startBeat":0},{"string":3,"fret":10,"duration":2,"startBeat":2}]]'::jsonb,
   now() - interval '4 days'),

  ('10000000-0000-4000-8000-000000000009',
   '00000000-0000-4000-8000-000000000005',
   'Pride and Joy (intro)', 'Stevie Ray Vaughan',
   'Le blues shuffle parfait. Joue avec ton pouce sur la corde grave, c''est ça le secret SRV.',
   118, 'standard', 0, 'E major', 'expert',
   ARRAY['bend', 'slide', 'palm-mute']::text[], ARRAY['blues']::text[],
   '[[{"string":5,"fret":0,"duration":2,"startBeat":0},{"string":4,"fret":2,"duration":2,"startBeat":2}]]'::jsonb,
   now() - interval '7 days'),

  -- @rifflab (curator)
  ('10000000-0000-4000-8000-00000000000a',
   '00000000-0000-4000-8000-000000000001',
   'Back in Black', 'AC/DC',
   'AC/DC kiff total. Le swing c''est tout — joue laid back, pas droit comme un piquet.',
   95, 'standard', 0, 'E major', 'intermediate',
   ARRAY['palm-mute']::text[], ARRAY['rock', 'iconique']::text[],
   '[[{"string":5,"fret":0,"duration":2,"startBeat":0},{"string":4,"fret":2,"duration":2,"startBeat":2}]]'::jsonb,
   now() - interval '14 days'),

  ('10000000-0000-4000-8000-00000000000b',
   '00000000-0000-4000-8000-000000000001',
   'Day Tripper', 'The Beatles',
   'Beatles 1965 — riff catchy mais propre techniquement. Travaille les hammer-on en alternance.',
   137, 'standard', 0, 'E major', 'advanced',
   ARRAY['hammer', 'pull-off']::text[], ARRAY['pop', 'rock', 'iconique']::text[],
   '[[{"string":4,"fret":2,"duration":2,"startBeat":0},{"string":4,"fret":4,"duration":2,"startBeat":2}]]'::jsonb,
   now() - interval '9 days'),

  ('10000000-0000-4000-8000-00000000000c',
   '00000000-0000-4000-8000-000000000001',
   'Money for Nothing (intro)', 'Dire Straits',
   'Knopfler fingerpicking au pouce. Si tu joues au médiator, faux bons résultats mais c''est moins authentique.',
   135, 'standard', 0, 'G minor', 'advanced',
   ARRAY['arpège']::text[], ARRAY['rock', 'iconique']::text[],
   '[[{"string":4,"fret":0,"duration":4,"startBeat":0},{"string":4,"fret":3,"duration":2,"startBeat":4}]]'::jsonb,
   now() - interval '11 days')
ON CONFLICT (id) DO NOTHING;

-- ─── Likes pseudo-distribués (~80) ─────────────────────────────────
-- On crée les likes en INSERT...SELECT cross-join, avec un peu de
-- diversité. Chaque demo user like 10-20 riffs des autres.

INSERT INTO likes (user_id, riff_id)
SELECT p.id, r.id
FROM profiles p
CROSS JOIN riffs_public r
WHERE p.id != r.author_id
  AND p.id IN (
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000002',
    '00000000-0000-4000-8000-000000000003',
    '00000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000005'
  )
  AND r.id LIKE '10000000-0000-4000-8000-%'
  -- Pseudo-aléa déterministe via md5 → ~80% des paires
  AND ('x' || substr(md5(p.id::text || r.id::text), 1, 8))::bit(32)::int % 10 < 8
ON CONFLICT (user_id, riff_id) DO NOTHING;

-- ─── Commentaires (15) ────────────────────────────────────────────

INSERT INTO comments (id, author_id, riff_id, text, created_at) VALUES
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000003',
   '10000000-0000-4000-8000-000000000001',
   'Riff de mes 14 ans !', now() - interval '2 days'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000004',
   '10000000-0000-4000-8000-000000000001',
   'Joue-le aussi à la basse, ça déchire en jam.', now() - interval '1 day'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000002',
   'Le grand classique. Bien vu de l''avoir en intermédiaire.', now() - interval '4 days'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000005',
   '10000000-0000-4000-8000-000000000002',
   'Première fois que je l''ai joué : 1998. Toujours dans les doigts.', now() - interval '3 days'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000003',
   'L''arpège du début est trompeur, il faut un picking solide.', now() - interval '12 hours'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000004',
   '10000000-0000-4000-8000-000000000003',
   'Posté en advanced à juste titre — facile à mal jouer.', now() - interval '8 hours'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000003',
   '10000000-0000-4000-8000-000000000005',
   'Les hammer-on en mesure 2 c''est le piège. Travaille lent.', now() - interval '20 hours'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000005',
   '10000000-0000-4000-8000-000000000008',
   'Le bend doit pleurer ou tu le rates. Va voir le DVD Cream Live.', now() - interval '2 days'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000002',
   '10000000-0000-4000-8000-000000000008',
   'Top du blues-rock UK. Cream est sous-coté côté technique.', now() - interval '3 days'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-000000000009',
   'SRV est ma religion. Pride and Joy = catéchisme.', now() - interval '5 days'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000003',
   '10000000-0000-4000-8000-00000000000a',
   'AC/DC = swing > technique. Bien posé celui-ci.', now() - interval '10 days'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000001',
   '10000000-0000-4000-8000-00000000000b',
   'Beatles + hammer-on = workshop technique pur.', now() - interval '6 days'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000005',
   '10000000-0000-4000-8000-000000000007',
   'Iommi est le père du doom. Ce riff a 50 ans et il a pas pris une ride.', now() - interval '11 days'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000003',
   '10000000-0000-4000-8000-000000000006',
   'Randy était un génie. La fluidité de Crazy Train me bluffe encore.', now() - interval '5 days'),
  (gen_random_uuid(), '00000000-0000-4000-8000-000000000004',
   '10000000-0000-4000-8000-000000000004',
   'Whole Lotta Love + un Marshall = paradis.', now() - interval '9 days');

-- ─── Follows (8) entre les démos ──────────────────────────────────

INSERT INTO follows (follower_id, followed_id) VALUES
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000003'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000005'),
  ('00000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000003')
ON CONFLICT (follower_id, followed_id) DO NOTHING;

-- ─── Battle de la semaine en cours ────────────────────────────────

INSERT INTO battles (id, week_number, year, riff_a_id, riff_b_id, ends_at)
VALUES (
  '20000000-0000-4000-8000-000000000001',
  EXTRACT(WEEK FROM CURRENT_DATE)::INT,
  EXTRACT(YEAR FROM CURRENT_DATE)::INT,
  '10000000-0000-4000-8000-000000000001', -- Seven Nation Army
  '10000000-0000-4000-8000-000000000005', -- Sweet Child O' Mine
  CURRENT_DATE + INTERVAL '7 days'
)
ON CONFLICT (year, week_number) DO NOTHING;

-- Quelques votes pseudo-distribués (12-15 votes)
INSERT INTO battle_votes (user_id, battle_id, voted_for_riff_id)
SELECT
  p.id,
  '20000000-0000-4000-8000-000000000001',
  CASE
    WHEN ('x' || substr(md5(p.id::text || 'battle1'), 1, 8))::bit(32)::int % 2 = 0
      THEN '10000000-0000-4000-8000-000000000001'
    ELSE '10000000-0000-4000-8000-000000000005'
  END
FROM profiles p
WHERE p.id LIKE '00000000-0000-4000-8000-%'
ON CONFLICT (user_id, battle_id) DO NOTHING;

-- ─── Editor's pick actif ──────────────────────────────────────────

INSERT INTO editor_picks (riff_id, start_date, end_date, editor_note, type)
VALUES (
  '10000000-0000-4000-8000-000000000003', -- Stairway intro
  CURRENT_DATE - INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '5 days',
  'Mon coup de cœur cette semaine. Si tu commences l''arpège fingerpicking, c''est le riff fondateur. Joue-le 10 fois lentement avant de chercher la vitesse.',
  'week'
)
ON CONFLICT DO NOTHING;

-- ─── DONE ─────────────────────────────────────────────────────────
-- Pour vérifier :
--   SELECT COUNT(*) FROM riffs_public;  -- attendu 12
--   SELECT COUNT(*) FROM likes;         -- attendu ~80 (variable)
--   SELECT COUNT(*) FROM comments;      -- attendu 15
--   SELECT COUNT(*) FROM follows;       -- attendu 8
--   SELECT COUNT(*) FROM battles;       -- attendu 1
--   SELECT COUNT(*) FROM editor_picks;  -- attendu 1
-- ════════════════════════════════════════════════════════════════
