/**
 * NavAvatar — 5ème item de la MobileNav (sess SET-MOBILENAV).
 *
 * Pattern Instagram/TikTok : avatar bottom-right qui mène au profil.
 * - Connecté + profile dispo → avatar img Link vers /profile
 * - Connecté + pas d'avatar_url → cercle gold avec initiale
 * - Pas connecté → cercle ghost + label "Se connecter" → ouvre LoginModal
 *
 * Active state : ring gold quand /profile ou /u/:myUsername.
 */
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/stores/authStore';
import { getProfile, type Profile } from '@/lib/socialApi';
import { LoginModal } from '@/components/auth/LoginModal';

export function NavAvatar() {
  const user = useAuth((s) => s.user);
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  // Fetch mon profile pour avatar_url + username (best-effort, silencieux si erreur)
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await getProfile(user.id);
      if (!cancelled) setProfile(data);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Active si on est sur /profile ou /u/<myUsername>
  const isActive =
    location.pathname === '/profile' ||
    (profile?.username
      ? location.pathname === `/u/${profile.username}` ||
        location.pathname.startsWith(`/u/${profile.username}/`)
      : false);

  // ─── Pas connecté : bouton ghost qui ouvre LoginModal ───
  if (!user) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          aria-label="Se connecter"
          className={clsx(
            'relative flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider transition-colors',
            'text-text-soft hover:text-text',
          )}
        >
          <span className="flex h-5 w-5 items-center justify-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-surface-2 text-text-soft">
              <User size={14} />
            </span>
          </span>
          <span className="mt-1 text-center leading-tight">Connecter</span>
        </button>
        <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  // ─── Connecté : avatar Link vers /profile ───
  const initial = (profile?.username?.[0] ?? user.email?.[0] ?? '?').toUpperCase();
  return (
    <Link
      to="/profile"
      aria-label="Mon profil"
      className={clsx(
        'relative flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider transition-colors',
        isActive ? 'text-gold' : 'text-text-soft hover:text-text',
      )}
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 flex justify-center"
        >
          <span className="h-0.5 w-8 rounded-full bg-gold shadow-[0_0_8px_rgb(var(--gold-glow)/0.6)]" />
        </span>
      )}
      <span className="flex h-5 w-5 items-center justify-center">
        {profile?.avatar_url ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img
            src={profile.avatar_url}
            alt=""
            className={clsx(
              'h-7 w-7 rounded-full object-cover',
              isActive ? 'ring-2 ring-gold' : 'ring-1 ring-border',
            )}
          />
        ) : (
          <span
            className={clsx(
              'flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
              isActive
                ? 'bg-gradient-to-b from-gold-bright to-gold text-bg ring-2 ring-gold/40'
                : 'bg-gold/15 text-gold ring-1 ring-gold/30',
            )}
          >
            {initial === '?' ? <User size={12} /> : initial}
          </span>
        )}
      </span>
      <span className="mt-1 text-center leading-tight">Profil</span>
    </Link>
  );
}
