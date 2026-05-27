/**
 * Supabase client singleton — session 22, Phase 5.1 démarrage cloud.
 *
 * Auth via magic link email + Google OAuth (cf authStore).
 * Persiste la session en localStorage (default Supabase).
 * detectSessionInUrl : récupère le token au retour du callback OAuth /
 * magic link sans intervention manuelle.
 *
 * ⚠️ Dexie reste source de vérité côté client tant que Phase 5.2 (sync
 * Dexie↔Postgres) n'est pas livrée. Supabase ici sert UNIQUEMENT à
 * l'auth + futur stockage cloud.
 */
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing in .env.local — auth flows will fail. Copy .env.example to .env.local and fill in.',
  );
}

export const supabase = createClient(url ?? '', key ?? '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

/** True si les env vars sont présentes (utile pour gating UI). */
export const isSupabaseConfigured = Boolean(url && key);
