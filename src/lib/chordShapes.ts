/**
 * Templates CAGED + générateur de voicings pour tous les accords.
 *
 * Approche : on définit une poignée de "shapes" canoniques (E-shape, A-shape,
 * etc.) qui couvrent les qualités usuelles, puis on les transpose pour
 * couvrir les 12 roots × N qualités sans hardcoder 200+ entrées.
 *
 *   buildVoicing(template, targetRootPC) :
 *     - offset = (targetRootPC - template.rootPC) mod 12
 *     - si offset = 0 → on retourne la forme OUVERTE (open chord)
 *     - sinon → on shift toutes les frettes par +offset, on place une barre
 *       (si le template en définit une) à la frette `offset`.
 *
 *   getVoicingsForChord(rootPC, quality) :
 *     - renvoie tous les voicings applicables, triés par difficulté
 *     - les opens hardcodés dans `PREFERRED_OPEN_VOICINGS` overrident le
 *       générateur quand ils correspondent (fingering canonique vs barré
 *       théorique au natural fret).
 */

import type { NoteName } from './theory';
import type { Voicing } from './chordDatabase';

// Pitch class shortcuts (NOTE_NAMES order : C C# D D# E F F# G G# A A# B)
const C = 0;
const D = 2;
const E = 4;
const F = 5;
const G = 7;
const A = 9;
const B = 11;
const m = null;

// ─── Type ──────────────────────────────────────────────────────────────

export type ShapeTemplate = {
  /** Identifiant lisible (E, A, D, C, G + variant) — informatif */
  shape: string;
  /** Qualité ('maj', 'min', '7', 'maj7', 'm7', 'sus2', 'sus4', ...) */
  quality: string;
  /** Pitch class de la fondamentale dans le template (au "natural fret") */
  rootPC: number;
  /** Frettes au natural fret. null = mute, 0 = open, n = frette n */
  frets: (number | null)[];
  /** Doigté dans la version OUVERTE (utilisé si offset = 0) */
  fingersOpen?: (number | null)[];
  /** Doigté dans la version BARRÉE (offset > 0) */
  fingersBarred: (number | null)[];
  /** Si le template est barréable, indique les cordes couvertes */
  barre?: { fromString: number; toString: number };
  /** Difficulté de base (1-5). Le générateur la bump selon la position. */
  difficulty: 1 | 2 | 3 | 4 | 5;
};

// ─── Templates ─────────────────────────────────────────────────────────

const TEMPLATES: ShapeTemplate[] = [
  // ─── MAJOR ───────────────────────────────────────────────────
  {
    shape: 'E-shape',
    quality: 'maj',
    rootPC: E,
    frets: [0, 2, 2, 1, 0, 0],
    fingersOpen: [0, 2, 3, 1, 0, 0],
    fingersBarred: [1, 3, 4, 2, 1, 1],
    barre: { fromString: 0, toString: 5 },
    difficulty: 1,
  },
  {
    shape: 'A-shape',
    quality: 'maj',
    rootPC: A,
    frets: [m, 0, 2, 2, 2, 0],
    fingersOpen: [m, 0, 1, 2, 3, 0],
    fingersBarred: [m, 1, 3, 3, 3, 1],
    barre: { fromString: 1, toString: 5 },
    difficulty: 1,
  },

  // ─── MINOR ───────────────────────────────────────────────────
  {
    shape: 'Em-shape',
    quality: 'min',
    rootPC: E,
    frets: [0, 2, 2, 0, 0, 0],
    fingersOpen: [0, 2, 3, 0, 0, 0],
    fingersBarred: [1, 3, 4, 1, 1, 1],
    barre: { fromString: 0, toString: 5 },
    difficulty: 1,
  },
  {
    shape: 'Am-shape',
    quality: 'min',
    rootPC: A,
    frets: [m, 0, 2, 2, 1, 0],
    fingersOpen: [m, 0, 2, 3, 1, 0],
    fingersBarred: [m, 1, 3, 4, 2, 1],
    barre: { fromString: 1, toString: 5 },
    difficulty: 1,
  },

  // ─── DOMINANT 7 ──────────────────────────────────────────────
  {
    shape: 'E7-shape',
    quality: '7',
    rootPC: E,
    frets: [0, 2, 0, 1, 0, 0],
    fingersOpen: [0, 2, 0, 1, 0, 0],
    fingersBarred: [1, 3, 1, 2, 1, 1],
    barre: { fromString: 0, toString: 5 },
    difficulty: 1,
  },
  {
    shape: 'A7-shape',
    quality: '7',
    rootPC: A,
    frets: [m, 0, 2, 0, 2, 0],
    fingersOpen: [m, 0, 2, 0, 3, 0],
    fingersBarred: [m, 1, 3, 1, 3, 1],
    barre: { fromString: 1, toString: 5 },
    difficulty: 1,
  },

  // ─── MAJOR 7 ─────────────────────────────────────────────────
  {
    shape: 'Emaj7-shape',
    quality: 'maj7',
    rootPC: E,
    frets: [0, 2, 1, 1, 0, 0],
    fingersOpen: [0, 3, 1, 2, 0, 0],
    fingersBarred: [1, 4, 2, 3, 1, 1],
    barre: { fromString: 0, toString: 5 },
    difficulty: 2,
  },
  {
    shape: 'Amaj7-shape',
    quality: 'maj7',
    rootPC: A,
    frets: [m, 0, 2, 1, 2, 0],
    fingersOpen: [m, 0, 2, 1, 3, 0],
    fingersBarred: [m, 1, 3, 2, 4, 1],
    barre: { fromString: 1, toString: 5 },
    difficulty: 2,
  },

  // ─── MINOR 7 ─────────────────────────────────────────────────
  {
    shape: 'Em7-shape',
    quality: 'm7',
    rootPC: E,
    frets: [0, 2, 0, 0, 0, 0],
    fingersOpen: [0, 2, 0, 0, 0, 0],
    fingersBarred: [1, 3, 1, 1, 1, 1],
    barre: { fromString: 0, toString: 5 },
    difficulty: 1,
  },
  {
    shape: 'Am7-shape',
    quality: 'm7',
    rootPC: A,
    frets: [m, 0, 2, 0, 1, 0],
    fingersOpen: [m, 0, 2, 0, 1, 0],
    fingersBarred: [m, 1, 3, 1, 2, 1],
    barre: { fromString: 1, toString: 5 },
    difficulty: 1,
  },

  // ─── SUS2 ────────────────────────────────────────────────────
  {
    shape: 'Asus2-shape',
    quality: 'sus2',
    rootPC: A,
    frets: [m, 0, 2, 2, 0, 0],
    fingersOpen: [m, 0, 1, 2, 0, 0],
    fingersBarred: [m, 1, 3, 4, 1, 1],
    barre: { fromString: 1, toString: 5 },
    difficulty: 1,
  },
  {
    shape: 'Dsus2-shape',
    quality: 'sus2',
    rootPC: D,
    frets: [m, m, 0, 2, 3, 0],
    fingersOpen: [m, m, 0, 1, 2, 0],
    fingersBarred: [m, m, 1, 3, 4, 1],
    barre: { fromString: 2, toString: 5 },
    difficulty: 2,
  },

  // ─── SUS4 ────────────────────────────────────────────────────
  {
    shape: 'Asus4-shape',
    quality: 'sus4',
    rootPC: A,
    frets: [m, 0, 2, 2, 3, 0],
    fingersOpen: [m, 0, 1, 2, 3, 0],
    fingersBarred: [m, 1, 3, 3, 4, 1],
    barre: { fromString: 1, toString: 5 },
    difficulty: 2,
  },
  {
    shape: 'Dsus4-shape',
    quality: 'sus4',
    rootPC: D,
    frets: [m, m, 0, 2, 3, 3],
    fingersOpen: [m, m, 0, 1, 3, 4],
    fingersBarred: [m, m, 1, 3, 4, 4],
    barre: { fromString: 2, toString: 5 },
    difficulty: 2,
  },

  // ─── 7SUS4 ───────────────────────────────────────────────────
  {
    shape: 'A7sus4-shape',
    quality: '7sus4',
    rootPC: A,
    frets: [m, 0, 2, 0, 3, 0],
    fingersOpen: [m, 0, 2, 0, 3, 0],
    fingersBarred: [m, 1, 3, 1, 4, 1],
    barre: { fromString: 1, toString: 5 },
    difficulty: 2,
  },
  {
    shape: 'E7sus4-shape',
    quality: '7sus4',
    rootPC: E,
    frets: [0, 2, 0, 2, 0, 0],
    fingersOpen: [0, 2, 0, 3, 0, 0],
    fingersBarred: [1, 3, 1, 4, 1, 1],
    barre: { fromString: 0, toString: 5 },
    difficulty: 2,
  },

  // ─── ADD9 ────────────────────────────────────────────────────
  {
    shape: 'D-shape add9',
    quality: 'add9',
    rootPC: D,
    frets: [m, m, 0, 2, 3, 0],
    fingersOpen: [m, m, 0, 2, 3, 0],
    fingersBarred: [m, m, 1, 3, 4, 1],
    barre: { fromString: 2, toString: 5 },
    difficulty: 2,
  },
  {
    shape: 'A-shape add9',
    quality: 'add9',
    rootPC: A,
    frets: [m, 0, 2, 4, 2, 0],
    fingersOpen: [m, 0, 1, 3, 2, 0],
    fingersBarred: [m, 1, 2, 4, 3, 1],
    barre: { fromString: 1, toString: 1 },
    difficulty: 3,
  },

  // ─── 6 ───────────────────────────────────────────────────────
  {
    shape: 'A6-shape',
    quality: '6',
    rootPC: A,
    frets: [m, 0, 2, 2, 2, 2],
    fingersOpen: [m, 0, 1, 1, 1, 1],
    fingersBarred: [m, 1, 2, 2, 2, 2],
    barre: { fromString: 1, toString: 5 },
    difficulty: 2,
  },
  {
    shape: 'E6-shape',
    quality: '6',
    rootPC: E,
    frets: [0, 2, 2, 1, 2, 0],
    fingersOpen: [0, 2, 3, 1, 4, 0],
    fingersBarred: [1, 3, 4, 2, 4, 1],
    barre: { fromString: 0, toString: 5 },
    difficulty: 3,
  },

  // ─── MIN 6 ───────────────────────────────────────────────────
  {
    shape: 'Am6-shape',
    quality: 'm6',
    rootPC: A,
    frets: [m, 0, 2, 2, 1, 2],
    fingersOpen: [m, 0, 3, 4, 1, 2],
    fingersBarred: [m, 1, 3, 4, 2, 3],
    barre: { fromString: 1, toString: 1 },
    difficulty: 3,
  },

  // ─── 9 (dominant 9, sans la fonda parfois) ──────────────────
  {
    shape: 'E9-shape',
    quality: '9',
    rootPC: E,
    frets: [0, 2, 0, 1, 0, 2],
    fingersOpen: [0, 2, 0, 1, 0, 3],
    fingersBarred: [1, 3, 1, 2, 1, 4],
    barre: { fromString: 0, toString: 5 },
    difficulty: 3,
  },

  // ─── MAJ 9 ───────────────────────────────────────────────────
  {
    shape: 'Amaj9-shape',
    quality: 'maj9',
    rootPC: A,
    frets: [m, 0, 2, 1, 0, 0],
    fingersOpen: [m, 0, 3, 2, 0, 0],
    fingersBarred: [m, 1, 4, 3, 1, 1],
    barre: { fromString: 1, toString: 5 },
    difficulty: 3,
  },

  // ─── MIN 9 ───────────────────────────────────────────────────
  {
    shape: 'Am9-shape',
    quality: 'm9',
    rootPC: A,
    frets: [m, 0, 2, 0, 1, 0],
    fingersOpen: [m, 0, 2, 0, 1, 0],
    fingersBarred: [m, 1, 3, 1, 2, 1],
    barre: { fromString: 1, toString: 5 },
    difficulty: 3,
  },

  // ─── DIM ─────────────────────────────────────────────────────
  {
    shape: 'Adim-shape',
    quality: 'dim',
    rootPC: A,
    frets: [m, 0, 1, 2, 1, m],
    fingersOpen: [m, 0, 1, 3, 2, m],
    fingersBarred: [m, 1, 2, 4, 3, m],
    difficulty: 3,
  },

  // ─── AUG ─────────────────────────────────────────────────────
  {
    shape: 'Aaug-shape',
    quality: 'aug',
    rootPC: A,
    frets: [m, 0, 3, 2, 2, 1],
    fingersOpen: [m, 0, 4, 2, 3, 1],
    fingersBarred: [m, 1, 4, 3, 3, 2],
    difficulty: 3,
  },

  // ─── POWER (5) ───────────────────────────────────────────────
  {
    shape: 'E5-shape',
    quality: '5',
    rootPC: E,
    frets: [0, 2, 2, m, m, m],
    fingersOpen: [0, 1, 2, m, m, m],
    fingersBarred: [1, 3, 4, m, m, m],
    difficulty: 1,
  },
  {
    shape: 'A5-shape',
    quality: '5',
    rootPC: A,
    frets: [m, 0, 2, 2, m, m],
    fingersOpen: [m, 0, 1, 2, m, m],
    fingersBarred: [m, 1, 3, 4, m, m],
    difficulty: 1,
  },
  {
    shape: 'D5-shape',
    quality: '5',
    rootPC: D,
    frets: [m, m, 0, 2, 3, m],
    fingersOpen: [m, m, 0, 1, 3, m],
    fingersBarred: [m, m, 1, 3, 4, m],
    difficulty: 1,
  },
];

// ─── Suffixes pour reconstruire les noms ───────────────────────────────

export const QUALITY_SUFFIX: Record<string, string> = {
  maj: '',
  min: 'm',
  '7': '7',
  maj7: 'maj7',
  m7: 'm7',
  sus2: 'sus2',
  sus4: 'sus4',
  '7sus4': '7sus4',
  add9: 'add9',
  '6': '6',
  m6: 'm6',
  '9': '9',
  maj9: 'maj9',
  m9: 'm9',
  dim: 'dim',
  aug: 'aug',
  '5': '5',
};

export const QUALITY_LABELS: Record<string, string> = {
  maj: 'Major',
  min: 'Minor',
  '7': 'Dom 7',
  maj7: 'Maj 7',
  m7: 'Min 7',
  sus2: 'Sus 2',
  sus4: 'Sus 4',
  '7sus4': '7 Sus 4',
  add9: 'Add 9',
  '6': '6',
  m6: 'Min 6',
  '9': '9',
  maj9: 'Maj 9',
  m9: 'Min 9',
  dim: 'Dim',
  aug: 'Aug',
  '5': 'Power',
};

/** Ordre canonique des qualités pour les filtres UI */
export const QUALITY_ORDER: string[] = [
  'maj', 'min', '7', 'maj7', 'm7',
  'sus2', 'sus4', '7sus4', 'add9',
  '6', 'm6', '9', 'maj9', 'm9',
  'dim', 'aug', '5',
];

// ─── Générateur ────────────────────────────────────────────────────────

/**
 * Transpose un template d'un offset (en demi-tons). Retourne un Voicing.
 */
export function buildVoicing(t: ShapeTemplate, targetRootPC: number): Voicing {
  const offset = ((targetRootPC - t.rootPC) % 12 + 12) % 12;
  const isOpen = offset === 0;
  const newFrets = t.frets.map((f) => (f === null ? null : f + offset));
  const fingers = isOpen ? (t.fingersOpen ?? t.fingersBarred) : t.fingersBarred;

  const baseDifficulty = isOpen ? t.difficulty : Math.min(5, t.difficulty + 2);
  const positionPenalty = Math.max(0, Math.floor((offset - 7) / 3));

  return {
    frets: newFrets,
    fingers,
    barre:
      !isOpen && t.barre
        ? { fret: offset, fromString: t.barre.fromString, toString: t.barre.toString }
        : undefined,
    baseFret: !isOpen && offset > 0 ? offset : undefined,
    difficulty: Math.min(5, baseDifficulty + positionPenalty) as 1 | 2 | 3 | 4 | 5,
  };
}

/**
 * Tous les voicings disponibles pour (root, quality), triés par difficulté.
 */
export function getVoicingsForChord(rootPC: number, quality: string): Voicing[] {
  const applicable = TEMPLATES.filter((t) => t.quality === quality);
  return applicable
    .map((t) => buildVoicing(t, rootPC))
    .sort((a, b) => a.difficulty - b.difficulty);
}

/**
 * Compose un nom d'accord canonique (notation anglo-saxonne).
 */
export function chordName(root: NoteName, quality: string): string {
  return root + (QUALITY_SUFFIX[quality] ?? quality);
}

export { TEMPLATES };
