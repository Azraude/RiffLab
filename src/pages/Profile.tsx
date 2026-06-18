/**
 * /profile — entry point profil personnel.
 *
 * Sess PROFIL : redirect vers /u/<myUsername>?edit=1 (UserProfile ouvre
 * le ProfileEditDrawer auto via `?edit=1`).
 *
 * Fix accès (sess MEGA, re-applied après merge silent) :
 *  - AVANT : `if (!loading && !user) navigate('/')` → renvoyait à l'accueil
 *    dès qu'on n'était pas connecté. RiffLab étant local-first/sans compte,
 *    c'était le cas par défaut → /profile semblait "ne rien faire".
 *  - MAINTENANT : pas connecté → écran "Connecte-toi pour voir ton profil"
 *    avec bouton ouvrant la LoginModal (pas de redirect home).
 *  - Connecté + pas de row `profiles` (devrait être créée à la signup) →
 *    création auto gracieuse, puis redirect normal.
 */
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UserCircle2, Globe } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/stores/authStore';
import { getProfile } from '@/lib/socialApi';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LoginModal } from '@/components/auth/LoginModal';

/** username de secours dérivé de l'email (avant @, slug alphanumérique). */
function deriveUsername(email: string | undefined): string {
  const base = (email ?? '').split('@')[0]?.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return base && base.length > 0 ? base : 'guitariste';
}

export function Profile() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const [username, setUsername] = useState<string | null | undefined>(undefined);
  const [loginOpen, setLoginOpen] = useState(false);

  // Récupère mon profil (et le crée s'il manque) pour construire l'URL
  // /u/<username>?edit=1.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    void (async () => {
      let { data } = await getProfile(user.id);

      // Pas de row profiles → création auto. Devrait normalement être créée
      // à la signup ; ici c'est un filet de sécurité.
      if (!data && isSupabaseConfigured) {
        const base = deriveUsername(user.email);
        const row = {
          id: user.id,
          username: base,
          display_name: user.email ?? base,
        };
        const { error } = await supabase.from('profiles').insert(row);
        // Collision de username probable → réessaie avec un suffixe court.
        if (error) {
          await supabase
            .from('profiles')
            .insert({ ...row, username: `${base}-${user.id.slice(0, 6)}` });
        }
        const retry = await getProfile(user.id);
        data = retry.data;
      }

      if (cancelled) return;
      setUsername(data?.username ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // === Pas connecté → écran connexion (PAS de redirect home) ===
  if (!loading && !user) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <Card className="text-center">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-4 py-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
              <UserCircle2 size={32} strokeWidth={1.5} />
            </div>
            <div className="space-y-1.5">
              <h2 className="display text-display-sm">Connecte-toi pour voir ton profil</h2>
              <p className="text-sm leading-relaxed text-text-muted">
                Tu n'es pas obligé. RiffLab marche en mode local sans compte —
                le profil sert juste à partager publiquement tes riffs et à te
                suivre dans la commu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-7 text-[15px] font-bold text-bg shadow-gold-strong transition-all hover:-translate-y-px active:scale-[0.99]"
            >
              <Globe size={17} />
              Se connecter
            </button>
          </div>
        </Card>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  // === Loading state ===
  if (loading || !user || username === undefined) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <Card>
          <p className="text-sm text-text-muted">Chargement…</p>
        </Card>
      </>
    );
  }

  // === Profil introuvable même après tentative de création ===
  if (username === null) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <Card>
          <p className="text-sm text-text-muted">
            Impossible de charger ton profil pour l'instant. Déconnecte-toi puis
            reconnecte-toi pour le recréer.
          </p>
        </Card>
      </>
    );
  }

  // === Redirect canonique vers /u/<username>?edit=1 (ProfileEditDrawer auto) ===
  return <Navigate to={`/u/${username}?edit=1`} replace />;
}
