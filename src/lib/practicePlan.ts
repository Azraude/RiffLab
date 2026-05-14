/**
 * Practice plan — moteur de génération de plans de pratique perso sur 4 semaines.
 *
 * Le user répond à 3 questions (objectif, durée/jour, fréquence/sem) et le moteur
 * génère 28 jours avec un mix d'activités tirées d'une bibliothèque taggée.
 */

export type PracticeGoal =
  | 'fundamentals'
  | 'rhythm'
  | 'chords'
  | 'ear'
  | 'speed'
  | 'stage';

export const GOAL_OPTIONS: Array<{
  id: PracticeGoal;
  label: string;
  description: string;
}> = [
  {
    id: 'fundamentals',
    label: 'Apprendre les bases',
    description: 'Accords ouverts, premier rythme, premiers morceaux. Le pack zéro-à-un.',
  },
  {
    id: 'rhythm',
    label: 'Améliorer ma rythmique',
    description: 'Régularité, patterns variés, groove. Pour ceux qui accrochent les croches.',
  },
  {
    id: 'chords',
    label: "Élargir mon répertoire d'accords",
    description: 'Barrés, 7e, voicings ouverts riches. Sortir des 4 accords magiques.',
  },
  {
    id: 'ear',
    label: 'Travailler mon oreille',
    description: 'Reconnaître intervalles, accords et progressions au son. Indispensable pour jammer.',
  },
  {
    id: 'speed',
    label: 'Travailler ma vitesse',
    description: 'Speed trainer sur tes sections difficiles. Monter progressivement à 100 %.',
  },
  {
    id: 'stage',
    label: 'Préparer une scène',
    description: 'Setlists, transitions, mémorisation. Cap sur le live propre.',
  },
];

export const GOAL_LABEL: Record<PracticeGoal, string> = Object.fromEntries(
  GOAL_OPTIONS.map((g) => [g.id, g.label])
) as Record<PracticeGoal, string>;

export type ActivityType = 'warmup' | 'technique' | 'ear' | 'theory' | 'play' | 'rhythm';

export type ActivityTemplate = {
  id: string;
  title: string;
  detail?: string;
  route?: string;
  /** Durée nominale en min — sera scalée selon minutesPerDay. */
  minutes: number;
  goals: PracticeGoal[];
  type: ActivityType;
};

/** Bibliothèque d'activités, taggée par objectif. */
export const ACTIVITIES: ActivityTemplate[] = [
  // Échauffements (toujours en premier)
  {
    id: 'warmup-tuner',
    title: 'Vérifier l\'accordage',
    detail: 'Passe par le tuner, accorde précis.',
    route: '/tuner',
    minutes: 1,
    goals: ['fundamentals', 'rhythm', 'chords', 'ear', 'speed', 'stage'],
    type: 'warmup',
  },
  {
    id: 'warmup-chrom',
    title: 'Chromatique 1-2-3-4',
    detail: 'Quatre frets, six cordes, métronome lent. Doigts détendus.',
    route: '/metronome',
    minutes: 3,
    goals: ['fundamentals', 'speed', 'rhythm'],
    type: 'warmup',
  },
  {
    id: 'warmup-chord-changes',
    title: 'Transitions Em ↔ G ↔ C ↔ D',
    detail: 'Le carré d\'or. Compte combien de transitions tu fais en 60s.',
    route: '/chords',
    minutes: 3,
    goals: ['fundamentals', 'chords'],
    type: 'warmup',
  },
  // Rythme
  {
    id: 'rhythm-basic',
    title: 'Pattern basique tout-en-bas',
    detail: 'À 80 BPM, sur un Em. Ferme les yeux, écoute le métronome.',
    route: '/strum-patterns',
    minutes: 5,
    goals: ['rhythm', 'fundamentals'],
    type: 'rhythm',
  },
  {
    id: 'rhythm-folk',
    title: 'Pattern folk DDUUDU',
    detail: 'Le classique. À 95 BPM, varie les accords.',
    route: '/strum-patterns',
    minutes: 5,
    goals: ['rhythm'],
    type: 'rhythm',
  },
  {
    id: 'rhythm-explore',
    title: 'Explorer 2 nouveaux patterns',
    detail: 'Pioche dans la lib — reggae, country, funk… Essaie-les sur un morceau.',
    route: '/strum-patterns',
    minutes: 7,
    goals: ['rhythm', 'stage'],
    type: 'rhythm',
  },
  // Accords
  {
    id: 'chords-open-pack',
    title: 'Pack accords ouverts',
    detail: 'Em, G, C, D, Am, Dm, E, A. Mémorise les voicings.',
    route: '/chords',
    minutes: 6,
    goals: ['fundamentals', 'chords'],
    type: 'technique',
  },
  {
    id: 'chords-7th',
    title: 'Découvrir les 7e',
    detail: 'E7, A7, D7, B7. Note la couleur sombre/tendue.',
    route: '/chords',
    minutes: 5,
    goals: ['chords'],
    type: 'technique',
  },
  {
    id: 'chords-barre-f',
    title: 'Le F barré',
    detail: 'L\'épreuve initiatique. Travaille la position, pas la pression.',
    route: '/chords',
    minutes: 8,
    goals: ['chords'],
    type: 'technique',
  },
  {
    id: 'chords-maj7',
    title: 'Voicings maj7 / m7',
    detail: 'Cmaj7, Fmaj7, Dm7, Am7. Le son jazz/bossa.',
    route: '/chords',
    minutes: 6,
    goals: ['chords'],
    type: 'technique',
  },
  // Oreille
  {
    id: 'ear-intervals-easy',
    title: 'Intervalles débutant',
    detail: '10 questions, niveau débutant. Vise 80 % de réussite.',
    route: '/ear-training',
    minutes: 5,
    goals: ['ear', 'fundamentals'],
    type: 'ear',
  },
  {
    id: 'ear-chords-quality',
    title: 'Qualités d\'accord',
    detail: '10 questions — majeur vs mineur, puis 7e.',
    route: '/ear-training',
    minutes: 5,
    goals: ['ear', 'chords'],
    type: 'ear',
  },
  {
    id: 'ear-progressions',
    title: 'Progressions au son',
    detail: 'Repère le I-V-vi-IV à l\'oreille — pratique-le sur 5 questions.',
    route: '/ear-training',
    minutes: 6,
    goals: ['ear', 'stage'],
    type: 'ear',
  },
  // Théorie / gammes
  {
    id: 'theory-pentatonic-em',
    title: 'Penta mineure Em',
    detail: 'Position 1 sur le manche. Joue 5 notes ascendantes, 5 descendantes.',
    route: '/scales',
    minutes: 5,
    goals: ['fundamentals', 'speed', 'rhythm'],
    type: 'theory',
  },
  {
    id: 'theory-major-scale',
    title: 'Gamme majeure C',
    detail: 'Sur 2 octaves. Chante les notes en montant.',
    route: '/scales',
    minutes: 5,
    goals: ['chords', 'ear'],
    type: 'theory',
  },
  {
    id: 'theory-progressions',
    title: 'Découvrir 3 nouvelles progressions',
    detail: 'Pioche dans la lib filtrée par mood. Joue-les en boucle.',
    route: '/progressions',
    minutes: 7,
    goals: ['stage', 'chords', 'rhythm'],
    type: 'theory',
  },
  // Speed
  {
    id: 'speed-trainer-section',
    title: 'Speed trainer sur une section',
    detail: 'Ouvre un de tes sons, monte de 60 → 80 %, valide les paliers.',
    route: '/songs',
    minutes: 8,
    goals: ['speed', 'stage'],
    type: 'technique',
  },
  {
    id: 'speed-metronome-up',
    title: 'Monter au métronome',
    detail: '10 BPM par bloc, sur ta phrase difficile. Stop dès que ça déraille.',
    route: '/metronome',
    minutes: 7,
    goals: ['speed'],
    type: 'technique',
  },
  // Jeu / play
  {
    id: 'play-favorite-song',
    title: 'Jouer un morceau favori',
    detail: 'Du début à la fin, sans s\'arrêter même si tu te plantes.',
    route: '/songs',
    minutes: 8,
    goals: ['fundamentals', 'rhythm', 'chords', 'stage'],
    type: 'play',
  },
  {
    id: 'play-setlist-run',
    title: 'Run de la setlist',
    detail: 'Mode lecture, enchaîne sans pause. Filme-toi pour debrief.',
    route: '/setlists',
    minutes: 12,
    goals: ['stage'],
    type: 'play',
  },
  {
    id: 'play-record',
    title: 'Enregistrer un essai',
    detail: 'Ouvre un son, lance le recorder, joue. Écoute-toi après.',
    route: '/songs',
    minutes: 6,
    goals: ['stage', 'rhythm'],
    type: 'play',
  },
  {
    id: 'play-jam-improv',
    title: 'Improvisation libre',
    detail: 'Jam sur Em / G / C / D pendant 5 min. Pas de plan, juste joue.',
    route: '/jam',
    minutes: 5,
    goals: ['rhythm', 'ear', 'speed'],
    type: 'play',
  },
];

// ─── Plan structure ───────────────────────────────────────────────────

export type PlannedActivity = {
  templateId: string;
  title: string;
  detail?: string;
  route?: string;
  minutes: number;
  done?: boolean;
};

export type PlanDay = {
  dayNumber: number; // 1..28
  rest: boolean;
  activities: PlannedActivity[];
};

export type PracticePlanData = {
  startDate: string; // ISO yyyy-mm-dd
  goal: PracticeGoal;
  minutesPerDay: 5 | 10 | 15;
  daysPerWeek: 3 | 5 | 7;
  days: PlanDay[];
};

// ─── Generation ───────────────────────────────────────────────────────

/** Génère un plan de 28 jours selon les paramètres. Déterministe basé sur le seed. */
export function generatePlan(args: {
  goal: PracticeGoal;
  minutesPerDay: 5 | 10 | 15;
  daysPerWeek: 3 | 5 | 7;
  startDate?: string;
}): PracticePlanData {
  const { goal, minutesPerDay, daysPerWeek } = args;
  const startDate = args.startDate ?? new Date().toISOString().slice(0, 10);

  // Quels jours de la semaine sont "actifs" (1=lundi, ..., 7=dimanche)
  // 3/sem → L M V ; 5/sem → L M M J V ; 7/sem → tous
  const activeDays: Record<number, number[]> = {
    3: [1, 3, 5],
    5: [1, 2, 3, 4, 5],
    7: [1, 2, 3, 4, 5, 6, 7],
  };
  const activeSet = new Set(activeDays[daysPerWeek]);

  // Date de départ → on calcule le day-of-week de chaque jour du plan
  const start = new Date(startDate + 'T00:00:00');
  const days: PlanDay[] = [];

  const goalActivities = ACTIVITIES.filter((a) => a.goals.includes(goal));
  const warmups = goalActivities.filter((a) => a.type === 'warmup');
  const nonWarmups = goalActivities.filter((a) => a.type !== 'warmup');

  // Indexe les non-warmups par type pour varier dans la semaine
  let activityRotation = 0;

  for (let i = 0; i < 28; i++) {
    const dayDate = new Date(start);
    dayDate.setDate(dayDate.getDate() + i);
    const dow = ((dayDate.getDay() + 6) % 7) + 1; // 1=lundi … 7=dimanche
    const isActive = activeSet.has(dow);

    if (!isActive) {
      days.push({ dayNumber: i + 1, rest: true, activities: [] });
      continue;
    }

    // Constitue la séance
    const activities: PlannedActivity[] = [];
    let budget = minutesPerDay;

    // Toujours 1 warmup (court)
    const warmup = warmups[i % Math.max(1, warmups.length)];
    if (warmup && budget >= warmup.minutes) {
      activities.push({
        templateId: warmup.id,
        title: warmup.title,
        detail: warmup.detail,
        route: warmup.route,
        minutes: warmup.minutes,
      });
      budget -= warmup.minutes;
    }

    // Puis on remplit avec des non-warmups en rotation
    let attempts = 0;
    while (budget > 0 && attempts < nonWarmups.length * 2) {
      const a = nonWarmups[activityRotation % nonWarmups.length];
      activityRotation++;
      attempts++;
      // Skip si déjà dans la séance ou trop long
      if (activities.some((act) => act.templateId === a.id)) continue;
      if (a.minutes > budget + 2) continue; // tolérance +2min
      const actualMinutes = Math.min(a.minutes, budget);
      activities.push({
        templateId: a.id,
        title: a.title,
        detail: a.detail,
        route: a.route,
        minutes: actualMinutes,
      });
      budget -= actualMinutes;
      // Stop si on a déjà 3 activités
      if (activities.length >= 3) break;
    }

    days.push({ dayNumber: i + 1, rest: false, activities });
  }

  return {
    startDate,
    goal,
    minutesPerDay,
    daysPerWeek,
    days,
  };
}

/** Renvoie le jour courant (1..28) ou null si plan expiré ou pas encore commencé. */
export function getCurrentDayNumber(plan: PracticePlanData): number | null {
  const start = new Date(plan.startDate + 'T00:00:00').getTime();
  const today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00').getTime();
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff >= 28) return null;
  return diff + 1;
}

/** Total minutes prévues. */
export function totalPlannedMinutes(plan: PracticePlanData): number {
  return plan.days.reduce(
    (sum, d) => sum + d.activities.reduce((s, a) => s + a.minutes, 0),
    0
  );
}

/** Minutes complétées. */
export function completedMinutes(plan: PracticePlanData): number {
  return plan.days.reduce(
    (sum, d) =>
      sum + d.activities.filter((a) => a.done).reduce((s, a) => s + a.minutes, 0),
    0
  );
}

/** % d'activités terminées. */
export function planProgress(plan: PracticePlanData): number {
  const all = plan.days.flatMap((d) => d.activities);
  if (all.length === 0) return 0;
  const done = all.filter((a) => a.done).length;
  return Math.round((done / all.length) * 100);
}
