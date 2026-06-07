/**
 * Mini-quiz fin de niveau Practice Plan — générateur de questions QCM.
 *
 * Pour chaque PathLevel, on génère 3 questions :
 * - 1 sur un chord du level (parseChordName + question sur quality OU
 *   degré dans la tonalité du exampleSong)
 * - 1 sur une scale du level OU question générique théorie si le node
 *   n'a pas de scale (ex : "Combien de notes dans une pentatonique ?")
 * - 1 sur une technique du level (palm mute, hammer-on, bend, etc.)
 *
 * Templates randomisés avec shuffle des options. Pour rester light,
 * pas de vraie randomization profonde — un set de templates par
 * catégorie, on pick à chaque génération.
 */
import type { PathLevel } from './practicePath';
import { parseChordName } from './theory';
import { getScale } from './scaleDatabase';

export type QuizQuestion = {
  question: string;
  options: string[];
  /** Index dans options de la bonne réponse */
  answerIdx: number;
  /** Explication courte affichée après réponse */
  explain?: string;
};

export type Quiz = {
  nodeId: string;
  questions: QuizQuestion[];
};

// ─── Templates question accord ─────────────────────────────────

function chordQuestion(chordName: string): QuizQuestion | null {
  const parsed = parseChordName(chordName);
  if (!parsed) return null;

  // Templates par qualité
  const templates: Record<string, () => QuizQuestion> = {
    maj: () => ({
      question: `Combien de notes différentes y a-t-il dans l'accord ${chordName} (triade) ?`,
      options: shuffle(['3', '4', '5', '6']),
      answerIdx: 0,
      explain: 'Une triade = 3 notes (fondamentale + tierce + quinte).',
    }),
    min: () => ({
      question: `L'accord ${chordName} contient une tierce :`,
      options: shuffle(['Majeure (+4 demi-tons)', 'Mineure (+3 demi-tons)', 'Diminuée (+2 demi-tons)', 'Augmentée (+5 demi-tons)']),
      answerIdx: 1,
      explain: 'Un accord mineur a une tierce mineure (3 demi-tons depuis la fondamentale).',
    }),
    '7': () => ({
      question: `L'accord ${chordName} (dominante 7) sonne souvent comme :`,
      options: shuffle(['Une fin reposante', 'Une tension qui appelle un retour', 'Un accord neutre', 'Un accord triste']),
      answerIdx: 1,
      explain: 'La 7ème de dominante crée une tension qui se résout généralement sur la tonique.',
    }),
    m7: () => ({
      question: `${chordName} est un accord :`,
      options: shuffle(['Majeur 7', 'Mineur 7', 'Dominante 7', 'Diminué 7']),
      answerIdx: 1,
      explain: 'm7 = mineur 7. Vibe jazz / soul.',
    }),
    maj7: () => ({
      question: `${chordName} est un accord :`,
      options: shuffle(['Majeur 7', 'Mineur 7', 'Dominante 7', 'Diminué 7']),
      answerIdx: 0,
      explain: 'maj7 = majeur 7. Sound bossa / jazz doux.',
    }),
    dim: () => ({
      question: `Un accord diminué (${chordName}) :`,
      options: shuffle(['Sonne joyeux', 'Sonne instable / dissonant', 'Sonne triste', 'Sonne neutre']),
      answerIdx: 1,
      explain: 'Le diminué a une quinte diminuée → très instable, souvent passage.',
    }),
    sus4: () => ({
      question: `Un accord sus4 (${chordName}) suspend :`,
      options: shuffle(['La tierce remplacée par la quarte', 'La quinte remplacée par la sixte', 'La tonique remplacée par la seconde', 'Rien']),
      answerIdx: 0,
      explain: 'sus4 = "suspended 4th" : tierce remplacée par quarte → suspension.',
    }),
  };

  const template = templates[parsed.quality];
  if (template) return template();

  // Fallback générique
  return {
    question: `L'accord ${chordName} a pour fondamentale :`,
    options: shuffle(['C', 'D', parsed.root, 'G']).slice(0, 4),
    answerIdx: shuffle(['C', 'D', parsed.root, 'G']).slice(0, 4).indexOf(parsed.root),
    explain: `La fondamentale de ${chordName} est ${parsed.root}.`,
  };
}

// ─── Templates question gamme ─────────────────────────────────

function scaleQuestion(scaleId: string): QuizQuestion | null {
  const scale = getScale(scaleId as Parameters<typeof getScale>[0]);
  if (!scale) return null;

  // Mapping connaissances par id (basé sur scaleDatabase)
  const known: Record<string, QuizQuestion> = {
    penta_minor: {
      question: 'Combien de notes contient la gamme pentatonique mineure ?',
      options: ['4', '5', '6', '7'],
      answerIdx: 1,
      explain: 'Pentatonique = 5 notes (penta = 5 en grec).',
    },
    penta_major: {
      question: 'Combien de notes contient la gamme pentatonique majeure ?',
      options: ['4', '5', '6', '7'],
      answerIdx: 1,
      explain: 'Pentatonique = 5 notes. Sound country / pop chaud.',
    },
    major: {
      question: 'La gamme majeure contient :',
      options: ['5 notes', '6 notes', '7 notes', '12 notes'],
      answerIdx: 2,
      explain: 'Gamme majeure (Do Ré Mi Fa Sol La Si) = 7 notes diatoniques.',
    },
    minor_natural: {
      question: 'La gamme mineure naturelle se construit à partir du :',
      options: shuffle(['Ier degré majeur', 'IIIe degré majeur', 'VIe degré majeur', 'VIIe degré majeur']),
      answerIdx: 2,
      explain: 'La mineure naturelle = mode aéolien = VIe degré de la gamme majeure relative.',
    },
    blues: {
      question: 'La gamme blues ajoute par rapport à la pentatonique mineure :',
      options: shuffle(['Une 7e majeure', 'La "blue note" (b5)', 'Une 2e mineure', 'Rien']),
      answerIdx: 1,
      explain: 'La blues = penta mineure + la "blue note" b5 = 6 notes.',
    },
    dorian: {
      question: 'Le mode dorien est :',
      options: shuffle(['Une mineure avec 6 majeure', 'Une majeure avec 4 augmentée', 'Une mineure avec 7 majeure', 'Une majeure avec 5 diminuée']),
      answerIdx: 0,
      explain: 'Dorien = mineure naturelle mais avec une 6e majeure. Vibe jazz / funk.',
    },
  };
  return known[scaleId] ?? {
    question: `La gamme "${scale.name}" appartient à la catégorie :`,
    options: shuffle([scale.category, 'Modale', 'Pentatonique', 'Symétrique']).slice(0, 4),
    answerIdx: 0,
  };
}

// ─── Templates question technique ─────────────────────────────

function techniqueQuestion(technique: string): QuizQuestion {
  const lower = technique.toLowerCase();
  if (lower.includes('palm mute') || lower.includes('mute palm')) {
    return {
      question: 'Le palm mute se fait avec :',
      options: shuffle([
        'La paume de la main droite (sur les cordes près du chevalet)',
        'La paume de la main gauche',
        'Les deux mains',
        'Aucune main, juste la pression',
      ]),
      answerIdx: 0,
      explain: 'Palm mute = paume main droite (médiator) appuyée légèrement sur les cordes près du chevalet → son étouffé.',
    };
  }
  if (lower.includes('hammer')) {
    return {
      question: 'Un hammer-on consiste à :',
      options: shuffle([
        'Frapper une corde sans la pincer pour faire sonner la note',
        'Glisser un doigt sur une corde',
        'Pincer plus fort que d\'habitude',
        'Tirer la corde vers le bas',
      ]),
      answerIdx: 0,
      explain: 'Hammer-on = ajouter une note en frappant la corde sans repincer (legato).',
    };
  }
  if (lower.includes('bend')) {
    return {
      question: 'Le bend (tiré) consiste à :',
      options: shuffle([
        'Pousser ou tirer la corde pour monter la note',
        'Glisser le long du manche',
        'Étouffer la corde avec la main',
        'Frapper plusieurs cordes en même temps',
      ]),
      answerIdx: 0,
      explain: 'Le bend monte la hauteur de la note en tirant la corde verticalement (typique blues / rock).',
    };
  }
  if (lower.includes('slide')) {
    return {
      question: 'Un slide à la guitare consiste à :',
      options: shuffle([
        'Glisser un doigt d\'une frette à une autre sans relever',
        'Frapper plusieurs notes en arpège',
        'Étouffer la corde avec la paume',
        'Jouer en harmoniques',
      ]),
      answerIdx: 0,
    };
  }
  if (lower.includes('pattern') || lower.includes('strum')) {
    return {
      question: 'Le pattern DDUUDU correspond à :',
      options: shuffle([
        'Down-Down-Up-Up-Down-Up (folk classique)',
        '4 downstrokes simples',
        'Rythme reggae',
        'Pattern de jazz',
      ]),
      answerIdx: 0,
      explain: 'D = down (vers le bas), U = up (vers le haut). DDUUDU = pattern folk universel.',
    };
  }
  if (lower.includes('arpège') || lower.includes('arpeg')) {
    return {
      question: 'Un arpège consiste à :',
      options: shuffle([
        'Jouer les notes d\'un accord une par une',
        'Jouer toutes les cordes en même temps',
        'Étouffer la corde',
        'Glisser un doigt',
      ]),
      answerIdx: 0,
      explain: 'Arpège = décomposition d\'un accord en notes individuelles successives.',
    };
  }
  if (lower.includes('barré') || lower.includes('barre')) {
    return {
      question: 'L\'accord barré consiste à :',
      options: shuffle([
        'Appuyer un doigt sur plusieurs cordes à la même frette',
        'Étouffer une corde unique',
        'Tirer la corde verticalement',
        'Jouer en frappant le manche',
      ]),
      answerIdx: 0,
      explain: 'Barré = index (ou autre doigt) couvrant toutes les cordes à la même frette → permet de déplacer un voicing.',
    };
  }
  // Generic fallback
  return {
    question: `À quoi sert la technique "${technique}" ?`,
    options: shuffle([
      'À enrichir l\'expressivité du jeu',
      'À économiser des cordes',
      'À jouer plus fort',
      'À jouer plus vite uniquement',
    ]),
    answerIdx: 0,
    explain: 'Cette technique enrichit l\'expressivité — varie l\'attaque, le timbre, la dynamique.',
  };
}

// ─── Generator principal ──────────────────────────────────────

/**
 * Génère un quiz de 3 questions pour un PathLevel donné.
 * Pick 1 chord random + 1 scale random (ou générique) + 1 technique random.
 */
export function generateQuiz(node: PathLevel): Quiz {
  const questions: QuizQuestion[] = [];

  // Question chord
  if (node.chordsToLearn.length > 0) {
    const chord = node.chordsToLearn[Math.floor(Math.random() * node.chordsToLearn.length)];
    const q = chordQuestion(chord);
    if (q) questions.push(q);
  }

  // Question scale
  if (node.scalesToLearn.length > 0) {
    const scale = node.scalesToLearn[Math.floor(Math.random() * node.scalesToLearn.length)];
    const q = scaleQuestion(scale);
    if (q) questions.push(q);
  }

  // Question technique
  if (node.techniques.length > 0) {
    const technique = node.techniques[Math.floor(Math.random() * node.techniques.length)];
    questions.push(techniqueQuestion(technique));
  }

  // Si on n'a pas 3 questions (node sans scale/technique), on remplit avec
  // des questions chord additionnelles
  while (questions.length < 3 && node.chordsToLearn.length > questions.length) {
    const chord = node.chordsToLearn[questions.length];
    const q = chordQuestion(chord);
    if (q) questions.push(q);
    else break;
  }

  // Si encore < 3, fallback questions théorie générique
  const GENERIC: QuizQuestion[] = [
    {
      question: 'Combien de demi-tons dans une octave ?',
      options: ['7', '10', '12', '13'],
      answerIdx: 2,
      explain: 'Une octave = 12 demi-tons (toutes les notes chromatiques).',
    },
    {
      question: 'La note A4 correspond à la fréquence :',
      options: ['220 Hz', '440 Hz', '880 Hz', '1000 Hz'],
      answerIdx: 1,
      explain: 'A4 = 440 Hz, le standard d\'accordage moderne (norme ISO).',
    },
    {
      question: 'Combien de cordes a une guitare standard ?',
      options: ['4', '5', '6', '7'],
      answerIdx: 2,
    },
  ];
  let i = 0;
  while (questions.length < 3 && i < GENERIC.length) {
    questions.push(GENERIC[i]);
    i++;
  }

  return { nodeId: node.id, questions };
}

// ─── Utility ──────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
