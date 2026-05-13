/**
 * Base de données d'accords avec leurs voicings (positions sur le manche).
 * Standard tuning (EADGBE).
 *
 * frets: [low E, A, D, G, B, high E]
 *   -1 = corde mutée (X)
 *    0 = corde à vide (O)
 *   n  = frette n
 *
 * fingers (optionnel) : doigt utilisé (1=index, 2=majeur, 3=annulaire, 4=auriculaire, 0=open)
 * barre (optionnel) : { fret, fromString, toString }
 *   fromString/toString sont les index de cordes (0 = low E)
 * baseFret : si l'accord est joué plus haut sur le manche (ex: barré F#m en 2e position),
 *           on affiche depuis cette frette pour ne pas dessiner 20 frettes.
 */

export type Voicing = {
  frets: (number | null)[];   // length 6, null = mute
  fingers?: (number | null)[];
  barre?: { fret: number; fromString: number; toString: number };
  baseFret?: number;          // frette de départ du diagramme (default = min des frets jouées)
  difficulty: 1 | 2 | 3 | 4 | 5;
};

export type Chord = {
  name: string;
  root: string;
  quality: string;
  voicings: Voicing[];
  category: 'open' | 'barre' | 'extended' | 'power' | 'jazz';
};

// Helper : convert frets array null to number (-1 = mute) for compactness internally
const m = null; // mute
const o = 0;    // open

export const CHORDS: Chord[] = [
  // ─── OPEN MAJOR ─────────────────────────────────────────────
  { name: 'C', root: 'C', quality: 'maj', category: 'open',
    voicings: [{ frets: [m, 3, 2, 0, 1, 0], fingers: [null, 3, 2, 0, 1, 0], difficulty: 1 }] },
  { name: 'D', root: 'D', quality: 'maj', category: 'open',
    voicings: [{ frets: [m, m, 0, 2, 3, 2], fingers: [null, null, 0, 1, 3, 2], difficulty: 1 }] },
  { name: 'E', root: 'E', quality: 'maj', category: 'open',
    voicings: [{ frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], difficulty: 1 }] },
  { name: 'G', root: 'G', quality: 'maj', category: 'open',
    voicings: [{ frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], difficulty: 1 }] },
  { name: 'A', root: 'A', quality: 'maj', category: 'open',
    voicings: [{ frets: [m, 0, 2, 2, 2, 0], fingers: [null, 0, 1, 2, 3, 0], difficulty: 1 }] },

  // ─── OPEN MINOR ─────────────────────────────────────────────
  { name: 'Am', root: 'A', quality: 'min', category: 'open',
    voicings: [{ frets: [m, 0, 2, 2, 1, 0], fingers: [null, 0, 2, 3, 1, 0], difficulty: 1 }] },
  { name: 'Dm', root: 'D', quality: 'min', category: 'open',
    voicings: [{ frets: [m, m, 0, 2, 3, 1], fingers: [null, null, 0, 2, 3, 1], difficulty: 1 }] },
  { name: 'Em', root: 'E', quality: 'min', category: 'open',
    voicings: [{ frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], difficulty: 1 }] },

  // ─── DOMINANT 7 (open) ──────────────────────────────────────
  { name: 'C7', root: 'C', quality: '7', category: 'open',
    voicings: [{ frets: [m, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, 0], difficulty: 2 }] },
  { name: 'D7', root: 'D', quality: '7', category: 'open',
    voicings: [{ frets: [m, m, 0, 2, 1, 2], fingers: [null, null, 0, 2, 1, 3], difficulty: 2 }] },
  { name: 'E7', root: 'E', quality: '7', category: 'open',
    voicings: [{ frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], difficulty: 1 }] },
  { name: 'G7', root: 'G', quality: '7', category: 'open',
    voicings: [{ frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], difficulty: 1 }] },
  { name: 'A7', root: 'A', quality: '7', category: 'open',
    voicings: [{ frets: [m, 0, 2, 0, 2, 0], fingers: [null, 0, 2, 0, 3, 0], difficulty: 1 }] },
  { name: 'B7', root: 'B', quality: '7', category: 'open',
    voicings: [{ frets: [m, 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, 0, 4], difficulty: 2 }] },

  // ─── MINOR 7 (open) ─────────────────────────────────────────
  { name: 'Am7', root: 'A', quality: 'm7', category: 'open',
    voicings: [{ frets: [m, 0, 2, 0, 1, 0], fingers: [null, 0, 2, 0, 1, 0], difficulty: 1 }] },
  { name: 'Dm7', root: 'D', quality: 'm7', category: 'open',
    voicings: [{ frets: [m, m, 0, 2, 1, 1], fingers: [null, null, 0, 2, 1, 1], difficulty: 2 }] },
  { name: 'Em7', root: 'E', quality: 'm7', category: 'open',
    voicings: [{ frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], difficulty: 1 }] },

  // ─── MAJ 7 (open) ───────────────────────────────────────────
  { name: 'Cmaj7', root: 'C', quality: 'maj7', category: 'open',
    voicings: [{ frets: [m, 3, 2, 0, 0, 0], fingers: [null, 3, 2, 0, 0, 0], difficulty: 1 }] },
  { name: 'Dmaj7', root: 'D', quality: 'maj7', category: 'open',
    voicings: [{ frets: [m, m, 0, 2, 2, 2], fingers: [null, null, 0, 1, 1, 1], difficulty: 2 }] },
  { name: 'Fmaj7', root: 'F', quality: 'maj7', category: 'open',
    voicings: [{ frets: [m, m, 3, 2, 1, 0], fingers: [null, null, 3, 2, 1, 0], difficulty: 2 }] },
  { name: 'Gmaj7', root: 'G', quality: 'maj7', category: 'open',
    voicings: [{ frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1], difficulty: 2 }] },
  { name: 'Amaj7', root: 'A', quality: 'maj7', category: 'open',
    voicings: [{ frets: [m, 0, 2, 1, 2, 0], fingers: [null, 0, 2, 1, 3, 0], difficulty: 2 }] },

  // ─── SUS (open) ─────────────────────────────────────────────
  { name: 'Dsus2', root: 'D', quality: 'sus2', category: 'open',
    voicings: [{ frets: [m, m, 0, 2, 3, 0], fingers: [null, null, 0, 1, 2, 0], difficulty: 1 }] },
  { name: 'Dsus4', root: 'D', quality: 'sus4', category: 'open',
    voicings: [{ frets: [m, m, 0, 2, 3, 3], fingers: [null, null, 0, 1, 2, 3], difficulty: 1 }] },
  { name: 'Asus2', root: 'A', quality: 'sus2', category: 'open',
    voicings: [{ frets: [m, 0, 2, 2, 0, 0], fingers: [null, 0, 1, 2, 0, 0], difficulty: 1 }] },
  { name: 'Asus4', root: 'A', quality: 'sus4', category: 'open',
    voicings: [{ frets: [m, 0, 2, 2, 3, 0], fingers: [null, 0, 1, 2, 3, 0], difficulty: 1 }] },
  { name: 'A7sus4', root: 'A', quality: '7sus4', category: 'open',
    voicings: [{ frets: [m, 0, 2, 0, 3, 0], fingers: [null, 0, 2, 0, 3, 0], difficulty: 2 }] },

  // ─── ADD9 ───────────────────────────────────────────────────
  { name: 'Cadd9', root: 'C', quality: 'add9', category: 'extended',
    voicings: [{ frets: [m, 3, 2, 0, 3, 0], fingers: [null, 2, 1, 0, 3, 0], difficulty: 2 }] },

  // ─── BARRÉS ─────────────────────────────────────────────────
  { name: 'F', root: 'F', quality: 'maj', category: 'barre',
    voicings: [{
      frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1],
      barre: { fret: 1, fromString: 0, toString: 5 }, baseFret: 1, difficulty: 3,
    }] },
  { name: 'Bm', root: 'B', quality: 'min', category: 'barre',
    voicings: [{
      frets: [m, 2, 4, 4, 3, 2], fingers: [null, 1, 3, 4, 2, 1],
      barre: { fret: 2, fromString: 1, toString: 5 }, baseFret: 2, difficulty: 3,
    }] },
  { name: 'B', root: 'B', quality: 'maj', category: 'barre',
    voicings: [{
      frets: [m, 2, 4, 4, 4, 2], fingers: [null, 1, 2, 3, 4, 1],
      barre: { fret: 2, fromString: 1, toString: 5 }, baseFret: 2, difficulty: 3,
    }] },
  { name: 'F#m', root: 'F#', quality: 'min', category: 'barre',
    voicings: [{
      frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1],
      barre: { fret: 2, fromString: 0, toString: 5 }, baseFret: 2, difficulty: 3,
    }] },
  { name: 'F#m7', root: 'F#', quality: 'm7', category: 'barre',
    voicings: [{
      frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1],
      barre: { fret: 2, fromString: 0, toString: 5 }, baseFret: 2, difficulty: 3,
    }] },
  { name: 'C#m', root: 'C#', quality: 'min', category: 'barre',
    voicings: [{
      frets: [m, 4, 6, 6, 5, 4], fingers: [null, 1, 3, 4, 2, 1],
      barre: { fret: 4, fromString: 1, toString: 5 }, baseFret: 4, difficulty: 3,
    }] },
  { name: 'Cm', root: 'C', quality: 'min', category: 'barre',
    voicings: [{
      frets: [m, 3, 5, 5, 4, 3], fingers: [null, 1, 3, 4, 2, 1],
      barre: { fret: 3, fromString: 1, toString: 5 }, baseFret: 3, difficulty: 3,
    }] },
  { name: 'Gm', root: 'G', quality: 'min', category: 'barre',
    voicings: [{
      frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1],
      barre: { fret: 3, fromString: 0, toString: 5 }, baseFret: 3, difficulty: 3,
    }] },
  { name: 'B♭', root: 'A#', quality: 'maj', category: 'barre',
    voicings: [{
      frets: [m, 1, 3, 3, 3, 1], fingers: [null, 1, 2, 3, 4, 1],
      barre: { fret: 1, fromString: 1, toString: 5 }, baseFret: 1, difficulty: 3,
    }] },

  // ─── POWER CHORDS ──────────────────────────────────────────
  { name: 'E5', root: 'E', quality: 'power', category: 'power',
    voicings: [{ frets: [0, 2, 2, m, m, m], fingers: [0, 1, 2, null, null, null], difficulty: 1 }] },
  { name: 'A5', root: 'A', quality: 'power', category: 'power',
    voicings: [{ frets: [m, 0, 2, 2, m, m], fingers: [null, 0, 1, 2, null, null], difficulty: 1 }] },
  { name: 'D5', root: 'D', quality: 'power', category: 'power',
    voicings: [{ frets: [m, m, 0, 2, 3, m], fingers: [null, null, 0, 1, 2, null], difficulty: 1 }] },
  { name: 'G5', root: 'G', quality: 'power', category: 'power',
    voicings: [{ frets: [3, 5, 5, m, m, m], fingers: [1, 3, 4, null, null, null], difficulty: 1 }] },
];

/**
 * Récupère un accord par son nom.
 */
export function getChord(name: string): Chord | undefined {
  return CHORDS.find((c) => c.name === name);
}

/**
 * Cherche un voicing pour un nom d'accord, retourne null si rien trouvé.
 */
export function getDefaultVoicing(name: string): Voicing | null {
  const chord = getChord(name);
  return chord?.voicings[0] ?? null;
}

/**
 * Tous les accords par catégorie.
 */
export function chordsByCategory(category: Chord['category']): Chord[] {
  return CHORDS.filter((c) => c.category === category);
}
