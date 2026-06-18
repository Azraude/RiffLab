/**
 * /profile — entry point édition personnelle.
 *
 * Sess PROFIL : refondu en redirect vers /u/<myUsername>?edit=1.
 * L'édition du profil se fait désormais via ProfileEditDrawer ouvert
 * automatiquement par UserProfile quand `?edit=1` est présent.
 *
 * Tant qu'on n'a pas chargé le profile (username), on affiche un
 * fallback de chargement. Si pas connecté → redirect /.
 */
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/stores/authStore';
import { getProfile } from '@/lib/socialApi';

export function Profile() {
  const user = useAuth((s) => s.user);
  const loading = useAuth((s) => s.loading);
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null | undefined>(undefined);

  // Pas connecté → landing
  useEffect(() => {
    if (!loading && !user) navigate('/');
  }, [loading, user, navigate]);

  // Récupère mon username pour construire l'URL /u/<username>?edit=1
  useEffect(() => {
    if (!user) return;
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

  // Loading state
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

  // Profile pas créé (rare — devrait être créé automatiquement à la
  // signup). Fallback : signout + retour landing.
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

  // Redirect vers /u/<username>?edit=1 → ProfileEditDrawer ouvert auto
  return <Navigate to={`/u/${username}?edit=1`} replace />;
}
