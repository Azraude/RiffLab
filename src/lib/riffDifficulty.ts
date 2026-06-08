/**
 * Algo de calcul auto de la difficulté d'un riff (sess 27 Phase 4).
 *
 * Score 0-100 basé sur :
 *  - Densité de notes par seconde (×10)
 *  - Techniques avancées présentes (bend / tapping / sweep) (+25)
 *  - Range fret > 12 (+15)
 *  - BPM > 140 (+15)
 *
 * Buckets :
 *  - < 25 : beginner
 *  - 25-50 : intermediate
 *  - 50-75 : advanced
 *  - ≥ 75 : expert
 */
import type { Tab } from './tabsDatabase';
import type { RiffLevel, RiffTechnique } from './communityRiffs';

interface DifficultyInput {
  tab: Tab;
  techniques: RiffTechnique[];
  bpm: number;
}

const ADVANCED_TECHS: RiffTechnique[] = ['bend', 'tapping', 'sweep'];

export function computeDifficulty({ tab, techniques, bpm }: DifficultyInput): {
  level: RiffLevel;
  score: number;
  /** Détail des points marqués pour explication UI */
  breakdown: { densityPts: number; techPts: number; rangePts: number; bpmPts: number };
} {
  const allNotes = tab.measures.flatMap((m) => m);
  const noteCount = allNotes.length;
  // Durée totale en secondes : nbMesures × 4 noires × (60/BPM)
  const durationSec = Math.max(1, tab.measures.length * 4 * (60 / Math.max(40, bpm)));
  const notesPerSec = noteCount / durationSec;

  const maxFret = allNotes.length > 0 ? Math.max(...allNotes.map((n) => n.fret)) : 0;
  const hasAdvanced = techniques.some((t) => ADVANCED_TECHS.includes(t));

  const densityPts = Math.min(40, notesPerSec * 10);
  const techPts = hasAdvanced ? 25 : 0;
  const rangePts = maxFret > 12 ? 15 : 0;
  const bpmPts = bpm > 140 ? 15 : bpm > 100 ? 5 : 0;
  const score = Math.round(densityPts + techPts + rangePts + bpmPts);

  let level: RiffLevel = 'beginner';
  if (score >= 75) level = 'expert';
  else if (score >= 50) level = 'advanced';
  else if (score >= 25) level = 'intermediate';

  return {
    level,
    score,
    breakdown: { densityPts: Math.round(densityPts), techPts, rangePts, bpmPts },
  };
}

/** Mapping difficulté nommée → 1-5 pour compat le seed/Dexie schema. */
export function levelToDifficulty(level: RiffLevel): 1 | 2 | 3 | 4 | 5 {
  switch (level) {
    case 'beginner':
      return 1;
    case 'intermediate':
      return 2;
    case 'advanced':
      return 4;
    case 'expert':
      return 5;
  }
}
