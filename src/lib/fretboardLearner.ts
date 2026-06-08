/**
 * Logique pure du mini-jeu Fretboard Learner — pickQuestion + validation.
 *
 * Découplé de la page React pour testabilité + clarté. La page ne gère
 * que l'UI + state, toute la théorie passe ici.
 */
import {
  NOTE_NAMES,
  TUNINGS,
  pitchClass,
  midiToNoteWithOctave,
  stringNoteAt,
  type NoteName,
  type Midi,
  type TuningId,
} from './theory';
import type { FretboardLearnerLevel } from './db';

/** Une question posée à l'user. */
export type FretboardQuestion = {
  /** Note à trouver (pitch class) */
  targetPC: number;
  targetName: NoteName;
  /** Avec octave si niveau advanced (ex: 'G2'), sinon null */
  targetWithOctave: string | null;
  /** Corde imposée (0=Mi grave) si niveau beginner, null sinon */
  forcedStringIdx: number | null;
  /** Liste de toutes les positions correctes possibles (pour validation
   *  et highlight de la bonne réponse en cas d'erreur). */
  validPositions: Array<{ stringIdx: number; fret: number; midi: Midi }>;
  /** Temps imparti (ms) selon le niveau */
  timeBudgetMs: number;
};

/**
 * Durées par niveau (ms).
 *  - beginner 10s — chill, on découvre
 *  - intermediate 8s
 *  - advanced 6s — octave spécifique
 *  - expert 4s — speed mode
 */
const TIME_BUDGET: Record<FretboardLearnerLevel, number> = {
  beginner: 10_000,
  intermediate: 8_000,
  advanced: 6_000,
  expert: 4_000,
};

/** Plage de frettes utilisable (0=open, 12=octave). On évite le très haut
 *  pour le débutant (notes peu utilisées en pratique). */
const FRET_RANGE: Record<FretboardLearnerLevel, [number, number]> = {
  beginner: [0, 7],
  intermediate: [0, 12],
  advanced: [0, 14],
  expert: [0, 14],
};

/** Cordes utilisables en débutant (les graves au début, c'est moins
 *  abstrait). En intermédiaire+ : toutes. */
const STRING_RANGE: Record<FretboardLearnerLevel, number[]> = {
  beginner: [0, 1, 2], // E2, A2, D3
  intermediate: [0, 1, 2, 3, 4, 5],
  advanced: [0, 1, 2, 3, 4, 5],
  expert: [0, 1, 2, 3, 4, 5],
};

/**
 * Pick une note random selon le niveau + génère la liste des positions
 * correctes sur le manche dans la plage autorisée.
 *
 * @param level niveau de difficulté
 * @param tuning accordage (par défaut standard)
 * @param numFrets nb max de frettes affichées sur le fretboard (14 par défaut)
 */
export function pickQuestion(
  level: FretboardLearnerLevel,
  tuning: TuningId = 'standard',
  numFrets = 14
): FretboardQuestion {
  const [fretMin, fretMax] = FRET_RANGE[level];
  const stringsAllowed = STRING_RANGE[level];

  // Pick une pitch class. Pour beginner / intermediate : on évite les
  // notes altérées (#) qui demandent plus de pratique. Pour advanced /
  // expert : tout est jeu.
  const allowAltered = level === 'advanced' || level === 'expert';
  const allowedPCs = allowAltered
    ? Array.from({ length: 12 }, (_, i) => i)
    : [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
  const targetPC = allowedPCs[Math.floor(Math.random() * allowedPCs.length)];
  const targetName = NOTE_NAMES[targetPC];

  // Génère TOUTES les positions correctes dans la zone autorisée
  const allPositions: Array<{ stringIdx: number; fret: number; midi: Midi }> = [];
  stringsAllowed.forEach((sIdx) => {
    for (let f = fretMin; f <= Math.min(fretMax, numFrets); f++) {
      const midi = stringNoteAt(sIdx, f, tuning);
      if (pitchClass(midi) === targetPC) {
        allPositions.push({ stringIdx: sIdx, fret: f, midi });
      }
    }
  });

  // Niveau beginner : on impose une corde
  let forcedStringIdx: number | null = null;
  let validPositions = allPositions;
  if (level === 'beginner') {
    // Pick une corde parmi celles qui contiennent la note
    const stringsWithNote = Array.from(new Set(allPositions.map((p) => p.stringIdx)));
    if (stringsWithNote.length > 0) {
      forcedStringIdx =
        stringsWithNote[Math.floor(Math.random() * stringsWithNote.length)];
      validPositions = allPositions.filter((p) => p.stringIdx === forcedStringIdx);
    }
  }

  // Niveau advanced : on impose un octave spécifique (pick parmi les positions)
  let targetWithOctave: string | null = null;
  if (level === 'advanced' && allPositions.length > 0) {
    const picked = allPositions[Math.floor(Math.random() * allPositions.length)];
    targetWithOctave = midiToNoteWithOctave(picked.midi);
    validPositions = allPositions.filter((p) => p.midi === picked.midi);
  }

  return {
    targetPC,
    targetName,
    targetWithOctave,
    forcedStringIdx,
    validPositions,
    timeBudgetMs: TIME_BUDGET[level],
  };
}

/**
 * Valide un clic user.
 * @returns true si la position cliquée est dans validPositions
 */
export function validateAnswer(
  question: FretboardQuestion,
  clickedStringIdx: number,
  clickedFret: number,
  tuning: TuningId = 'standard'
): boolean {
  // Pour beginner : doit être sur la corde imposée
  if (question.forcedStringIdx !== null && clickedStringIdx !== question.forcedStringIdx) {
    return false;
  }
  const clickedMidi = stringNoteAt(clickedStringIdx, clickedFret, tuning);
  // Pour advanced : doit matcher l'octave précis
  if (question.targetWithOctave !== null) {
    return question.validPositions.some((p) => p.midi === clickedMidi);
  }
  // Sinon : juste la bonne pitch class
  return pitchClass(clickedMidi) === question.targetPC;
}

/**
 * Texte affiché de la question selon le niveau.
 */
export function questionLabel(question: FretboardQuestion): {
  primary: string;
  hint: string | null;
} {
  if (question.targetWithOctave) {
    return {
      primary: `Joue un ${question.targetWithOctave}`,
      hint: 'Octave spécifique attendue',
    };
  }
  if (question.forcedStringIdx !== null) {
    const stringLabels = [
      'Mi grave (6e corde)',
      'La (5e corde)',
      'Ré (4e corde)',
      'Sol (3e corde)',
      'Si (2e corde)',
      'Mi aigu (1ère corde)',
    ];
    return {
      primary: `Joue un ${question.targetName}`,
      hint: `Sur la corde de ${stringLabels[question.forcedStringIdx]}`,
    };
  }
  return {
    primary: `Joue un ${question.targetName}`,
    hint: "N'importe quelle corde, n'importe quelle position",
  };
}

/** MIDI au-quel jouer la note attendue en audio (preview). */
export function previewMidi(question: FretboardQuestion): Midi {
  // Si une position valide existe dans la liste, joue la médiane
  if (question.validPositions.length > 0) {
    const sorted = [...question.validPositions].sort((a, b) => a.midi - b.midi);
    return sorted[Math.floor(sorted.length / 2)].midi;
  }
  // Fallback : C central (60 = C4) + offset pour atterrir sur la note
  return 60 + (question.targetPC - 0);
}

export const LEVEL_LABELS: Record<FretboardLearnerLevel, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert',
};

export const LEVEL_DESCRIPTIONS: Record<FretboardLearnerLevel, string> = {
  beginner: 'Note + corde imposée · 10s par question · 3 cordes graves',
  intermediate: 'Note seule, toutes positions · 8s par question · toutes cordes',
  advanced: 'Octave précis · 6s par question · notes altérées',
  expert: 'Speed mode · 4s par question · combo multiplier',
};

/** Le nombre de questions par session selon le niveau. */
export function questionsPerSession(_level: FretboardLearnerLevel): number {
  return 20;
}

export { TUNINGS };
