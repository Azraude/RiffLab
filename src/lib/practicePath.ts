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
  /** Durée estimée pour boucler le module */
  estimatedMinutes: number;
  /** Liste des objectifs concrets à valider */
  objectives: string[];
  /** Liens vers d'autres pages de l'app pour s'exercer */
  exercises: Array<{ label: string; route: string }>;
};

export const PATH_LEVELS: PathLevel[] = [
  {
    id: 'bases',
    order: 1,
    title: 'Bases',
    pitch: 'Les accords ouverts essentiels : Em, G, C, D, Am.',
    estimatedMinutes: 30,
    objectives: [
      'Connaître les 5 accords ouverts de base',
      'Transitionner entre eux sans accroc',
      'Tenir un strum simple en croches',
    ],
    exercises: [
      { label: 'Bibliothèque d\'accords', route: '/chords' },
      { label: 'Métronome 70 BPM', route: '/metronome' },
    ],
  },
  {
    id: 'strumming',
    order: 2,
    title: 'Strumming',
    pitch: 'Patterns de base : down-down-up-up-down-up. La main droite.',
    estimatedMinutes: 25,
    objectives: [
      'Tenir le pattern folk DDUUDU sur Em / G / C / D',
      'Varier le tempo de 70 à 100 BPM',
      'Reconnaître croches et doubles-croches',
    ],
    exercises: [
      { label: 'Strum Patterns', route: '/strum-patterns' },
      { label: 'Métronome', route: '/metronome' },
    ],
  },
  {
    id: 'first-song',
    order: 3,
    title: 'Première chanson',
    pitch: 'Jouer un morceau du début à la fin, sans interruption.',
    estimatedMinutes: 40,
    objectives: [
      'Choisir un morceau adapté (3-4 accords)',
      'Mémoriser la structure couplet/refrain',
      'Tenir tout le morceau du début à la fin',
    ],
    exercises: [
      { label: 'Riff de la semaine', route: '/riff-of-the-week' },
      { label: 'Mes sons', route: '/songs' },
    ],
  },
  {
    id: 'barre-chords',
    order: 4,
    title: 'Accords barrés',
    pitch: 'L\'épreuve initiatique : le F barré, puis les autres formes.',
    estimatedMinutes: 45,
    objectives: [
      'Position correcte du F barré',
      'Tenir le barré sans douleur 30 secondes',
      'Passer d\'un barré à un accord ouvert proprement',
    ],
    exercises: [
      { label: 'Bibliothèque d\'accords', route: '/chords' },
    ],
  },
  {
    id: 'penta-minor',
    order: 5,
    title: 'Pentatonique mineure',
    pitch: 'La gamme de tous les solos. Position 1 sur le manche.',
    estimatedMinutes: 30,
    objectives: [
      'Mémoriser la position 1 de la penta mineure',
      'Jouer les notes ascendantes puis descendantes',
      'Improviser une phrase de 4 mesures',
    ],
    exercises: [
      { label: 'Gammes', route: '/scales' },
      { label: 'Mode jam', route: '/jam' },
    ],
  },
  {
    id: 'soloing',
    order: 6,
    title: 'Soloing basics',
    pitch: 'Bends, hammer-ons, pull-offs. Faire chanter une note.',
    estimatedMinutes: 35,
    objectives: [
      'Bend précis sur le 7e fret de Si',
      'Enchaîner hammer-on + pull-off',
      'Improviser sur un backing track jam',
    ],
    exercises: [
      { label: 'Mode jam', route: '/jam' },
      { label: 'Gammes', route: '/scales' },
    ],
  },
  {
    id: 'theory-intervals',
    order: 7,
    title: 'Théorie : intervalles',
    pitch: 'Comprendre les distances entre les notes, à l\'oreille.',
    estimatedMinutes: 25,
    objectives: [
      'Reconnaître quinte / quarte / octave à l\'oreille',
      'Identifier majeure vs mineure',
      'Score ≥ 80 % en mode débutant ear training',
    ],
    exercises: [
      { label: 'Ear training', route: '/ear-training' },
    ],
  },
  {
    id: 'jazzy-chords',
    order: 8,
    title: 'Accords jazzy',
    pitch: 'maj7, m7, sus2, sus4. Les couleurs harmoniques.',
    estimatedMinutes: 35,
    objectives: [
      'Cmaj7, Dm7, Gm7, F#m7b5',
      'Distinguer le son maj7 vs 7 vs m7',
      'Jouer une progression ii-V-I',
    ],
    exercises: [
      { label: 'Bibliothèque d\'accords', route: '/chords' },
      { label: 'Progressions', route: '/progressions' },
    ],
  },
  {
    id: 'modes',
    order: 9,
    title: 'Théorie des modes',
    pitch: 'Dorien, mixolydien, lydien. Le langage du jazz et du prog.',
    estimatedMinutes: 50,
    objectives: [
      'Comprendre la formule de chaque mode',
      'Identifier dorien dans un morceau de prog',
      'Improviser en mixolydien sur un V7',
    ],
    exercises: [
      { label: 'Gammes', route: '/scales' },
      { label: 'Ear training', route: '/ear-training' },
    ],
  },
  {
    id: 'composition',
    order: 10,
    title: 'Composition libre',
    pitch: 'Écrire ton premier morceau original, du début à la fin.',
    estimatedMinutes: 90,
    objectives: [
      'Choisir une progression motivante',
      'Écrire un couplet + un refrain',
      'Enregistrer une démo dans Mes Sons',
    ],
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
