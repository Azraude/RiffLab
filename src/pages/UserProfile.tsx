/**
 * /u/:username — page profil public d'un riffeur.
 *
 * Sess 29 : version originale 4 tabs avec hero simple.
 * Sess PROFIL : refonte hero avec cover photo + bio + instruments +
 * social links via ProfileHero + drawer édition ProfileEditDrawer.
 * 3 tabs au lieu de 4 (Riffs / Progressions / Badges).
 *
 * Si pas connecté ou pas configuré Supabase : message dégradé.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Zap, Music2, Award, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { ProfileHero, type FullProfile } from '@/components/profile/ProfileHero';
import { ProfileEditDrawer } from '@/components/profile/ProfileEditDrawer';
import {
  getProfile,
  getUserRiffs,
  getFollowCounts,
  getUserXP,
  getUserBadges,
  type PublicRiff,
} from '@/lib/socialApi';
import { computeLevel } from '@/lib/xpSystem';
import { BADGE_CATALOG, getBadgeMeta } from '@/lib/badges';
import { useAuth } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';

type Tab = 'riffs' | 'progressions' | 'badges';

export function UserProfile() {
  const { username } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const me = useAuth((s) => s.user);
  const [profile, setProfile] = useState<FullProfile | null | undefined>(undefined);
  const [riffs, setRiffs] = useState<PublicRiff[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [xp, setXp] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [tab, setTab] = useState<Tab>('riffs');
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!username) return;
    void (async () => {
      const { data } = await getProfile(username);
      setProfile(data as FullProfile | null);
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

  // Auto-open drawer si ?edit=1 dans l'URL (entry point depuis /profile)
  useEffect(() => {
    if (profile && searchParams.get('edit') === '1' && me?.id === profile.id) {
      setEditOpen(true);
      // Cleanup search param pour pas relancer au reload
      setSearchParams((sp) => {
        sp.delete('edit');
        return sp;
      });
    }
  }, [profile, searchParams, setSearchParams, me?.id]);

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

  // Pas trouvé → écran "Profil introuvable" GRACIEUX (plus de redirect
  // silencieux vers /riffs qui frustrait l'user qui ne comprenait pas).
  // Cas courant : seeds Dexie locaux (@whiteguy, @axl_rose…) qui n'ont
  // pas de row dans la table profiles Supabase.
  if (!profile) {
    return (
      <>
        <Link
          to="/riffs"
          className="mb-4 inline-flex items-center gap-1 text-sm text-text-soft hover:text-gold"
        >
          <ArrowLeft size={14} /> Feed des riffs
        </Link>
        <div className="mx-auto max-w-md py-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface">
            <span className="display text-2xl text-text-muted">?</span>
          </div>
          <h2 className="display mb-3 text-xl">Profil introuvable</h2>
          <p className="mb-6 text-sm leading-relaxed text-text-muted">
            Ce profil n'existe pas encore — soit l'username est mal écrit,
            soit ce riffeur est un contributeur de la bibliothèque d'exemples
            qui n'a pas (encore) de compte RiffLab public.
          </p>
          <Link
            to="/riffs"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border-gold bg-surface px-5 text-sm text-text hover:bg-gold/5"
          >
            ← Retour au feed
          </Link>
        </div>
      </>
    );
  }

  const isMe = me?.id === profile.id;

  return (
    <>
      <Link to="/riffs" className="mb-4 inline-flex items-center gap-1 text-sm text-text-soft hover:text-gold">
        <ArrowLeft size={14} /> Feed des riffs
      </Link>

      <div className="mx-auto max-w-3xl">
        <ProfileHero
          profile={profile}
          isMe={isMe}
          onEdit={() => setEditOpen(true)}
        />

        {/* Stats grid compact */}
        <div className="mt-2 grid grid-cols-3 gap-2 px-5 md:px-6">
          <StatCell label="Riffs" value={riffs.length} />
          <StatCell label="Followers" value={counts.followers} />
          <StatCell label="Following" value={counts.following} />
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto mt-6 max-w-3xl">
        <div className="-mx-2 mb-5 flex gap-1 overflow-x-auto border-b border-border px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabBtn active={tab === 'riffs'} onClick={() => setTab('riffs')} icon={<Music2 size={13} />}>
            Riffs <span className="font-mono text-text-soft">{riffs.length}</span>
          </TabBtn>
          <TabBtn active={tab === 'progressions'} onClick={() => setTab('progressions')} icon={<Sparkles size={13} />}>
            Progressions
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

        {tab === 'progressions' && (
          <Card className="text-center">
            <Sparkles size={24} className="mx-auto mb-2 text-gold-soft" />
            <p className="text-sm text-text-muted">
              Les progressions publiées arrivent prochainement (backend
              custom_progressions). En attendant : Studio dans la sidebar.
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

      {/* Drawer édition (uniquement si c'est mon profil) */}
      {isMe && (
        <ProfileEditDrawer
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          onSaved={(next) => setProfile(next)}
        />
      )}
    </>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function StatCell({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-center">
      <div className="font-mono text-lg font-bold text-gold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-text-soft">{label}</div>
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
