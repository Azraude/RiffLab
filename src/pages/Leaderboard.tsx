/**
 * /leaderboard — classement des riffs les plus likés (sess 29 Phase 4).
 *
 * Tabs : Cette semaine / Ce mois / All time.
 * Top 100 par likes count.
 * Click sur un riff → /riffs/:id.
 *
 * Note : le brief mentionne 3 catégories side-by-side (likés / joués /
 * maîtrisés). On livre "Plus likés" pour cette phase car c'est la
 * seule métrique cross-user via Supabase. "Joués" / "Maîtrisés" sont
 * locaux Dexie → impossibles à agréger global sans backend dédié. À
 * faire Phase 5.2 sync cloud.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Heart, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import {
  getLeaderboardByLikes,
  type PublicRiff,
  type LeaderboardWindow,
} from '@/lib/socialApi';
import { isSupabaseConfigured } from '@/lib/supabase';

const WINDOW_LABELS: Record<LeaderboardWindow, string> = {
  week: 'Cette semaine',
  month: 'Ce mois',
  all: 'All time',
};

export function Leaderboard() {
  const [window, setWindow] = useState<LeaderboardWindow>('week');
  const [items, setItems] = useState<Array<PublicRiff & { likes_count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    void (async () => {
      const { data } = await getLeaderboardByLikes(window, 100);
      setItems(data ?? []);
      setLoading(false);
    })();
  }, [window]);

  if (!isSupabaseConfigured) {
    return (
      <>
        <PageHeader title="Leaderboard" subtitle="Les riffs qui cartonnent." />
        <Card>
          <p className="text-sm text-text-muted">
            Le leaderboard nécessite Supabase configuré.
          </p>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="🏆 Leaderboard"
        subtitle="Les riffs qui cartonnent — par nombre de likes."
      />

      {/* Tabs */}
      <div className="mb-5 flex gap-2 border-b border-border">
        {(Object.keys(WINDOW_LABELS) as LeaderboardWindow[]).map((w) => (
          <button
            key={w}
            type="button"
            onClick={() => setWindow(w)}
            className={clsx(
              'inline-flex h-11 items-center px-4 text-sm font-semibold transition-colors',
              window === w
                ? 'border-b-2 border-gold text-text'
                : 'border-b-2 border-transparent text-text-muted hover:text-text'
            )}
          >
            {WINDOW_LABELS[w]}
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <p className="text-sm text-text-muted">Chargement…</p>
        </Card>
      ) : items.length === 0 ? (
        <Card className="text-center">
          <Trophy size={32} className="mx-auto text-text-soft" strokeWidth={1.5} />
          <p className="mt-3 text-sm text-text-muted">
            Pas encore de riff classé pour cette période. Les premiers
            publishers seront en haut du classement !
          </p>
        </Card>
      ) : (
        <ol className="space-y-2">
          {items.map((r, i) => (
            <motion.li
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: Math.min(0.3, i * 0.02) }}
            >
              <Link
                to={`/riffs/${r.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 transition-colors hover:border-gold-soft"
              >
                {/* Rank */}
                <div
                  className={clsx(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold',
                    i === 0
                      ? 'border-2 border-gold bg-gold/15 text-gold'
                      : i === 1
                        ? 'border border-text-muted bg-surface text-text-muted'
                        : i === 2
                          ? 'border border-[#cd7f32]/60 bg-[#cd7f32]/10 text-[#cd7f32]'
                          : 'border border-border bg-surface text-text-soft'
                  )}
                >
                  {i + 1}
                </div>

                {/* Riff */}
                <div className="min-w-0 flex-1">
                  <div className="display truncate text-base text-text">{r.title}</div>
                  <div className="truncate text-xs text-text-muted">
                    {r.artist ? `${r.artist} · ` : ''}
                    <span className="capitalize">{r.difficulty}</span>
                    {' · '}
                    <span className="font-mono text-gold">{r.bpm} BPM</span>
                  </div>
                </div>

                {/* Likes count */}
                <div className="shrink-0 text-right">
                  <div className="inline-flex items-center gap-1 font-mono text-sm font-bold text-gold">
                    <Heart size={13} fill="currentColor" />
                    {r.likes_count}
                  </div>
                </div>

                <ChevronRight size={14} className="shrink-0 text-text-soft" />
              </Link>
            </motion.li>
          ))}
        </ol>
      )}
    </>
  );
}
