/**
 * socialStreakStore — track la streak d'activité sociale jour par jour
 * (sess 30 Task 3).
 *
 * Local Dexie/localStorage via Zustand persist. À chaque action sociale
 * utile (like, comment, publish, follow, mastered), on appelle
 * `recordActivity()` qui :
 *  - Si déjà actif aujourd'hui → no-op (idempotent par jour)
 *  - Si actif hier → currentStreak++ (chaîne continue)
 *  - Sinon → currentStreak = 1 (reset)
 *  - Update longestStreak = max(longest, current)
 *
 * Badges débloqués via socialApi.unlockBadgeServer si auth :
 *  - streak-7 : currentStreak >= 7
 *  - streak-30 : currentStreak >= 30
 *
 * Note : déclenché client-side. Pas de fraude check (l'user peut
 * trafficker localStorage). Pour MVP c'est OK — le badge n'a aucune
 * valeur monétaire et c'est un système d'engagement auto-motivant.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { unlockBadgeServer } from '@/lib/socialApi';
import { getBadgeMeta } from '@/lib/badges';
import { useAuth } from './authStore';

type SocialStreakState = {
  /** Streak en cours (jours consécutifs d'activité) */
  currentStreak: number;
  /** Record all-time */
  longestStreak: number;
  /** Dernière date d'activité au format YYYY-MM-DD (locale) */
  lastActiveDate: string | null;
  /** Méthode à appeler à chaque action sociale utile */
  recordActivity: () => void;
};

/** YYYY-MM-DD format local (pas UTC, pour matcher la perception user). */
function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Renvoie la date d'avant-hier au format YYYY-MM-DD. */
function yesterdayOf(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export const useSocialStreak = create<SocialStreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,

      recordActivity: () => {
        const today = todayLocal();
        const { lastActiveDate, currentStreak, longestStreak } = get();

        // Déjà compté aujourd'hui → no-op
        if (lastActiveDate === today) return;

        const yest = yesterdayOf(today);
        let nextStreak: number;
        if (lastActiveDate === yest) {
          nextStreak = currentStreak + 1;
        } else {
          nextStreak = 1;
        }
        const nextLongest = Math.max(longestStreak, nextStreak);

        set({
          currentStreak: nextStreak,
          longestStreak: nextLongest,
          lastActiveDate: today,
        });

        // Check des paliers badges (async, fire-and-forget)
        void checkStreakBadges(nextStreak);
      },
    }),
    {
      name: 'rifflab-social-streak',
      version: 1,
    }
  )
);

/**
 * Vérifie si des paliers de streak ont été franchis et unlock le badge
 * côté Supabase (si l'user est auth). Idempotent : unlockBadgeServer
 * swallow le conflit unique violation.
 */
async function checkStreakBadges(currentStreak: number): Promise<void> {
  const me = useAuth.getState().user;
  if (!me) return; // Pas de badge si pas auth, mais le compteur local
  // tourne quand même

  const newBadges: string[] = [];
  if (currentStreak >= 7) {
    const r = await unlockBadgeServer(me.id, 'streak-7');
    if (r.data) newBadges.push('streak-7');
  }
  if (currentStreak >= 30) {
    const r = await unlockBadgeServer(me.id, 'streak-30');
    if (r.data) newBadges.push('streak-30');
  }

  // Toast pour les nouveaux badges. Import dynamique pour éviter cycle
  // (useToast n'est pas accessible hors composant).
  if (newBadges.length > 0) {
    // Stocke les nouveaux badges dans sessionStorage pour qu'un
    // composant qui mount puisse les afficher (pattern simple, évite
    // de coupler le store au système toast).
    try {
      const existing = JSON.parse(
        sessionStorage.getItem('rifflab-pending-badge-toasts') ?? '[]'
      ) as string[];
      const labels = newBadges
        .map((slug) => {
          const meta = getBadgeMeta(slug);
          return meta ? `${meta.emoji} ${meta.title}` : slug;
        })
        .filter((s) => !existing.includes(s));
      if (labels.length > 0) {
        sessionStorage.setItem(
          'rifflab-pending-badge-toasts',
          JSON.stringify([...existing, ...labels])
        );
        // Custom event pour que le ToastViewport (ou tout listener)
        // affiche les toasts asap
        window.dispatchEvent(
          new CustomEvent('rifflab-badge-unlocked', { detail: { labels } })
        );
      }
    } catch {
      // sessionStorage indispo (mode privé) → on log juste
      console.info('[streak] badges débloqués :', newBadges);
    }
  }
}
