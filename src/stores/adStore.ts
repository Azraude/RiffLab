/**
 * adStore — déclenchement des interstitielles + frequency cap.
 *
 * Règles :
 *  - Pop-up après POPUP_AFTER_N_RIFFS riffs détail visités.
 *  - Interstitielle sur action : au moins ACTIONS_BEFORE_INTERSTITIAL actions
 *    ET cooldown INTERSTITIAL_COOLDOWN_MS écoulé depuis la dernière.
 *
 * Persisté (localStorage) hors `interstitialOpen` pour ne pas rouvrir au reload.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const POPUP_AFTER_N_RIFFS = 10;
const INTERSTITIAL_COOLDOWN_MS = 5 * 60 * 1000; // 5 min
const ACTIONS_BEFORE_INTERSTITIAL = 3;

interface AdState {
  riffsVisitedSinceLastAd: number;
  actionsSinceLastInterstitial: number;
  lastInterstitialAt: number;
  interstitialOpen: boolean;

  trackRiffVisit: () => void;
  trackAction: () => void;
  triggerInterstitial: () => void;
  closeInterstitial: () => void;
  shouldShowInterstitial: () => boolean;
}

export const useAdStore = create<AdState>()(
  persist(
    (set, get) => ({
      riffsVisitedSinceLastAd: 0,
      actionsSinceLastInterstitial: 0,
      lastInterstitialAt: 0,
      interstitialOpen: false,

      trackRiffVisit: () => {
        const next = get().riffsVisitedSinceLastAd + 1;
        if (next >= POPUP_AFTER_N_RIFFS) {
          set({ riffsVisitedSinceLastAd: 0 });
          get().triggerInterstitial();
        } else {
          set({ riffsVisitedSinceLastAd: next });
        }
      },

      trackAction: () => {
        set({ actionsSinceLastInterstitial: get().actionsSinceLastInterstitial + 1 });
        if (get().shouldShowInterstitial()) {
          get().triggerInterstitial();
        }
      },

      shouldShowInterstitial: () => {
        const { lastInterstitialAt, actionsSinceLastInterstitial } = get();
        const elapsed = Date.now() - lastInterstitialAt;
        return (
          elapsed >= INTERSTITIAL_COOLDOWN_MS &&
          actionsSinceLastInterstitial >= ACTIONS_BEFORE_INTERSTITIAL
        );
      },

      triggerInterstitial: () =>
        set({
          interstitialOpen: true,
          lastInterstitialAt: Date.now(),
          actionsSinceLastInterstitial: 0,
        }),

      closeInterstitial: () => set({ interstitialOpen: false }),
    }),
    {
      name: 'rifflab_ads',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        riffsVisitedSinceLastAd: state.riffsVisitedSinceLastAd,
        lastInterstitialAt: state.lastInterstitialAt,
      }),
    },
  ),
);
