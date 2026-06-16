/**
 * RiffsSidebarRight — colonne droite "magazine" de /riffs (sess 29).
 *
 * Sticky desktop, drawer top-right tablet/mobile.
 *
 * Contenu :
 *  - Riff du jour (compact, lien Découvrir)
 *  - Top semaine (5 lignes "1. Title · @author · ❤️ N")
 *  - Collections (5 chips)
 *  - À suivre (3-5 user cards)
 *  - Battle de la semaine (mini card + votes + countdown)
 *
 * Quand Supabase pas configuré OU pas de data : sections cachées
 * gracefully (ne pas crash, ne pas montrer "0").
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Library, Users, Swords, ChevronRight, User, Flame } from 'lucide-react';
import { useSocialStreak } from '@/stores/socialStreakStore';
import clsx from 'clsx';
import { COLLECTIONS } from '@/lib/riffCollections';
import { getDailyRiff } from '@/lib/communityRiffs';
import {
  getTopOfWeek,
  getSuggestedRiffeurs,
  getCurrentBattle,
  followUser,
  isFollowing,
  type PublicRiff,
  type Profile,
  type BattleWithRiffs,
} from '@/lib/socialApi';
import { useAuth } from '@/stores/authStore';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { listMasteredRiffs } from '@/lib/db';

export function RiffsSidebarRight() {
  const daily = getDailyRiff();
  const me = useAuth((s) => s.user);
  const masteredRows = useLiveQuery(() => listMasteredRiffs(), []) ?? [];
  const masteredCount = masteredRows.length;
  const currentStreak = useSocialStreak((s) => s.currentStreak);
  const longestStreak = useSocialStreak((s) => s.longestStreak);

  // Live data Supabase (dégrade gracefully si pas configuré)
  const [topWeek, setTopWeek] = useState<Array<PublicRiff & { likes_count: number }>>([]);
  const [suggested, setSuggested] = useState<Profile[]>([]);
  const [battle, setBattle] = useState<BattleWithRiffs | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void (async () => {
      const [top, sug, bat] = await Promise.all([
        getTopOfWeek(5),
        getSuggestedRiffeurs(me?.id ?? null, 3),
        getCurrentBattle(),
      ]);
      setTopWeek(top.data ?? []);
      setSuggested(sug.data ?? []);
      setBattle(bat.data);
    })();
  }, [me?.id]);

  return (
    <aside className="hidden xl:flex xl:flex-col xl:gap-5 xl:sticky xl:top-4 xl:self-start xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto xl:pb-6 xl:pr-1">
      {/* === Riff du jour (compact) === */}
      {daily && (
        <Section icon={<Sparkles size={14} />} title="Riff du jour" accent="gold">
          <Link
            to={`/riffs/${daily.riff.id}`}
            className="block rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-3 transition-colors hover:border-gold-soft"
          >
            <div className="display text-base leading-tight text-text">{daily.tab.name}</div>
            {daily.tab.artist && (
              <div className="mt-0.5 text-[11px] text-text-muted">{daily.tab.artist}</div>
            )}
            <div className="mt-2 flex items-center justify-between text-[10px] text-text-soft">
              <span>{daily.pitch}</span>
              <ChevronRight size={12} className="text-gold" />
            </div>
          </Link>
        </Section>
      )}

      {/* === Top semaine === */}
      {topWeek.length > 0 && (
        <Section icon={<Trophy size={14} />} title="Top de la semaine">
          <ol className="space-y-1.5">
            {topWeek.map((r, i) => (
              <li key={r.id}>
                <Link
                  to={`/riffs/${r.id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
                >
                  <span className="w-4 shrink-0 font-mono text-xs text-text-soft">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-text">{r.title}</div>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-gold">❤️ {r.likes_count}</span>
                </Link>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* === Collections === */}
      <Section icon={<Library size={14} />} title="Collections">
        <ul className="space-y-1">
          {COLLECTIONS.map((c) => (
            <li key={c.slug}>
              <Link
                to={`/riffs/collections/${c.slug}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-surface-2"
              >
                <span className="inline-flex items-center gap-2 truncate text-text-muted">
                  <span className="text-base">{c.emoji}</span>
                  <span className="truncate">{c.title}</span>
                </span>
                <ChevronRight size={12} className="shrink-0 text-text-soft" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {/* === À suivre === */}
      {suggested.length > 0 && (
        <Section icon={<Users size={14} />} title="À suivre">
          <ul className="space-y-2">
            {suggested.map((p) => (
              <SuggestedUserRow key={p.id} profile={p} />
            ))}
          </ul>
        </Section>
      )}

      {/* === Battle === */}
      {battle && battle.riff_a && battle.riff_b && (
        <Section icon={<Swords size={14} />} title="Battle de la semaine">
          <BattleMiniCard battle={battle} />
        </Section>
      )}

      {/* === Streak social (sess 30) === */}
      {currentStreak > 0 && (
        <Section icon={<Flame size={14} />} title="Streak social" accent="gold">
          <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-3">
            <div className="flex items-baseline gap-1.5">
              <span className="display text-3xl text-gold">{currentStreak}</span>
              <span className="text-xs text-text-soft">
                jour{currentStreak > 1 ? 's' : ''} d'affilée
              </span>
            </div>
            {longestStreak > currentStreak && (
              <div className="mt-1 text-[10px] text-text-soft">
                Record perso : <span className="font-mono text-gold">{longestStreak}j</span>
              </div>
            )}
            {currentStreak >= 7 && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[9px] font-bold text-gold">
                🔥 Badge Streak 7j débloqué
              </div>
            )}
          </div>
        </Section>
      )}

      {/* === Toi (compact) === */}
      {me && (
        <Section icon={<User size={14} />} title="Toi">
          <Link
            to="/profile"
            className="block rounded-xl border border-border bg-surface-2 p-3 hover:border-gold-soft"
          >
            <div className="text-xs text-text-muted">
              <span className="font-mono text-gold">{masteredCount}</span> riff
              {masteredCount > 1 ? 's' : ''} maîtrisé{masteredCount > 1 ? 's' : ''}
            </div>
            <div className="mt-1 text-[10px] text-text-soft">Profil & stats →</div>
          </Link>
        </Section>
      )}
    </aside>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function Section({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  accent?: 'gold';
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-border bg-surface p-3"
    >
      <div
        className={clsx(
          'mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider',
          accent === 'gold' ? 'text-gold' : 'text-text-soft'
        )}
      >
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </motion.section>
  );
}

function SuggestedUserRow({ profile }: { profile: Profile }) {
  const me = useAuth((s) => s.user);
  const toast = useToast();
  const [following, setFollowing] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => setFollowing(await isFollowing(profile.id)))();
  }, [profile.id]);

  const handleFollow = async () => {
    if (!me) {
      toast.warning('Connecte-toi pour suivre');
      return;
    }
    setFollowing(true); // optimistic
    const { error } = await followUser(profile.id);
    if (error) {
      setFollowing(false);
      toast.error(error.message);
    } else {
      toast.success(`Tu suis @${profile.username}`);
    }
  };

  const initial = (profile.username[0] ?? '?').toUpperCase();

  return (
    <li className="flex items-center gap-2">
      <Link
        to={`/u/${profile.username}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-gold/10 font-mono text-xs font-bold text-gold"
      >
        {profile.avatar_url ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          initial
        )}
      </Link>
      <Link to={`/u/${profile.username}`} className="min-w-0 flex-1">
        <div className="truncate text-xs font-semibold text-text">
          {profile.display_name || profile.username}
        </div>
        <div className="truncate text-[10px] text-text-soft">@{profile.username}</div>
      </Link>
      {!following && (
        <button
          type="button"
          onClick={() => void handleFollow()}
          className="shrink-0 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[10px] font-bold text-gold hover:bg-gold/20"
        >
          Suivre
        </button>
      )}
      {following && (
        <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-1 text-[10px] text-text-muted">
          Suivi
        </span>
      )}
    </li>
  );
}

function BattleMiniCard({ battle }: { battle: BattleWithRiffs }) {
  const totalVotes = battle.votes_a + battle.votes_b;
  const pctA = totalVotes > 0 ? Math.round((battle.votes_a / totalVotes) * 100) : 50;
  const pctB = 100 - pctA;
  const endsIn = useMemo(() => {
    const ms = new Date(battle.ends_at).getTime() - Date.now();
    if (ms <= 0) return 'Terminé';
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
  }, [battle.ends_at]);

  return (
    <Link to="/battle" className="block rounded-xl border border-border bg-surface-2 p-3 hover:border-gold-soft">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="truncate font-semibold text-text">{battle.riff_a?.title ?? '...'}</div>
        <div className="truncate text-right font-semibold text-text">
          {battle.riff_b?.title ?? '...'}
        </div>
      </div>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-bg">
        <div
          className="bg-gradient-to-r from-gold to-gold-bright"
          style={{ width: `${pctA}%` }}
        />
        <div className="bg-gradient-to-r from-danger to-[#e8a04b]" style={{ width: `${pctB}%` }} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px]">
        <span className="font-mono text-gold">{pctA}%</span>
        <span className="text-text-soft">⏱ {endsIn}</span>
        <span className="font-mono text-danger">{pctB}%</span>
      </div>
    </Link>
  );
}
