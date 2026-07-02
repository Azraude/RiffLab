/**
 * greetings.ts — phrases hero dynamiques pour le Dashboard.
 *
 * Sess DASHBOARD : avant on avait "Bon retour, Melvin." hardcodé. Maintenant
 * on pick une phrase contextualisée selon :
 *   - heure (matin / après-midi / soir)
 *   - jours depuis la dernière session (long_absence si > 7j)
 *   - streak en cours (on_streak si ≥ 3)
 *   - première visite ou pas
 *
 * Pure lib, zéro side-effect, testable. Le pick est aléatoire à chaque
 * appel donc le user voit une phrase fraîche à chaque visite.
 */

export interface GreetingContext {
  /** Prénom ou pseudo de l'user. Fallback "ami" en haut niveau. */
  userName: string;
  /** Nb de jours depuis la dernière session de pratique. -1 si jamais. */
  daysSinceLast: number;
  /** Streak en cours (jours consécutifs avec pratique). 0 si rien. */
  streak: number;
  /** Total sessions jamais enregistrées. 0 = first visit. */
  totalSessions: number;
  /** Heure courante 0-23 (new Date().getHours()). */
  hour: number;
}

export interface GreetingResult {
  title: string;
  subtitle: string;
}

// ─── Pools de phrases ──────────────────────────────────────────────

const TITLES = {
  morning_returning: [
    'Bon retour, {name}.',
    'Salut {name}, prêt à riffer ?',
    'Te revoilà {name}.',
    "Café-guitare, {name} ?",
    'Prêt à jouer, {name} ?',
  ],
  afternoon_returning: [
    'On reprend, {name} ?',
    'Yo {name}, une petite session ?',
    'Bon retour {name}.',
    "C'est l'heure du riff, {name}.",
    'Rebonjour {name}.',
  ],
  evening_returning: [
    'Bonsoir {name}, un dernier riff ?',
    '{name}, la guitare du soir ?',
    'On se détend avec un riff, {name} ?',
    'Te revoilà {name}.',
    'Prêt(e) pour un riff, {name} ?',
  ],
  long_absence: [
    'Encore là, {name} ?',
    'Te revoilà {name}, tu nous as manqué.',
    'Le retour du roi {name}.',
    "Hey {name}, on reprend où on s'est laissés ?",
  ],
  // 1ère visite : TOUJOURS "Bienvenue" (décision Melvin — pas de variante).
  first_time: ['Bienvenue {name}.'],
  on_streak: [
    '{streak} jours d\'affilée, {name} 🔥',
    'On garde le rythme {name} ?',
    'Streak {streak} jours, on lâche rien {name}.',
    '{streak} jours consécutifs {name}, machine.',
  ],
} as const;

const SUBTITLES = {
  morning: [
    'Un petit riff pour bien commencer ?',
    'Ton accord du jour t\'attend.',
    'Une petite idée ?',
    '5 minutes pour démarrer en douceur.',
  ],
  afternoon: [
    'Une pause guitare ?',
    'Continue ta progression.',
    'Ton accord du jour t\'attend.',
    'Un riff entre deux trucs.',
  ],
  evening: [
    'Détends-toi avec un riff.',
    'L\'inspi vient en jouant.',
    '5 minutes suffisent pour rester sharp.',
    'La session du soir, le moment chill.',
  ],
} as const;

// ─── Helpers ───────────────────────────────────────────────────────

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function bucketHour(hour: number): 'morning' | 'afternoon' | 'evening' {
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

// ─── Logique de pick ───────────────────────────────────────────────

/**
 * Sélectionne la catégorie de title la plus pertinente selon le contexte.
 * Priorités (du plus spécifique au plus générique) :
 *   1. First time (totalSessions === 0)
 *   2. Long absence (> 7 jours sans session)
 *   3. On streak (streak ≥ 3) — gros booster d'engagement
 *   4. Sinon : morning / afternoon / evening selon l'heure
 */
function pickTitleCategory(
  ctx: GreetingContext,
): keyof typeof TITLES {
  if (ctx.totalSessions === 0) return 'first_time';
  if (ctx.daysSinceLast > 7) return 'long_absence';
  if (ctx.streak >= 3) return 'on_streak';
  const bucket = bucketHour(ctx.hour);
  if (bucket === 'morning') return 'morning_returning';
  if (bucket === 'afternoon') return 'afternoon_returning';
  return 'evening_returning';
}

/**
 * Génère un greeting complet (title + subtitle) randomisé pour le contexte.
 * Random à chaque call → fraîcheur à chaque visite du Dashboard.
 */
export function pickGreeting(ctx: GreetingContext): GreetingResult {
  const category = pickTitleCategory(ctx);
  const titleTemplate = pickRandom(TITLES[category]);
  const title = titleTemplate
    .replace('{name}', ctx.userName)
    .replace('{streak}', ctx.streak.toString());

  const bucket = bucketHour(ctx.hour);
  const subtitle = pickRandom(SUBTITLES[bucket]);

  return { title, subtitle };
}

/**
 * Calcule `daysSinceLast` depuis la liste des dates de sessions (format
 * 'YYYY-MM-DD'). Returns -1 si la liste est vide.
 */
export function daysSinceLastSession(
  sessionDates: readonly string[],
  todayIso: string = new Date().toISOString().slice(0, 10),
): number {
  if (sessionDates.length === 0) return -1;
  const sorted = [...sessionDates].sort();
  const last = sorted[sorted.length - 1];
  const lastTs = new Date(last + 'T00:00:00Z').getTime();
  const todayTs = new Date(todayIso + 'T00:00:00Z').getTime();
  return Math.max(0, Math.floor((todayTs - lastTs) / 86_400_000));
}
