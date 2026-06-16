# 🎸 Création d'une battle hebdomadaire — guide manuel

> Pour chaque lundi, exécute le SQL ci-dessous dans le SQL Editor du
> dashboard Supabase. Plus tard : une edge function Supabase planifiée
> automatisera ce process (Phase 6 ou 7).

## Process

1. Identifie 2 riffs récents qui devraient s'affronter cette semaine
   - Critères : récents (< 14 jours), bien likés, diversité de genre
   - SQL helper pour voir les candidats :
     ```sql
     SELECT
       r.id,
       r.title,
       r.artist,
       r.bpm,
       r.difficulty,
       p.username AS author,
       (SELECT COUNT(*) FROM likes WHERE riff_id = r.id) AS likes
     FROM riffs_public r
     JOIN profiles p ON p.id = r.author_id
     WHERE r.published_at > NOW() - INTERVAL '14 days'
     ORDER BY likes DESC
     LIMIT 20;
     ```

2. Copie les 2 UUIDs des riffs choisis (`riff_a_id` et `riff_b_id`)

3. Crée la battle :
   ```sql
   INSERT INTO battles (week_number, year, riff_a_id, riff_b_id, ends_at)
   VALUES (
     EXTRACT(WEEK FROM CURRENT_DATE)::INT,
     EXTRACT(YEAR FROM CURRENT_DATE)::INT,
     'UUID-DU-RIFF-A-ICI',
     'UUID-DU-RIFF-B-ICI',
     CURRENT_DATE + INTERVAL '7 days'
   );
   ```

4. La page `/battle` détecte automatiquement la battle active (la plus
   récente avec `ends_at > now()`).

## Déclarer le gagnant (fin de semaine)

Quand la battle est terminée :

```sql
UPDATE battles
SET winner_riff_id = (
  SELECT voted_for_riff_id
  FROM battle_votes
  WHERE battle_id = '<UUID-BATTLE>'
  GROUP BY voted_for_riff_id
  ORDER BY COUNT(*) DESC
  LIMIT 1
)
WHERE id = '<UUID-BATTLE>';
```

Puis unlock le badge `battle-champion` au winner :

```sql
INSERT INTO user_badges (user_id, badge_slug)
SELECT author_id, 'battle-champion'
FROM riffs_public
WHERE id = (SELECT winner_riff_id FROM battles WHERE id = '<UUID-BATTLE>')
ON CONFLICT DO NOTHING;
```

Et insère un événement XP bonus +100 XP au winner :

```sql
INSERT INTO xp_events (user_id, event_type, xp_amount, ref_id)
SELECT
  rp.author_id,
  'battle_win',
  100,
  rp.id
FROM riffs_public rp
WHERE rp.id = (SELECT winner_riff_id FROM battles WHERE id = '<UUID-BATTLE>');
```

## Plus tard (Phase 6+)

Edge function Supabase planifiée pour :
- Tous les lundis matin : pick auto 2 riffs trending de la semaine
  passée + INSERT battle
- Tous les dimanches soir : compute winner + unlock badge + grant XP
