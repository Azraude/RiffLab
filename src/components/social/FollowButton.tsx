/**
 * FollowButton — bouton "Suivre / Suivi ✓" réutilisable.
 *
 * - Si pas connecté → toast "Connecte-toi pour suivre"
 * - Si soi-même → caché (n'affiche rien)
 * - Optimistic update : on flip l'état immédiatement, revert si error
 */
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { UserPlus, UserCheck } from 'lucide-react';
import { followUser, unfollowUser, isFollowing } from '@/lib/socialApi';
import { useAuth } from '@/stores/authStore';
import { useToast } from '@/hooks/useToast';

interface FollowButtonProps {
  /** UUID du profil à suivre */
  userId: string;
  /** Username (juste pour les toasts) */
  username?: string;
  /** Variante visuelle */
  variant?: 'primary' | 'compact';
}

export function FollowButton({ userId, username, variant = 'primary' }: FollowButtonProps) {
  const me = useAuth((s) => s.user);
  const toast = useToast();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!me) {
      setFollowing(false);
      return;
    }
    void (async () => setFollowing(await isFollowing(userId)))();
  }, [me?.id, userId]);

  // Self : pas de bouton
  if (me && me.id === userId) return null;

  const handleClick = async () => {
    if (!me) {
      toast.warning('Connecte-toi pour suivre');
      return;
    }
    if (following === null || pending) return;
    setPending(true);
    const wantToFollow = !following;
    setFollowing(wantToFollow); // optimistic
    const { error } = wantToFollow ? await followUser(userId) : await unfollowUser(userId);
    setPending(false);
    if (error) {
      setFollowing(!wantToFollow);
      toast.error(error.message);
    } else if (wantToFollow) {
      toast.success(`Tu suis ${username ? `@${username}` : 'ce riffeur'}`);
    }
  };

  if (following === null) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-surface px-4 text-xs font-medium text-text-soft opacity-60"
      >
        …
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={pending}
        className={clsx(
          'inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[11px] font-bold transition-colors',
          following
            ? 'border-border bg-surface text-text-muted hover:border-danger/40 hover:text-danger'
            : 'border-gold/40 bg-gold/10 text-gold hover:bg-gold/20'
        )}
      >
        {following ? 'Suivi ✓' : '+ Suivre'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={pending}
      className={clsx(
        'inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-all',
        following
          ? 'border border-border bg-surface-2 text-text hover:border-danger/40 hover:text-danger'
          : 'bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold hover:-translate-y-px'
      )}
    >
      {following ? (
        <>
          <UserCheck size={16} /> Suivi
        </>
      ) : (
        <>
          <UserPlus size={16} /> Suivre
        </>
      )}
    </button>
  );
}
