/**
 * Daily Challenge — un défi quotidien pické déterministe depuis tabsDatabase.
 *
 * Logique :
 * - Pick déterministe : hash de la date YYYY-MM-DD modulo TABS.length
 *   → tout le monde a le même tab le même jour, et le tab change tous
 *   les jours.
 * - Persistance : table Dexie `dailyChallenges` (date PK + tabId + completedAt)
 * - Streak : compte les jours consécutifs depuis aujourd'hui en arrière.
 *
 * Utilisé par DailyChallengeCard sur le Dashboard.
 */
import { TABS, getTab, type Tab } from './tabsDatabase';
import { db, todayKey as todayKeyDb } from './db';

/** Date du jour en YYYY-MM-DD — utilise le même format que db.ts (UTC). */
export function todayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

// Re-export pour cohérence avec db.ts (même implémentation)
export { todayKeyDb };

/**
 * Hash 32-bit simple d'une string (FNV-1a-like). Suffit pour un modulo
 * sur 10-20 items, pas besoin de qualité crypto.
 */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Renvoie le tab du jour. Déterministe sur la date donnée (default = aujourd'hui).
 */
export function pickChallengeForDate(date: Date | string = new Date()): Tab {
  const key = typeof date === 'string' ? date : todayKey(date);
  const idx = hashString(key) % TABS.length;
  return TABS[idx];
}

/** Récupère le défi du jour, sa complétion, et son streak. */
export async function getDailyChallengeState(): Promise<{
  date: string;
  tab: Tab;
  completed: boolean;
  streak: number;
}> {
  const date = todayKey();
  const tab = pickChallengeForDate(date);
  const record = await db.dailyChallenges.get(date);
  const completed = !!record;
  const streak = await computeChallengeStreak();
  return { date, tab, completed, streak };
}

/** Marque le défi du jour comme accompli. Idempotent (re-put OK). */
export async function completeDailyChallenge(
  date: string = todayKey(),
  tabId?: string,
): Promise<void> {
  const tab = tabId ?? pickChallengeForDate(date).id;
  await db.dailyChallenges.put({
    date,
    tabId: tab,
    completedAt: Date.now(),
  });
}

/**
 * Streak : nombre de jours consécutifs (terminant aujourd'hui ou hier)
 * avec un défi complété. On accepte "hier" comme terminaison pour ne pas
 * casser la série pendant la journée où l'utilisateur n'a pas encore joué.
 */
export async function computeChallengeStreak(): Promise<number> {
  const all = await db.dailyChallenges.toArray();
  if (all.length === 0) return 0;
  const done = new Set(all.map((c) => c.date));

  const today = new Date();
  const todayK = todayKey(today);
  const yesterday = new Date(today.getTime() - 24 * 3600 * 1000);
  const yK = todayKey(yesterday);
  if (!done.has(todayK) && !done.has(yK)) return 0;

  // Démarre à aujourd'hui si fait, sinon hier
  const cursor = new Date(done.has(todayK) ? today.getTime() : yesterday.getTime());
  let count = 0;
  while (done.has(todayKey(cursor))) {
    count++;
    cursor.setTime(cursor.getTime() - 24 * 3600 * 1000);
  }
  return count;
}

/** Re-export pour les pages qui veulent juste un getTab. */
export { getTab };
