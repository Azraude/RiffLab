/**
 * Auth store — wrapper Zustand au-dessus de supabase.auth.
 *
 * Session persistée par le client Supabase lui-même (localStorage).
 * On mirror juste user/session/loading dans Zustand pour le rendu UI.
 *
 * Bootstrap au boot :
 * 1. getSession() résout la session existante (si refresh token valide)
 * 2. onAuthStateChange listener mis en place pour suivre login/logout
 *
 * API publique :
 * - signInWithMagicLink(email) — envoie un OTP par email
 * - signInWithGoogle() — OAuth flow, retour redirigé sur /dashboard
 * - signOut() — clear session
 */
import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type AuthState = {
  user: User | null;
  session: Session | null;
  /** True pendant la résolution initiale de getSession(). */
  loading: boolean;
  setSession: (session: Session | null) => void;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
};

export const useAuth = create<AuthState>((set) => ({
  user: null,
  session: null,
  loading: true,

  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    }),

  signInWithMagicLink: async (email) => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error('Supabase n\'est pas configuré (vérifie ton .env.local).'),
      };
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  },

  signInWithGoogle: async () => {
    if (!isSupabaseConfigured) {
      return {
        error: new Error('Supabase n\'est pas configuré (vérifie ton .env.local).'),
      };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return { error: error ? new Error(error.message) : null };
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null });
  },
}));

// ─── Bootstrap : restore session existante au load ────────────────
if (isSupabaseConfigured) {
  void supabase.auth.getSession().then(({ data: { session } }) => {
    useAuth.getState().setSession(session);
  });

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuth.getState().setSession(session);
  });
} else {
  // Sans Supabase configuré, on s'assure que loading=false pour ne pas
  // garder l'UI dans un état "chargement..." perpétuel.
  useAuth.setState({ loading: false });
}
