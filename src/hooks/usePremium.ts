/**
 * usePremium — accès au flag premium + contrôle de la modale RiffLab+.
 *
 * La modale est GLOBALE (store zustand) : n'importe quel composant peut
 * l'ouvrir (lock, ad banner, limite atteinte…) et UNE seule <GlobalPremiumModal>
 * montée dans Layout l'affiche. Évite le piège d'un useState local par hook
 * (le bouton de l'AdBanner n'aurait rien ouvert sinon).
 */
import { create } from 'zustand';
import { useCallback } from 'react';
import { useAuth } from '@/stores/authStore';

type PremiumModalState = {
  open: boolean;
  reason?: string;
  feature?: string;
  show: (opts?: { reason?: string; feature?: string }) => void;
  close: () => void;
};

/** Store global de la modale premium (partagé entre tous les composants). */
export const usePremiumModal = create<PremiumModalState>((set) => ({
  open: false,
  reason: undefined,
  feature: undefined,
  show: (opts) => set({ open: true, reason: opts?.reason, feature: opts?.feature }),
  close: () => set({ open: false }),
}));

export function usePremium() {
  const isPremium = useAuth((s) => s.isPremium);
  const user = useAuth((s) => s.user);
  const open = usePremiumModal((s) => s.open);
  const show = usePremiumModal((s) => s.show);
  const close = usePremiumModal((s) => s.close);

  /** Retourne true si premium ; sinon ouvre la modale et retourne false. */
  const requirePremium = useCallback(
    (opts?: { reason?: string; feature?: string }): boolean => {
      if (isPremium) return true;
      show(opts);
      return false;
    },
    [isPremium, show],
  );

  const setModalOpen = useCallback(
    (v: boolean) => (v ? show() : close()),
    [show, close],
  );

  return {
    isPremium,
    isConnected: !!user,
    modalOpen: open,
    setModalOpen,
    openPremiumModal: show,
    closePremiumModal: close,
    requirePremium,
  };
}
