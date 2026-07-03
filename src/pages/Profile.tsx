/**
 * /profile — entry point édition personnelle.
 *
 * Comportement :
 * - Pas connecté → écran "Connecte-toi" GRACIEUX (plus de redirect /
 *   silencieux qui frustre l'user)
 * - Connecté → redirect vers /u/<myUsername> (vue profil ; l'édition
 *   s'ouvre via le bouton "Modifier" du ProfileHero)
 * - Connecté sans profil DB → message d'erreur explicite
 */
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { LogIn, User as UserIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/stores/authStore';
import { getProfile } from '@/lib/socialApi';
import { LoginModal } from '@/components/auth/LoginModal';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';

export function Profile() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const [username, setUsername] = useState<string | null | undefined>(undefined);
  const [loginOpen, setLoginOpen] = useState(false);

  // Récupère mon username pour construire l'URL /u/<username>
  useEffect(() => {
    if (!user) {
      setUsername(undefined);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await getProfile(user.id);
      if (cancelled) return;
      setUsername(data?.username ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Loading state (auth en cours OU profile fetch en cours)
  if (loading) {
    return <ProfileSkeleton />;
  }

  // Pas connecté → écran gracieux avec CTA Se connecter.
  // PLUS de redirect / silencieux (frustrait l'user qui ne comprenait
  // pas pourquoi /profile le ramenait à l'accueil).
  if (!user) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold/30 bg-gold/5">
            <UserIcon size={36} className="text-gold/70" />
          </div>
          <h2 className="display mb-3 text-2xl">Pour voir ton profil</h2>
          <p className="mb-8 text-sm leading-relaxed text-text-muted">
            Connecte-toi pour customiser ton profil, suivre des riffeurs et
            partager tes riffs publiquement. RiffLab marche aussi en mode
            local sans compte — le profil sert juste à la dimension sociale.
          </p>
          <button
            type="button"
            onClick={() => setLoginOpen(true)}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-7 text-sm font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px"
          >
            <LogIn size={16} />
            Se connecter
          </button>
        </div>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  // Connecté + profile fetch en cours
  if (username === undefined) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <Card>
          <p className="text-sm text-text-muted">Chargement…</p>
        </Card>
      </>
    );
  }

  // Profile pas créé (rare — devrait être créé automatiquement à la
  // signup). Fallback : message + bouton reconnexion.
  if (username === null) {
    return (
      <>
        <PageHeader title="Mon profil" />
        <Card>
          <p className="text-sm text-text-muted">
            Aucun profil trouvé pour ce compte. Connecte-toi à nouveau pour le
            recréer.
          </p>
        </Card>
      </>
    );
  }

  // Redirect vers /u/<username> — SANS ?edit=1 depuis la refonte bottom
  // nav 2026-07-03 : /profile est devenu le tab "Profil" du MobileNav,
  // auto-ouvrir le drawer d'édition à chaque tap était insupportable.
  // L'édition reste à 1 tap via le bouton "Modifier" du ProfileHero.
  return <Navigate to={`/u/${username}`} replace />;
}
