/**
 * useAuthGate — hook gating soft pour actions sociales (sess GATE).
 *
 * Pattern réseau social Instagram/TikTok : sans compte = browse, avec
 * compte = interactions. Quand l'user déconnecté tente une action gatée
 * (like, bookmark, comment, follow, publish), on affiche un toast
 * pédagogique + on ouvre la LoginModal automatiquement (200ms delay
 * pour laisser le toast pop avant le modal).
 *
 * Usage :
 *   const { requireAuth, loginOpen, setLoginOpen, isConnected } = useAuthGate();
 *
 *   const handleLike = async () => {
 *     if (!requireAuth('aimer')) return;     // toast + open modal si pas auth
 *     await likeRiff(id);                     // skip si pas auth
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleLike}>❤️</button>
 *       <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
 *     </>
 *   );
 *
 * Le caller DOIT monter <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
 * dans son JSX pour que le drawer apparaisse.
 */
import { useCallback, useState } from 'react';
import { useAuth } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';

export interface AuthGate {
  /** True si l'user est authentifié (raccourci pour `!!user`). */
  isConnected: boolean;
  /**
   * Vérifie l'auth. Si OK → return true (le caller continue).
   * Si KO → toast "Connecte-toi pour <action>" + ouvre LoginModal
   * après 200ms (laisse le toast pop d'abord) + return false.
   */
  requireAuth: (actionLabel: string) => boolean;
  /** Bind sur LoginModal `open`. */
  loginOpen: boolean;
  /** Bind sur LoginModal `onOpenChange`. */
  setLoginOpen: (open: boolean) => void;
}

export function useAuthGate(): AuthGate {
  const user = useAuth((s) => s.user);
  const [loginOpen, setLoginOpen] = useState(false);
  const toast = useToast();

  const requireAuth = useCallback(
    (actionLabel: string): boolean => {
      if (user) return true;
      toast.info(`Connecte-toi pour ${actionLabel}`);
      window.setTimeout(() => setLoginOpen(true), 200);
      return false;
    },
    [user, toast],
  );

  return { requireAuth, loginOpen, setLoginOpen, isConnected: !!user };
}
