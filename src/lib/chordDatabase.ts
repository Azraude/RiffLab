/**
 * Catalogue d'accords RiffLab.
 *
 * Format frettes : `[low E, A, D, G, B, high E]`
 *   - null = corde mutée (X)
 *   - 0    = corde à vide (O)
 *   - n    = frette n
 *
 * Le catalogue est généré par croisement (12 roots × N qualités) via
 * `chordShapes.ts`. Les voicings ouverts canoniques (formes CAGED naturelles :
 * C, A, G, E, D, Am, Em, Dm, A7, B7, C7, D7, E7, G7, Am7, Em7, Dm7, Cmaj7,
 * Amaj7, Fmaj7, Gmaj7, Dmaj7, Asus2, Asus4, Dsus2, Dsus4, A7sus4, Cadd9, etc.)
 * sont préservés en tant que voicing PREFERRED (premier dans la liste).
 *
 * Pour chaque accord, `voicings[]` peut contenir plusieurs entrées (différentes
 * positions sur le manche). La page Chords laisse l'utilisateur les parcourir.
 */

import { NOTE_NAMES, type NoteName } from './theory';
import {
  QUALITY_ORDER,
  QUALITY_SUFFIX,
  buildVoicing,
  TEMPLATES,
  chordName,
} from './chordShapes';

// ─── Types ─────────────────────────────────────────────────────────────

export type Voicing = {
  frets: (number | null)[];
  fingers?: (number | null)[];
  barre?: { fret: number; fromString: number; toString: number };
  baseFret?: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
};

export type Chord = {
  name: string;
  root: NoteName;
  quality: string;
  voicings: Voicing[];
  /** Conservé pour compatibilité ancienne UI. `open` si une forme ouverte
   *  canonique existe pour cet accord, `barre` sinon. */
  category?: 'open' | 'barre' | 'extended' | 'power' | 'jazz';
};

const m = null;

// ─── Voicings ouverts canoniques (fingerings de référence) ────────────

const PREFERRED_OPEN_VOICINGS: Record<string, Voicing> = {
  // Majeur ouverts (CAGED)
  C: { frets: [m, 3, 2, 0, 1, 0], fingers: [null, 3, 2, 0, 1, 0], difficulty: 1 },
  D: { frets: [m, m, 0, 2, 3, 2], fingers: [null, null, 0, 1, 3, 2], difficulty: 1 },
  E: { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], difficulty: 1 },
  G: { frets: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], difficulty: 1 },
  A: { frets: [m, 0, 2, 2, 2, 0], fingers: [null, 0, 1, 2, 3, 0], difficulty: 1 },

  // Mineur ouverts
  Am: { frets: [m, 0, 2, 2, 1, 0], fingers: [null, 0, 2, 3, 1, 0], difficulty: 1 },
  Dm: { frets: [m, m, 0, 2, 3, 1], fingers: [null, null, 0, 2, 3, 1], difficulty: 1 },
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], difficulty: 1 },

  // Dominant 7 ouverts
  A7: { frets: [m, 0, 2, 0, 2, 0], fingers: [null, 0, 2, 0, 3, 0], difficulty: 1 },
  B7: { frets: [m, 2, 1, 2, 0, 2], fingers: [null, 2, 1, 3, 0, 4], difficulty: 2 },
  C7: { frets: [m, 3, 2, 3, 1, 0], fingers: [null, 3, 2, 4, 1, 0], difficulty: 2 },
  D7: { frets: [m, m, 0, 2, 1, 2], fingers: [null, null, 0, 2, 1, 3], difficulty: 2 },
  E7: { frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], difficulty: 1 },
  G7: { frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], difficulty: 1 },

  // Minor 7 ouverts
  Am7: { frets: [m, 0, 2, 0, 1, 0], fingers: [null, 0, 2, 0, 1, 0], difficulty: 1 },
  Dm7: { frets: [m, m, 0, 2, 1, 1], fingers: [null, null, 0, 2, 1, 1], difficulty: 2 },
  Em7: { frets: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], difficulty: 1 },

  // Major 7 ouverts
  Cmaj7: { frets: [m, 3, 2, 0, 0, 0], fingers: [null, 3, 2, 0, 0, 0], difficulty: 1 },
  Dmaj7: { frets: [m, m, 0, 2, 2, 2], fingers: [null, null, 0, 1, 1, 1], difficulty: 2 },
  Fmaj7: { frets: [m, m, 3, 2, 1, 0], fingers: [null, null, 3, 2, 1, 0], difficulty: 2 },
  Gmaj7: { frets: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1], difficulty: 2 },
  Amaj7: { frets: [m, 0, 2, 1, 2, 0], fingers: [null, 0, 2, 1, 3, 0], difficulty: 2 },
  Emaj7: { frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0], difficulty: 2 },

  // Sus ouverts
  Dsus2: { frets: [m, m, 0, 2, 3, 0], fingers: [null, null, 0, 1, 2, 0], difficulty: 1 },
  Dsus4: { frets: [m, m, 0, 2, 3, 3], fingers: [null, null, 0, 1, 2, 3], difficulty: 1 },
  Asus2: { frets: [m, 0, 2, 2, 0, 0], fingers: [null, 0, 1, 2, 0, 0], difficulty: 1 },
  Asus4: { frets: [m, 0, 2, 2, 3, 0], fingers: [null, 0, 1, 2, 3, 0], difficulty: 1 },
  Esus4: { frets: [0, 2, 2, 2, 0, 0], fingers: [0, 1, 2, 3, 0, 0], difficulty: 1 },

  // 7sus4 ouverts
  A7sus4: { frets: [m, 0, 2, 0, 3, 0], fingers: [null, 0, 2, 0, 3, 0], difficulty: 2 },
  D7sus4: { frets: [m, m, 0, 2, 1, 3], fingers: [null, null, 0, 2, 1, 3], difficulty: 2 },
  E7sus4: { frets: [0, 2, 0, 2, 0, 0], fingers: [0, 2, 0, 3, 0, 0], difficulty: 2 },

  // Add9 ouverts
  Cadd9: { frets: [m, 3, 2, 0, 3, 0], fingers: [null, 2, 1, 0, 3, 0], difficulty: 2 },
  Dadd9: { frets: [m, m, 0, 2, 3, 0], fingers: [null, null, 0, 1, 2, 0], difficulty: 1 },
  Eadd9: { frets: [0, 2, 4, 1, 0, 0], fingers: [0, 1, 4, 2, 0, 0], difficulty: 2 },

  // Power chords classiques
  E5: { frets: [0, 2, 2, m, m, m], fingers: [0, 1, 2, null, null, null], difficulty: 1 },
  A5: { frets: [m, 0, 2, 2, m, m], fingers: [null, 0, 1, 2, null, null], difficulty: 1 },
  D5: { frets: [m, m, 0, 2, 3, m], fingers: [null, null, 0, 1, 2, null], difficulty: 1 },
  G5: { frets: [3, 5, 5, m, m, m], fingers: [1, 3, 4, null, null, null], difficulty: 1 },
};

// ─── Génération du catalogue complet ──────────────────────────────────

function voicingKey(v: Voicing): string {
  return v.frets.map((f) => (f === null ? 'x' : f)).join(',');
}

function generateChords(): Chord[] {
  const out: Chord[] = [];
  for (const root of NOTE_NAMES) {
    const rootPC = NOTE_NAMES.indexOf(root);
    for (const quality of QUALITY_ORDER) {
      const name = root + (QUALITY_SUFFIX[quality] ?? quality);
      const voicings: Voicing[] = [];
      const seen = new Set<string>();

      // 1) Voicing ouvert canonique (si on en a un hand-codé pour ce nom)
      const preferred = PREFERRED_OPEN_VOICINGS[name];
      if (preferred) {
        voicings.push(preferred);
        seen.add(voicingKey(preferred));
      }

      // 2) Voicings générés depuis les templates de cette qualité
      const templates = TEMPLATES.filter((t) => t.quality === quality);
      for (const t of templates) {
        const v = buildVoicing(t, rootPC);
        const k = voicingKey(v);
        if (seen.has(k)) continue;
        seen.add(k);
        voicings.push(v);
      }

      // 3) Tri final : par difficulté croissante
      voicings.sort((a, b) => a.difficulty - b.difficulty);

      out.push({
        name,
        root,
        quality,
        voicings,
        category: preferred ? 'open' : voicings.length > 0 ? 'barre' : undefined,
      });
    }
  }
  return out;
}

export const CHORDS: Chord[] = generateChords();

// ─── Helpers ───────────────────────────────────────────────────────────

export function getChord(name: string): Chord | undefined {
  return CHORDS.find((c) => c.name === name);
}

export function getDefaultVoicing(name: string): Voicing | null {
  const chord = getChord(name);
  return chord?.voicings[0] ?? null;
}

/**
 * Curated list of the most-used chord names — pour les palettes rapides
 * (SongNew "+ ajouter un accord"). Ordre = familles intuitives.
 */
export const COMMON_CHORD_NAMES: string[] = [
  'C', 'G', 'D', 'A', 'E', 'F',
  'Am', 'Em', 'Dm', 'F#m', 'Bm', 'C#m',
  'C7', 'G7', 'D7', 'A7', 'E7', 'B7',
  'Cmaj7', 'Gmaj7', 'Dmaj7', 'Amaj7', 'Fmaj7', 'Emaj7',
  'Am7', 'Em7', 'Dm7', 'F#m7',
  'Asus2', 'Dsus2', 'Asus4', 'Dsus4', 'Esus4',
  'A7sus4', 'Cadd9', 'Dadd9',
];

// ─── Re-exports ────────────────────────────────────────────────────────

export { chordName, QUALITY_LABELS, QUALITY_ORDER } from './chordShapes';
