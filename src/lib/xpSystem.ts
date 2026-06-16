/**
 * Système XP + Niveau "Riffeur" — Phase 5 gamification (sess 29).
 *
 * Source de vérité : `xp_events` table Supabase (somme des xp_amount
 * par user_id). Pas de cache côté client — on requery à chaque load
 * de profil (acceptable car volume faible par user).
 *
 * Thresholds inspirés des MMORPG : early ramp doux (premier niveau
 * facile pour l'onboarding), puis exponentielle douce.
 */

const LEVEL_THRESHOLDS = [
  0, // L1 Débutant
  100, // L2 Apprenti
  250, // L3 Initié
  500, // L4 Intermédiaire
  1000, // L5 Avancé
  2000, // L6 Confirmé
  3500, // L7 Expert
  5500, // L8 Maître
  8500, // L9 Virtuose
  12500, // L10 Légende
  18000, // L11 Mythique
  25000, // L12 Divin
];

const LEVEL_NAMES = [
  'Débutant',
  'Apprenti',
  'Initié',
  'Intermédiaire',
  'Avancé',
  'Confirmé',
  'Expert',
  'Maître',
  'Virtuose',
  'Légende',
  'Mythique',
  'Divin',
];

export type LevelInfo = {
  /** Niveau 1-12 */
  level: number;
  /** Nom français du niveau */
  name: string;
  /** XP cumulé pour atteindre ce niveau */
  currentThreshold: number;
  /** XP cumulé pour atteindre le niveau suivant (Infinity au max) */
  nextThreshold: number;
  /** Progression 0-1 vers le niveau suivant */
  progress: number;
};

/**
 * Calcule le niveau à partir du XP total cumulé.
 */
export function computeLevel(totalXP: number): LevelInfo {
  const safeXP = Math.max(0, totalXP);
  let levelIdx = 0;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (safeXP >= LEVEL_THRESHOLDS[i]) {
      levelIdx = i;
    } else {
      break;
    }
  }
  const isMax = levelIdx === LEVEL_THRESHOLDS.length - 1;
  const currentThreshold = LEVEL_THRESHOLDS[levelIdx];
  const nextThreshold = isMax ? Infinity : LEVEL_THRESHOLDS[levelIdx + 1];
  const progress = isMax
    ? 1
    : (safeXP - currentThreshold) / (nextThreshold - currentThreshold);

  return {
    level: levelIdx + 1,
    name: LEVEL_NAMES[levelIdx],
    currentThreshold,
    nextThreshold,
    progress: Math.max(0, Math.min(1, progress)),
  };
}

/** Valeurs XP par type d'événement (doit matcher les triggers SQL). */
export const XP_VALUES = {
  publish_riff: 50,
  receive_like: 5,
  receive_follow: 10,
  mastered_riff: 20,
  daily_practice: 15,
  publish_comment: 3,
  battle_win: 100,
  editor_pick: 200,
} as const;
