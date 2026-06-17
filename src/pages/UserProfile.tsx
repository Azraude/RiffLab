/**
 * /u/:username — page profil public d'un riffeur (sess 29).
 *
 * Hero (avatar + display_name + bio + stats) + bouton Follow + 4 tabs :
 *  - Riffs publiés
 *  - Maîtrisés (Phase ultérieure : table public_mastered, pour l'instant
 *    on affiche un message "données locales, à venir")
 *  - Bookmarks (idem, pour l'instant message)
 *  - Badges (depuis user_badges Supabase si dispo, sinon badges locaux
 *    Dexie pour l'user connecté)
 *
 * Si pas connecté ou pas configuré Supabase : on affiche un état dégradé
 * (info "profils publics nécessitent Supabase configuré").
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Calendar, Zap, Music2, BookmarkCheck, Award, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { FollowButton } from '@/components/social/FollowButton';
import {
  getProfile,
  getUserRiffs,
  getFollowCounts,
  getUserXP,
  getUserBadges,
  type Profile,
  type PublicRiff,
} from '@/lib/socialApi';
import { computeLevel } from '@/lib/xpSystem';
import { BADGE_CATALOG, getBadgeMeta } from '@/lib/badges';
import { useAuth } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';

type Tab = 'riffs' | 'mastered' | 'bookmarks' | 'badges';

export function UserProfile() {
  const { username } = useParams();
  const me = useAuth((s) => s.user);
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [riffs, setRiffs] = useState<PublicRiff[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('riffs');

  useEffect(() => {
    if (!username) return;
    void (async () => {
      const { data } = await getProfile(username);
      setProfile(data);
      if (data) {
        const [r, c, x, b] = await Promise.all([
          getUserRiffs(data.id),
          getFollowCounts(data.id),
          getUserXP(data.id),
          getUserBadges(data.id),
        ]);
        setRiffs(r.data ?? []);
        setCounts(c);
        setXp(x);
        setBadges((b.data ?? []).map((row) => row.badge_slug));
      }
    })();
  }, [username]);

  const level = useMemo(() => computeLevel(xp), [xp]);

  // Pas configuré : message
  if (!isSupabaseConfigured) {
    return (
      <>
        <Link to="/riffs" className="mb-4 inline-flex items-center gap-1 text-sm text-text-soft hover:text-gold">
          <ArrowLeft size={14} /> Feed des riffs
        </Link>
        <Card>
          <p className="text-sm text-text-muted">
            Les profils publics nécessitent Supabase configuré (vérifie ton
            .env.local). En attendant, tu peux utiliser RiffLab en mode local
            depuis le Dashboard.
          </p>
        </Card>
      </>
    );
  }

  // Chargement
  if (profile === undefined) {
    return (
      <>
        <Link to="/riffs" className="mb-4 inline-flex items-center gap-1 text-sm text-text-soft hover:text-gold">
          <ArrowLeft size={14} /> Feed des riffs
        </Link>
        <Card>
          <p className="text-sm text-text-muted">Chargement…</p>
        </Card>
      </>
    );
  }

  // Pas trouvé
  if (!profile) {
    return <Navigate to="/riffs" replace />;
  }

  const isMe = me?.id === profile.id;
  const initial = (profile.username[0] ?? '?').toUpperCase();

  return (
    <>
      <Link to="/riffs" className="mb-4 inline-flex items-center gap-1 text-sm text-text-soft hover:text-gold">
        <ArrowLeft size={14} /> Feed des riffs
      </Link>

      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-3xl"
      >
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-gold/30 bg-gold/10 font-mono text-2xl font-bold text-gold">
            {profile.avatar_url ? (
              // eslint-disable-next-line jsx-a11y/img-redundant-alt
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : initial === '?' ? (
              <User size={40} />
            ) : (
              initial
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="display text-display-lg leading-tight">
              {profile.display_name || profile.username}
            </h1>
            <div className="mt-0.5 font-mono text-sm text-text-muted">@{profile.username}</div>
            {profile.bio && (
              <p className="mt-2 max-w-xl text-sm text-text">{profile.bio}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-soft">
              <Stat label="riffs" value={riffs.length} />
              <Stat label="followers" value={counts.followers} />
              <Stat label="following" value={counts.following} />
              <Stat label={`${level.name}`} value={`⚡ ${xp} XP`} accent />
            </div>
            <div className="mt-4 flex items-center gap-3">
              {!isMe && <FollowButton userId={profile.id} username={profile.username} />}
              {isMe && (
                <Link
                  to="/profile"
                  className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 text-sm hover:border-gold-soft"
                >
                  Éditer mon profil
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="mx-auto mt-8 max-w-3xl">
        <div className="mb-5 flex gap-1 border-b border-border">
          <TabBtn active={tab === 'riffs'} onClick={() => setTab('riffs')} icon={<Music2 size={13} />}>
            Riffs <span className="font-mono text-text-soft">{riffs.length}</span>
          </TabBtn>
          <TabBtn active={tab === 'mastered'} onClick={() => setTab('mastered')} icon={<Trophy size={13} />}>
            Maîtrisés
          </TabBtn>
          <TabBtn active={tab === 'bookmarks'} onClick={() => setTab('bookmarks')} icon={<BookmarkCheck size={13} />}>
            Bookmarks
          </TabBtn>
          <TabBtn active={tab === 'badges'} onClick={() => setTab('badges')} icon={<Award size={13} />}>
            Badges <span className="font-mono text-text-soft">{badges.length}</span>
          </TabBtn>
        </div>

        {tab === 'riffs' && (
          <>
            {riffs.length === 0 ? (
              <Card className="text-center">
                <p className="text-sm text-text-muted">
                  {isMe
                    ? "Tu n'as pas encore publié de riff. Va sur le feed et clique '+ Partager mon riff' !"
                    : "Ce riffeur n'a pas encore publié de riff."}
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {riffs.map((r) => (
                  <Link
                    key={r.id}
                    to={`/riffs/${r.id}`}
                    className="block rounded-xl border border-border bg-surface-2 p-4 transition-colors hover:border-gold-soft"
                  >
                    <div className="display truncate text-base text-text">{r.title}</div>
                    {r.artist && (
                      <div className="truncate text-xs text-text-muted">{r.artist}</div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-text-soft">
                      <span className="font-mono text-gold">{r.bpm} BPM</span>
                      <span>·</span>
                      <span className="capitalize">{r.difficulty}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'mastered' && (
          <Card className="text-center">
            <Trophy size={24} className="mx-auto mb-2 text-gold-soft" />
            <p className="text-sm text-text-muted">
              Les riffs maîtrisés restent locaux pour l'instant (Dexie). Le
              partage public arrivera Phase 5.2 sync cloud.
            </p>
          </Card>
        )}

        {tab === 'bookmarks' && (
          <Card className="text-center">
            <BookmarkCheck size={24} className="mx-auto mb-2 text-gold-soft" />
            <p className="text-sm text-text-muted">
              Les bookmarks sont privés. Tu peux les voir sur ton propre
              profil seulement.
            </p>
          </Card>
        )}

        {tab === 'badges' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {BADGE_CATALOG.map((b) => {
              const meta = getBadgeMeta(b.slug);
              const unlocked = badges.includes(b.slug);
              return (
                <div
                  key={b.slug}
                  className={clsx(
                    'flex items-center gap-3 rounded-xl border p-3',
                    unlocked
                      ? 'border-gold/40 bg-gold/8'
                      : 'border-border bg-surface-2 opacity-60'
                  )}
                >
                  <div
                    className={clsx(
                      'flex h-12 w-12 items-center justify-center rounded-full border text-xl',
                      unlocked
                        ? 'border-gold/40 bg-gold/15'
                        : 'border-border bg-surface'
                    )}
                  >
                    {unlocked ? meta?.emoji ?? b.emoji : '🔒'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text">{b.title}</div>
                    <div className="mt-0.5 text-xs text-text-muted">{b.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Niveau riffeur (en bas, simple) */}
      <Card className="mx-auto mt-6 max-w-3xl">
        <div className="mb-2 flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-gold" />
            <span className="display text-sm">Niveau {level.level} · {level.name}</span>
          </div>
          <div className="text-xs text-text-muted">
            {xp} / {level.nextThreshold === Infinity ? '∞' : level.nextThreshold} XP
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-bg">
          <div
            className="h-full bg-gradient-to-r from-gold to-gold-bright transition-all"
            style={{ width: `${Math.min(100, level.progress * 100)}%` }}
          />
        </div>
        {profile.created_at && (
          <div className="mt-3 flex items-center gap-1 text-[10px] text-text-soft">
            <Calendar size={11} /> Inscrit{' '}
            {new Date(profile.created_at).toLocaleDateString('fr-FR', {
              month: 'long',
              year: 'numeric',
            })}
          </div>
        )}
      </Card>
    </>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="inline-flex items-baseline gap-1">
      <span className={clsx('font-mono text-sm font-bold', accent ? 'text-gold' : 'text-text')}>
        {value}
      </span>
      <span>{label}</span>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex h-11 items-center gap-1.5 px-3 text-sm font-semibold transition-colors',
        active
          ? 'border-b-2 border-gold text-text'
          : 'border-b-2 border-transparent text-text-muted hover:text-text'
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
