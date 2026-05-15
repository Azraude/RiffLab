/**
 * Practice Path — chemin d'apprentissage Duolingo-style, 10 modules
 * ordonnés du débutant à l'avancé. Chaque node se débloque quand le
 * précédent est complété.
 *
 * Stockage : table Dexie `practiceProgress`. Chaque ligne = un node
 * complété avec timestamp. Le calcul du current/locked/available se
 * fait au render à partir de cette liste.
 */
import { db, type PracticePathNode } from './db';

export type PathLevel = {
  /** ID stable (utilisé en clé Dexie + URL hash + etc.) */
  id: string;
  /** Numéro d'ordre 1-N (pour affichage "Niveau 3") */
  order: number;
  title: string;
  /** Courte description du module */
  pitch: string;
  /** Durée estimée pour boucler le module (en min/jour) */
  minutesPerDay: number;
  /** Nb jours conseillés pour valider */
  daysRecommended: number;
  /** Liste des objectifs concrets à valider */
  objectives: string[];
  /** 3-5 accords précis à maîtriser */
  chordsToLearn: string[];
  /** 0-2 gammes liées (id de scale) */
  scalesToLearn: string[];
  /** 0-2 techniques (libellés) */
  techniques: string[];
  /** Morceau exemple de la library (titre libre, lien optionnel) */
  exampleSong?: string;
  /** Liens vers d'autres pages de l'app pour s'exercer */
  exercises: Array<{ label: string; route: string }>;
};

export const PATH_LEVELS: PathLevel[] = [
  {
    id: 'bases',
    order: 1,
    title: 'Bases',
    pitch: 'Les accords ouverts essentiels et les premières transitions sans accroc.',
    minutesPerDay: 15,
    daysRecommended: 5,
    objectives: [
      'Connaître les 5 accords ouverts de base',
      'Transitionner entre eux sans accroc',
      'Tenir un strum simple en croches',
    ],
    chordsToLearn: ['Em', 'G', 'C', 'D', 'Am'],
    scalesToLearn: [],
    techniques: ['Position main gauche', 'Pression doigts'],
    exampleSong: 'Wonderwall (Oasis)',
    exercises: [
      { label: "Bibliothèque d'accords", route: '/chords' },
      { label: 'Métronome 70 BPM', route: '/metronome' },
    ],
  },
  {
    id: 'strumming',
    order: 2,
    title: 'Strumming',
    pitch: 'Le pattern folk DDUUDU et ses variations. La main droite qui groove.',
    minutesPerDay: 15,
    daysRecommended: 5,
    objectives: [
      'Tenir le pattern folk DDUUDU sur Em / G / C / D',
      'Varier le tempo de 70 à 100 BPM',
      'Reconnaître croches et doubles-croches',
    ],
    chordsToLearn: ['Em', 'G', 'C', 'D'],
    scalesToLearn: [],
    techniques: ['Pattern DDUUDU', 'Mute palm'],
    exampleSong: 'Horse with No Name (America)',
    exercises: [
      { label: 'Strum Patterns', route: '/strum-patterns' },
      { label: 'Métronome', route: '/metronome' },
    ],
  },
  {
    id: 'first-song',
    order: 3,
    title: 'Première chanson',
    pitch: 'Du début à la fin, sans interruption. Le premier morceau qui finit le voyage.',
    minutesPerDay: 20,
    daysRecommended: 7,
    objectives: [
      'Choisir un morceau adapté (3-4 accords)',
      'Mémoriser la structure couplet/refrain',
      'Tenir tout le morceau du début à la fin',
    ],
    chordsToLearn: ['Em', 'G', 'D', 'A7'],
    scalesToLearn: [],
    techniques: ['Mémorisation structure', 'Continuité sans pause'],
    exampleSong: 'Three Little Birds (Bob Marley)',
    exercises: [
      { label: 'Riff de la semaine', route: '/riff-of-the-week' },
      { label: 'Mes sons', route: '/songs' },
    ],
  },
  {
    id: 'barre-chords',
    order: 4,
    title: 'Accords barrés',
    pitch: "L'épreuve initiatique : le F barré, puis les autres formes E et A.",
    minutesPerDay: 15,
    daysRecommended: 7,
    objectives: [
      'Position correcte du F barré',
      'Tenir le barré sans douleur 30 secondes',
      "Passer d'un barré à un accord ouvert proprement",
    ],
    chordsToLearn: ['F', 'Bm', 'B7', 'C#m', 'F#m'],
    scalesToLearn: [],
    techniques: ['Barré index', 'Pression équilibrée'],
    exampleSong: 'Hotel California (Eagles)',
    exercises: [{ label: "Bibliothèque d'accords", route: '/chords' }],
  },
  {
    id: 'penta-minor',
    order: 5,
    title: 'Pentatonique mineure',
    pitch: 'La gamme de tous les solos rock et blues. Position 1 sur le manche.',
    minutesPerDay: 15,
    daysRecommended: 5,
    objectives: [
      'Mémoriser la position 1 de la penta mineure',
      'Jouer les notes ascendantes puis descendantes',
      'Improviser une phrase de 4 mesures',
    ],
    chordsToLearn: ['Em', 'Am', 'Dm'],
    scalesToLearn: ['penta_minor'],
    techniques: ['Alternate picking', 'Legato basics'],
    exampleSong: 'Sunshine of Your Love (Cream)',
    exercises: [
      { label: 'Gammes', route: '/scales' },
      { label: 'Mode jam', route: '/jam' },
    ],
  },
  {
    id: 'soloing',
    order: 6,
    title: 'Soloing basics',
    pitch: 'Bends, hammer-ons, pull-offs. Les techniques qui font chanter une note.',
    minutesPerDay: 15,
    daysRecommended: 7,
    objectives: [
      'Bend précis sur le 7e fret de Si',
      'Enchaîner hammer-on + pull-off',
      'Improviser sur un backing track jam',
    ],
    chordsToLearn: [],
    scalesToLearn: ['penta_minor', 'blues'],
    techniques: ['Bend', 'Hammer-on', 'Pull-off', 'Vibrato'],
    exampleSong: 'Smoke on the Water — solo intro',
    exercises: [
      { label: 'Mode jam', route: '/jam' },
      { label: 'Gammes', route: '/scales' },
    ],
  },
  {
    id: 'theory-intervals',
    order: 7,
    title: 'Théorie : intervalles',
    pitch: "Comprendre les distances entre les notes, à l'oreille comme sur le papier.",
    minutesPerDay: 10,
    daysRecommended: 5,
    objectives: [
      "Reconnaître quinte / quarte / octave à l'oreille",
      'Identifier majeure vs mineure',
      'Score ≥ 80 % en mode débutant ear training',
    ],
    chordsToLearn: [],
    scalesToLearn: ['major'],
    techniques: ['Solfège basique'],
    exampleSong: 'Aucun morceau spécifique — c\'est de la théorie pure',
    exercises: [{ label: 'Ear training', route: '/ear-training' }],
  },
  {
    id: 'jazzy-chords',
    order: 8,
    title: 'Accords jazzy',
    pitch: 'maj7, m7, sus2, sus4. Les couleurs harmoniques qui ouvrent un autre monde.',
    minutesPerDay: 15,
    daysRecommended: 7,
    objectives: [
      'Maîtriser Cmaj7, Dm7, Gm7, F#m7b5',
      'Distinguer le son maj7 vs 7 vs m7',
      'Jouer une progression ii-V-I en C',
    ],
    chordsToLearn: ['Cmaj7', 'Dm7', 'Gm7', 'F#m7b5', 'A7'],
    scalesToLearn: [],
    techniques: ['Voicings barrés partiels', 'Comping rythmique'],
    exampleSong: 'Autumn Leaves (Standard)',
    exercises: [
      { label: "Bibliothèque d'accords", route: '/chords' },
      { label: 'Progressions', route: '/progressions' },
    ],
  },
  {
    id: 'modes',
    order: 9,
    title: 'Théorie des modes',
    pitch: 'Dorien, mixolydien, lydien. Le langage du jazz, du prog et de la fusion.',
    minutesPerDay: 20,
    daysRecommended: 7,
    objectives: [
      'Comprendre la formule de chaque mode',
      'Identifier dorien dans un morceau de prog',
      'Improviser en mixolydien sur un V7',
    ],
    chordsToLearn: [],
    scalesToLearn: ['dorian', 'mixolydian', 'lydian'],
    techniques: ['Application modale', 'Centre tonal'],
    exampleSong: 'So What (Miles Davis) — dorien',
    exercises: [
      { label: 'Gammes', route: '/scales' },
      { label: 'Ear training', route: '/ear-training' },
    ],
  },
  {
    id: 'composition',
    order: 10,
    title: 'Composition libre',
    pitch: 'Écrire ton premier morceau original, du début à la fin. La consécration.',
    minutesPerDay: 30,
    daysRecommended: 7,
    objectives: [
      'Choisir une progression motivante',
      'Écrire un couplet + un refrain',
      'Enregistrer une démo dans Mes Sons',
    ],
    chordsToLearn: [],
    scalesToLearn: [],
    techniques: ['Structure couplet/refrain', 'Topline melody', 'Enregistrement'],
    exampleSong: 'Ton premier morceau — tu vas l\'écrire toi-même.',
    exercises: [
      { label: 'Mes sons', route: '/songs' },
      { label: 'Progressions', route: '/progressions' },
    ],
  },
];

// ─── Dexie helpers ────────────────────────────────────────────────────

export async function listCompletedNodes(): Promise<PracticePathNode[]> {
  return db.practiceProgress.toArray();
}

export async function isNodeCompleted(id: string): Promise<boolean> {
  const row = await db.practiceProgress.get(id);
  return !!row;
}

export async function markNodeCompleted(id: string): Promise<void> {
  await db.practiceProgress.put({ id, completedAt: Date.now() });
}

export async function unmarkNodeCompleted(id: string): Promise<void> {
  await db.practiceProgress.delete(id);
}

export async function resetProgress(): Promise<void> {
  await db.practiceProgress.clear();
}

// ─── State computation ────────────────────────────────────────────────

export type NodeState = 'locked' | 'available' | 'current' | 'completed';

/**
 * Calcule l'état de chaque node à partir de la liste des nodes complétés.
 * Règles :
 * - Si le node est dans `completedIds` → 'completed'
 * - Sinon, si tous les niveaux précédents sont 'completed' → 'available'
 *   (le premier 'available' devient 'current')
 * - Sinon → 'locked'
 */
export function computeNodeStates(
  completedIds: Set<string>
): Record<string, NodeState> {
  const out: Record<string, NodeState> = {};
  let foundCurrent = false;
  for (const level of PATH_LEVELS) {
    if (completedIds.has(level.id)) {
      out[level.id] = 'completed';
      continue;
    }
    // Le premier non-complété accessible (tous les précédents OK)
    const prevOk =
      level.order === 1 ||
      PATH_LEVELS.slice(0, level.order - 1).every((l) => completedIds.has(l.id));
    if (prevOk && !foundCurrent) {
      out[level.id] = 'current';
      foundCurrent = true;
    } else if (prevOk) {
      out[level.id] = 'available';
    } else {
      out[level.id] = 'locked';
    }
  }
  return out;
}
