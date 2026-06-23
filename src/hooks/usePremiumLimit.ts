/**
 * usePremiumLimit — gating quantitatif des features free tier.
 *
 * Donne la limite, le compteur courant, l'état "atteint", et un
 * checkOrPrompt() qui ouvre la modale RiffLab+ si la limite est franchie.
 */
import { usePremium } from './usePremium';

export const PREMIUM_LIMITS = {
  setlists: 2,
  customProgressions: 3,
  savedAudios: 3,
  youtubeLoopsPerMonth: 3,
} as const;

export type PremiumLimitKey = keyof typeof PREMIUM_LIMITS;

export function usePremiumLimit(type: PremiumLimitKey, currentCount: number) {
  const { isPremium, requirePremium } = usePremium();
  const limit = PREMIUM_LIMITS[type];
  const reached = !isPremium && currentCount >= limit;

  /** True si on peut continuer ; sinon ouvre la modale et retourne false. */
  const checkOrPrompt = (reason?: string): boolean => {
    if (isPremium) return true;
    if (currentCount < limit) return true;
    requirePremium({ feature: type, reason });
    return false;
  };

  return {
    isPremium,
    limit,
    currentCount,
    reached,
    remaining: Math.max(0, limit - currentCount),
    checkOrPrompt,
  };
}
