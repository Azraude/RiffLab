/**
 * Bibliothèque de progressions d'accords.
 *
 * Les progressions sont stockées en degrés (chiffres romains) avec une
 * tonalité de référence ('C' major par défaut, sauf si la progression est
 * intrinsèquement mineure auquel cas 'Am'). Le système de transposition
 * recompute les noms d'accords pour n'importe quelle tonalité.
 *
 * Notation des degrés (sur Cmaj) :
 *   I   = C       (1)
 *   ii  = Dm      (2 minor)
 *   iii = Em      (3 minor)
 *   IV  = F       (4)
 *   V   = G       (5)
 *   vi  = Am      (6 minor)
 *   vii°= B dim   (7 diminué)
 * Sur Am (relative minor) on inverse :
 *   i   = Am      (1 minor)
 *   ii° = B dim
 *   III = C       (relative major)
 *   iv  = Dm
 *   v   = Em (ou V = E pour V dominant en harmonique)
 *   VI  = F
 *   VII = G
 */

import { NOTE_NAMES, type NoteName } from './theory';

export type Mood = 'chill' | 'epic' | 'jazzy' | 'sad' | 'latin' | 'cinematic' | 'rock' | 'pop';
export type ProgressionKey = 'major' | 'minor';
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export type ProgressionChord = {
  /** Nom de l'accord déjà transposé dans la tonalité de référence */
  name: string;
  /** Durée en temps (4 par défaut = 1 mesure 4/4) */
  beats: number;
};

export type Progression = {
  id: string;
  /** Titre humain (ex: "Pop universelle", "Andalousian", "Canon de Pachelbel") */
  name: string;
  /** Notation degrés Nashville-style (ex: "I-V-vi-IV") */
  degrees: string;
  description: string;
  /** Reference key des chords[] : 'C' pour major, 'A' pour minor */
  refRoot: NoteName;
  refKey: ProgressionKey;
  chords: ProgressionChord[];
  moods: Mood[];
  difficulty: Difficulty;
  /** Exemples célèbres (libellé pour culture musicale) */
  examples?: string;
};

// Helpers transposition
const NOTE_INDEX: Record<string, number> = Object.fromEntries(
  NOTE_NAMES.map((n, i) => [n, i] as const)
);
const FLAT_TO_SHARP: Record<string, NoteName> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
};

function splitChordName(name: string): { root: NoteName; suffix: string } | null {
  const m = name.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return null;
  let root = m[1];
  if (FLAT_TO_SHARP[root]) root = FLAT_TO_SHARP[root];
  if (!(root in NOTE_INDEX)) return null;
  return { root: root as NoteName, suffix: m[2] };
}

/**
 * Transpose une progression en partant de sa refRoot vers une nouvelle tonique.
 * Retourne une nouvelle liste de ProgressionChord.
 */
export function transposeProgression(
  prog: Progression,
  targetRoot: NoteName
): ProgressionChord[] {
  const refIdx = NOTE_INDEX[prog.refRoot];
  const targetIdx = NOTE_INDEX[targetRoot];
  const semitones = ((targetIdx - refIdx) % 12 + 12) % 12;
  if (semitones === 0) return prog.chords;
  return prog.chords.map((c) => {
    const split = splitChordName(c.name);
    if (!split) return c;
    const newIdx = (NOTE_INDEX[split.root] + semitones) % 12;
    return { name: NOTE_NAMES[newIdx] + split.suffix, beats: c.beats };
  });
}

// ─── Le catalogue ─────────────────────────────────────────────────────

const FOUR_BEATS: ProgressionChord[] = [];

function p(name: string, beats = 4): ProgressionChord {
  return { name, beats };
}

export const PROGRESSIONS: Progression[] = [
  // ─── POP / UNIVERSELLES (Major) ─────────────────────────────
  {
    id: 'i-v-vi-iv',
    name: 'Pop universelle',
    degrees: 'I–V–vi–IV',
    description: 'La progression la plus jouée au monde. Lumineuse, rassurante.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('C'), p('G'), p('Am'), p('F')],
    moods: ['pop', 'chill'],
    difficulty: 1,
    examples: 'Let It Be · Don\'t Stop Believin\' · No Woman No Cry',
  },
  {
    id: 'vi-iv-i-v',
    name: 'Pop emo (axe pop alterné)',
    degrees: 'vi–IV–I–V',
    description: 'Variante mélancolique de la pop universelle. Commence sur la relative mineure.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('Am'), p('F'), p('C'), p('G')],
    moods: ['pop', 'sad'],
    difficulty: 1,
    examples: 'Numb (Linkin Park) · Africa (Toto) · Someone Like You (Adele)',
  },
  {
    id: 'i-vi-iv-v',
    name: '50s doo-wop',
    degrees: 'I–vi–IV–V',
    description: 'Le standard ballade des fifties. Doux, romantique.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('C'), p('Am'), p('F'), p('G')],
    moods: ['pop', 'chill'],
    difficulty: 1,
    examples: 'Stand By Me · Every Breath You Take · Earth Angel',
  },
  {
    id: 'i-iv-v-i',
    name: 'I–IV–V (blues/rock basique)',
    degrees: 'I–IV–V',
    description: 'La fondation harmonique du rock et du blues. Tonique → sous-dominante → dominante.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('C'), p('F'), p('G'), p('C')],
    moods: ['rock', 'pop'],
    difficulty: 1,
    examples: 'Twist and Shout · La Bamba · Wild Thing',
  },
  {
    id: 'i-iii-iv-v',
    name: 'Doo-wop majeur',
    degrees: 'I–iii–IV–V',
    description: 'Variante du doo-wop avec iii à la place de vi. Plus aérienne.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('C'), p('Em'), p('F'), p('G')],
    moods: ['pop', 'chill'],
    difficulty: 2,
  },

  // ─── ROCK ─────────────────────────────────────────────────────
  {
    id: 'i-bvii-iv',
    name: 'Rock mixolydien',
    degrees: 'I–♭VII–IV',
    description: 'La fameuse cadence mixolydienne. Caractère rock-roots.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('C'), p('A#'), p('F')],
    moods: ['rock'],
    difficulty: 2,
    examples: 'Sweet Home Alabama · Sympathy for the Devil',
  },
  {
    id: 'i-bvii-bvi-bvii',
    name: 'Power minor (rock épique)',
    degrees: 'i–♭VII–♭VI–♭VII',
    description: 'Cadence mineure rock-épique. Tension et résolution.',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Am'), p('G'), p('F'), p('G')],
    moods: ['rock', 'epic'],
    difficulty: 2,
    examples: 'Stairway to Heaven · All Along the Watchtower',
  },
  {
    id: 'i-v-vi-iii',
    name: 'Canon de Pachelbel',
    degrees: 'I–V–vi–iii–IV–I–IV–V',
    description: 'La progression baroque la plus exploitée du XXe siècle.',
    refRoot: 'D',
    refKey: 'major',
    chords: [p('D'), p('A'), p('Bm'), p('F#m'), p('G'), p('D'), p('G'), p('A')],
    moods: ['cinematic', 'epic', 'pop'],
    difficulty: 2,
    examples: 'Canon in D (Pachelbel) · Basket Case (Green Day) · Cryin\' (Aerosmith)',
  },

  // ─── BLUES ────────────────────────────────────────────────────
  {
    id: '12-bar-blues',
    name: '12-bar blues',
    degrees: 'I⁷×4 · IV⁷×2 · I⁷×2 · V⁷ · IV⁷ · I⁷ · V⁷',
    description: 'La forme blues canonique. 12 mesures, dominantes 7 partout.',
    refRoot: 'E',
    refKey: 'major',
    chords: [
      p('E7'), p('E7'), p('E7'), p('E7'),
      p('A7'), p('A7'), p('E7'), p('E7'),
      p('B7'), p('A7'), p('E7'), p('B7'),
    ],
    moods: ['rock'],
    difficulty: 2,
    examples: 'Sweet Home Chicago · Pride and Joy · 90% du répertoire blues',
  },
  {
    id: 'quick-change-blues',
    name: 'Quick-change blues',
    degrees: 'I⁷–IV⁷–I⁷–I⁷ ...',
    description: 'Variante du 12-bar avec un IV7 en mesure 2 pour casser la monotonie.',
    refRoot: 'A',
    refKey: 'major',
    chords: [
      p('A7'), p('D7'), p('A7'), p('A7'),
      p('D7'), p('D7'), p('A7'), p('A7'),
      p('E7'), p('D7'), p('A7'), p('E7'),
    ],
    moods: ['rock'],
    difficulty: 2,
  },

  // ─── MINEUR / SAD ─────────────────────────────────────────────
  {
    id: 'andalousian',
    name: 'Andalousian (descending)',
    degrees: 'i–♭VII–♭VI–V',
    description: 'Cadence flamenco/espagnole. Sombre et expressive.',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Am'), p('G'), p('F'), p('E')],
    moods: ['latin', 'sad', 'cinematic'],
    difficulty: 2,
    examples: 'Hit the Road Jack · One Way or Another · Hijo de la Luna',
  },
  {
    id: 'i-bvi-bvii',
    name: 'Mineur épique',
    degrees: 'i–♭VI–♭VII',
    description: 'Triade mineure puissante. Marche héroïque.',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Am'), p('F'), p('G')],
    moods: ['epic', 'cinematic', 'rock'],
    difficulty: 1,
    examples: 'Heroes (Bowie) · Walking in Memphis',
  },
  {
    id: 'i-bvii-bvi-v',
    name: 'Cadence frigienne',
    degrees: 'i–♭VII–♭VI–V',
    description: 'Tension dramatique avec dominante majeure en final.',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Am'), p('G'), p('F'), p('E7')],
    moods: ['cinematic', 'sad', 'epic'],
    difficulty: 3,
  },
  {
    id: 'i-iv-v-mineur',
    name: 'i–iv–v mineur naturel',
    degrees: 'i–iv–v',
    description: 'Trois accords mineurs : ambiance sombre, modale.',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Am'), p('Dm'), p('Em')],
    moods: ['sad'],
    difficulty: 1,
  },
  {
    id: 'i-iv-V-i-harmonique',
    name: 'Mineur harmonique (V majeur)',
    degrees: 'i–iv–V–i',
    description: 'Classique mineur avec dominante majeure pour la résolution forte.',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Am'), p('Dm'), p('E7'), p('Am')],
    moods: ['cinematic', 'sad'],
    difficulty: 2,
    examples: 'Hava Nagila · Misirlou · House of the Rising Sun',
  },

  // ─── JAZZ ─────────────────────────────────────────────────────
  {
    id: 'ii-v-i',
    name: 'ii–V–I (jazz)',
    degrees: 'ii⁷–V⁷–IΔ⁷',
    description: 'La cadence jazz par excellence. Tension-résolution en 3 accords.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('Dm7'), p('G7'), p('Cmaj7')],
    moods: ['jazzy'],
    difficulty: 3,
    examples: 'Autumn Leaves · Tune Up · 90% des standards jazz',
  },
  {
    id: 'ii-v-i-mineur',
    name: 'ii–V–i mineur (jazz)',
    degrees: 'ii⁷♭⁵–V⁷–i⁷',
    description: 'Variante mineure de la ii–V–I, avec m7♭5 (demi-diminué).',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Bm7b5'), p('E7'), p('Am7')],
    moods: ['jazzy', 'sad'],
    difficulty: 4,
  },
  {
    id: 'rhythm-changes',
    name: 'Rhythm changes (A-section)',
    degrees: 'I–vi–ii–V (×2)',
    description: 'Forme bebop de "I Got Rhythm" de Gershwin. Standard du jazz.',
    refRoot: 'C',
    refKey: 'major',
    chords: [
      p('Cmaj7', 2), p('Am7', 2),
      p('Dm7', 2), p('G7', 2),
      p('Cmaj7', 2), p('Am7', 2),
      p('Dm7', 2), p('G7', 2),
    ],
    moods: ['jazzy'],
    difficulty: 4,
  },
  {
    id: 'autumn-leaves',
    name: 'Autumn Leaves (A-section)',
    degrees: 'ii–V–I–IV–vii°–III–vi',
    description: 'L\'enchaînement le plus joué en jam jazz.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('Dm7'), p('G7'), p('Cmaj7'), p('Fmaj7'), p('Bm7b5'), p('E7'), p('Am7')],
    moods: ['jazzy'],
    difficulty: 4,
  },

  // ─── LATIN / BOSSA ────────────────────────────────────────────
  {
    id: 'bossa-i-ii-v',
    name: 'Bossa nova de base',
    degrees: 'IΔ⁷–ii⁷–V⁷',
    description: 'Trame harmonique bossa : grande douceur des maj7.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('Cmaj7'), p('Dm7'), p('G7')],
    moods: ['latin', 'jazzy', 'chill'],
    difficulty: 3,
    examples: 'The Girl from Ipanema · Wave · Desafinado',
  },

  // ─── CINEMATIC / EPIC ─────────────────────────────────────────
  {
    id: 'i-bvi-iv-v',
    name: 'Mineur cinéma',
    degrees: 'i–♭VI–IV–V',
    description: 'Progression dramatique avec sous-dominante majeure inattendue.',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Am'), p('F'), p('D'), p('E')],
    moods: ['cinematic', 'epic'],
    difficulty: 3,
  },
  {
    id: 'i-v-bvii-iv',
    name: 'Lydien moderne',
    degrees: 'I–V–♭VII–IV',
    description: 'Couleur mixolydienne avec V majeur. Folk-rock épique.',
    refRoot: 'D',
    refKey: 'major',
    chords: [p('D'), p('A'), p('C'), p('G')],
    moods: ['epic', 'rock'],
    difficulty: 2,
    examples: 'Hey Jude · Wonderwall (refrain)',
  },

  // ─── CHILL / SUS ──────────────────────────────────────────────
  {
    id: 'sus-add-folk',
    name: 'Folk sus/add9',
    degrees: 'Iadd9–IVsus2–vi⁷–V',
    description: 'Couleurs aérées, perfect pour fingerstyle.',
    refRoot: 'D',
    refKey: 'major',
    chords: [p('Dadd9'), p('Asus2'), p('Bm7'), p('A')],
    moods: ['chill', 'pop'],
    difficulty: 2,
  },
  {
    id: 'modal-dorian',
    name: 'Vamp dorien',
    degrees: 'i⁷–IV (×N)',
    description: 'Vamp dorien sur deux accords. Idéal pour improviser.',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Am7'), p('D')],
    moods: ['chill', 'jazzy'],
    difficulty: 2,
    examples: 'So What (Miles Davis) · Oye Como Va',
  },

  // ─── POP MODERNE ──────────────────────────────────────────────
  {
    id: 'mario-cadence',
    name: 'Mario cadence',
    degrees: '♭VI–♭VII–I',
    description: 'Trois accords ascendants, finale héroïque.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('G#'), p('A#'), p('C')],
    moods: ['epic'],
    difficulty: 3,
  },
  {
    id: 'four-chord-song',
    name: 'Axe progression (la "Pachelbel pop")',
    degrees: 'I–V–vi–IV–I–V–IV (variante)',
    description: 'Variante 7-mesures qui résout en IV. Reconnue mondialement.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('C'), p('G'), p('Am'), p('F'), p('C'), p('G'), p('F')],
    moods: ['pop'],
    difficulty: 1,
  },
  {
    id: 'minor-pop-modern',
    name: 'Pop mineur moderne (Billie/Ariana)',
    degrees: 'i–♭VI–IV–v',
    description: 'Couleur mineure introspective avec un IV majeur lumineux.',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Am'), p('F'), p('D'), p('Em')],
    moods: ['pop', 'sad'],
    difficulty: 2,
    examples: 'Bad Guy · No Tears Left to Cry · Stay (Rihanna)',
  },

  // ─── SAD ──────────────────────────────────────────────────────
  {
    id: 'sad-emo-i-iii-iv',
    name: 'Ballade triste majeure',
    degrees: 'I–iii–IV–iv',
    description: 'Le iv mineur final donne un goût mélancolique inattendu.',
    refRoot: 'C',
    refKey: 'major',
    chords: [p('C'), p('Em'), p('F'), p('Fm')],
    moods: ['sad'],
    difficulty: 3,
  },
  {
    id: 'descending-bass',
    name: 'Descending bass (Stairway-style)',
    degrees: 'i–vii–vi–V (chromatique)',
    description: 'Basse qui descend chromatiquement, ambiance baroque/rock.',
    refRoot: 'A',
    refKey: 'minor',
    chords: [p('Am'), p('G'), p('F'), p('E')],
    moods: ['cinematic', 'rock'],
    difficulty: 2,
  },

  // ─── CHILL / SUSPENSE ────────────────────────────────────────
  {
    id: 'modal-mixolydian-jam',
    name: 'Vamp mixolydien',
    degrees: 'I⁷–♭VII',
    description: 'Couleur folk-rock, parfait pour solo sur la gamme mixolydienne.',
    refRoot: 'A',
    refKey: 'major',
    chords: [p('A7'), p('G')],
    moods: ['rock', 'chill'],
    difficulty: 2,
    examples: 'Pinball Wizard · Norwegian Wood',
  },
];

// Auto-référence pour silence l'unused warning si tests
void FOUR_BEATS;

// ─── Helpers UI ────────────────────────────────────────────────────────

export const ALL_MOODS: Mood[] = [
  'pop',
  'rock',
  'chill',
  'sad',
  'epic',
  'jazzy',
  'latin',
  'cinematic',
];

export const MOOD_LABELS: Record<Mood, string> = {
  pop: 'Pop',
  rock: 'Rock',
  chill: 'Chill',
  sad: 'Sad',
  epic: 'Epic',
  jazzy: 'Jazzy',
  latin: 'Latin',
  cinematic: 'Cinematic',
};

export function getProgression(id: string): Progression | undefined {
  return PROGRESSIONS.find((p) => p.id === id);
}
