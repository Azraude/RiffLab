-- Nettoyage des données démo seed sess 30.
-- À exécuter dans le SQL Editor quand de vrais users arrivent.
--
-- CASCADE remove likes/comments/follows/votes liés.

DELETE FROM riffs_public WHERE id LIKE '10000000-0000-4000-8000-%';
DELETE FROM battles WHERE id = '20000000-0000-4000-8000-000000000001';
DELETE FROM editor_picks
  WHERE riff_id IN (
    SELECT id FROM riffs_public WHERE id LIKE '10000000-0000-4000-8000-%'
  );
DELETE FROM profiles WHERE id IN (
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000004',
  '00000000-0000-4000-8000-000000000005'
);
