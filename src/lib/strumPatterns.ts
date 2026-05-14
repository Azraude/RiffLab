/**
 * Strum patterns library — patterns précodés inspirés des grands classiques
 * d'accompagnement guitare. Chaque pattern est une grille de subdivisions
 * (croches = 8 cellules par mesure, doubles-croches = 16 cellules).
 *
 * Chaque cellule porte un symbole :
 *   - 'D' : downstroke (↓)
 *   - 'U' : upstroke (↑)
 *   - 'X' : mute / chuck (palm mute ou chick)
 *   - '.' : rest (silence, on ne joue rien)
 *   - 'A' : downstroke accent (plus fort que D)
 *
 * Note technique : pour l'instant on map A→D et X→silence (on n'a pas de
 * synthé mute spécifique). Le visuel garde la distinction, l'audio joue
 * D ou U seulement. Les rests skippent simplement.
 */

export type StrumCell = 'D' | 'U' | 'X' | '.' | 'A';

export type StrumPattern = {
  id: string;
  name: string;
  description: string;
  /** Nombre de subdivisions par mesure (8 = croches, 16 = doubles-croches) */
  subdivisions: 8 | 16;
  /** Tableau de cellules. Longueur = subdivisions (1 mesure) ou 2× (2 mesures). */
  cells: StrumCell[];
  /** Tempo conseillé en BPM (à la noire). */
  suggestedBpm: number;
  /** Tags style musical. */
  tags: string[];
  /** Difficulté indicative 1-5. */
  difficulty: 1 | 2 | 3 | 4 | 5;
};

export const PRESET_PATTERNS: StrumPattern[] = [
  {
    id: 'basic-down',
    name: 'Basique tout en bas',
    description: 'Quatre downstrokes simples — la fondation. Idéal pour démarrer un nouveau morceau et chauffer.',
    subdivisions: 8,
    cells: ['D', '.', 'D', '.', 'D', '.', 'D', '.'],
    suggestedBpm: 80,
    tags: ['débutant', 'fondation'],
    difficulty: 1,
  },
  {
    id: 'folk-classique',
    name: 'Folk classique',
    description: 'Le pattern « DDUUDU » universel — tu l\'entends partout, des Beatles à Ed Sheeran. Apprends-le par cœur.',
    subdivisions: 8,
    cells: ['D', '.', 'D', 'U', 'U', 'D', '.', 'U'],
    suggestedBpm: 95,
    tags: ['folk', 'pop', 'incontournable'],
    difficulty: 2,
  },
  {
    id: 'down-up-steady',
    name: 'Croches Down/Up',
    description: 'Alternance D/U sur toutes les croches. Métronome guitaristique, parfait pour travailler la régularité.',
    subdivisions: 8,
    cells: ['D', 'U', 'D', 'U', 'D', 'U', 'D', 'U'],
    suggestedBpm: 100,
    tags: ['exercice', 'régularité'],
    difficulty: 2,
  },
  {
    id: 'ballad-slow',
    name: 'Ballad lente',
    description: 'Deux downstrokes longs puis un down-up-down à la fin. Respire — laisse sonner les accords.',
    subdivisions: 8,
    cells: ['D', '.', '.', '.', 'D', '.', 'D', 'U'],
    suggestedBpm: 70,
    tags: ['ballad', 'lent', 'romantique'],
    difficulty: 2,
  },
  {
    id: 'reggae-skank',
    name: 'Reggae skank',
    description: 'Le skank classique — upstrokes sèches sur les 2 et 4. Coupe court, ça doit chick.',
    subdivisions: 8,
    cells: ['.', '.', 'U', '.', '.', '.', 'U', '.'],
    suggestedBpm: 75,
    tags: ['reggae', 'ska', 'offbeat'],
    difficulty: 3,
  },
  {
    id: 'rock-driving',
    name: 'Rock driving',
    description: 'Accents puissants et upstrokes serrés. Idéal pour les power chords. Bouge les épaules, pas le poignet.',
    subdivisions: 8,
    cells: ['A', 'U', 'D', 'U', 'A', 'U', 'D', 'U'],
    suggestedBpm: 120,
    tags: ['rock', 'punk', 'énergique'],
    difficulty: 3,
  },
  {
    id: 'funk-16',
    name: 'Funk 16e',
    description: 'Doubles-croches avec mutes. La main droite ne s\'arrête jamais — les mutes font le groove.',
    subdivisions: 16,
    cells: ['D', 'X', 'U', 'X', 'D', 'X', 'U', 'D', 'X', 'U', 'X', 'D', 'X', 'U', 'X', 'D'],
    suggestedBpm: 95,
    tags: ['funk', 'groove', 'avancé'],
    difficulty: 5,
  },
  {
    id: 'bossa-nova',
    name: 'Bossa nova',
    description: 'Pattern syncopé léger. Doigts plutôt que médiator. Pour les soirées Stan Getz / João Gilberto.',
    subdivisions: 16,
    cells: ['D', '.', '.', 'D', '.', '.', 'D', '.', '.', 'D', '.', '.', 'D', '.', 'D', '.'],
    suggestedBpm: 110,
    tags: ['bossa', 'latin', 'jazz'],
    difficulty: 4,
  },
  {
    id: 'country-boom-chick',
    name: 'Country boom-chick',
    description: 'Boom (D grave) — chick (U muté). La signature country. Travaille la précision du bras droit.',
    subdivisions: 8,
    cells: ['D', '.', 'U', '.', 'D', '.', 'U', '.'],
    suggestedBpm: 110,
    tags: ['country', 'folk'],
    difficulty: 2,
  },
  {
    id: 'flamenco-rasgueado',
    name: 'Flamenco rasgueado',
    description: 'Trois upstrokes rapides puis un down accentué. Le geste vient des doigts, pas du poignet.',
    subdivisions: 16,
    cells: ['U', 'U', 'U', 'A', '.', '.', 'D', 'U', 'U', 'U', 'U', 'A', '.', '.', 'D', 'U'],
    suggestedBpm: 130,
    tags: ['flamenco', 'classique', 'expert'],
    difficulty: 5,
  },
  {
    id: 'pop-modern',
    name: 'Pop moderne',
    description: 'Pattern doux pour balades modernes (Coldplay, Birdy, etc.). Laisse vibrer les accords.',
    subdivisions: 8,
    cells: ['D', '.', 'D', 'U', '.', 'U', 'D', 'U'],
    suggestedBpm: 90,
    tags: ['pop', 'indie', 'doux'],
    difficulty: 2,
  },
  {
    id: 'shuffle-blues',
    name: 'Shuffle blues',
    description: 'Sensation ternaire (triolet) approximée en doubles-croches. Joue avec du swing, pas raide.',
    subdivisions: 16,
    cells: ['D', '.', 'U', 'D', '.', 'U', 'D', '.', 'U', 'D', '.', 'U', 'D', '.', 'U', 'D'],
    suggestedBpm: 85,
    tags: ['blues', 'shuffle', 'swing'],
    difficulty: 4,
  },
];

export const ALL_TAGS = Array.from(
  new Set(PRESET_PATTERNS.flatMap((p) => p.tags))
).sort();

export function getPattern(id: string): StrumPattern | undefined {
  return PRESET_PATTERNS.find((p) => p.id === id);
}

/** Crée un pattern vide à éditer dans le composer. */
export function emptyPattern(subdivisions: 8 | 16 = 8): StrumPattern {
  return {
    id: 'custom-' + Date.now(),
    name: 'Mon pattern',
    description: '',
    subdivisions,
    cells: Array<StrumCell>(subdivisions).fill('.'),
    suggestedBpm: 100,
    tags: ['custom'],
    difficulty: 2,
  };
}

/** Cycle entre les valeurs de cellule au clic. */
export function cycleCell(c: StrumCell): StrumCell {
  switch (c) {
    case '.':
      return 'D';
    case 'D':
      return 'U';
    case 'U':
      return 'X';
    case 'X':
      return 'A';
    case 'A':
      return '.';
  }
}

/** Affichage textuel d'une cellule. */
export function cellSymbol(c: StrumCell): string {
  switch (c) {
    case 'D':
      return '↓';
    case 'U':
      return '↑';
    case 'X':
      return '×';
    case 'A':
      return '⤓';
    case '.':
      return '·';
  }
}
