/**
 * CommunityRiffCard — widget Dashboard minimal pointant vers /riffs.
 *
 * Session 21 refonte : la page /riffs est devenue le feed social complet.
 * Ce widget Dashboard est maintenant juste un teaser — affiche le riff
 * de la semaine + un lien "Voir tous les riffs". Tap card = ouvre
 * directement le riff dans /riffs (drawer auto-opens).
 *
 * Les likes restent ici pour réagir vite sans quitter le Dashboard.
 */
import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, Sparkles, User } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { getCurrentCommunityRiff } from '@/lib/communityRiffs';
import { isRiffLiked, toggleRiffLike } from '@/lib/db';
import { getCurrentISOWeek } from '@/lib/riffOfTheWeek';

export function CommunityRiffCard() {
  const current = useMemo(() => getCurrentCommunityRiff(), []);
  const liked = useLiveQuery(
    () => (current ? isRiffLiked(current.riff.id) : Promise.resolve(false)),
    [current?.riff.id]
  );
  const week = useMemo(() => getCurrentISOWeek(), []);

  if (!current) return null;
  const { riff, tab } = current;
  const totalLikes = riff.baseLikes + (liked ? 1 : 0);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleRiffLike(riff.id);
  };

  const initial = (riff.contributor.replace('@', '')[0] ?? '?').toUpperCase();

  return (
    <Link
      to="/riffs"
      className="block transition-transform hover:-translate-y-px"
      aria-label={`Voir le riff de la semaine : ${tab.name}`}
    >
      <Card className="overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles size={13} className="text-gold-soft" />
            <div className="eyebrow !text-gold-soft">Riff de la semaine · S{week}</div>
          </div>
          <span className="inline-flex h-7 items-center gap-1 rounded-full bg-gold/10 px-2.5 text-[10px] font-semibold text-gold-bright">
            Voir tous les riffs <ArrowRight size={11} />
          </span>
        </div>

        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-base font-bold text-gold">
            {initial === '?' ? <User size={20} /> : initial}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="display text-display-sm leading-tight">
              {tab.name}
            </h2>
            {tab.artist && (
              <p className="text-sm text-text-muted">{tab.artist}</p>
            )}
            <div className="mt-1 flex items-center gap-2 text-xs text-text-soft">
              <span className="font-mono text-gold-soft">{riff.contributor}</span>
              <span>·</span>
              <span>{'⭐'.repeat(riff.difficulty)}</span>
              <span>·</span>
              <span className="font-mono">{tab.tempo} BPM</span>
            </div>
          </div>
        </div>

        {riff.caption && (
          <p className="mt-3 line-clamp-2 text-sm text-text leading-relaxed">
            {riff.caption}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={handleLike}
            aria-pressed={!!liked}
            className={clsx(
              'inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
              liked
                ? 'bg-danger/15 text-danger'
                : 'bg-surface-2 text-text-muted hover:bg-danger/10 hover:text-danger'
            )}
          >
            <motion.span
              animate={liked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex"
            >
              <Heart size={13} fill={liked ? 'currentColor' : 'none'} />
            </motion.span>
            <span className="font-mono">{totalLikes}</span>
          </button>
          <span className="font-mono text-xs text-text-soft">
            {riff.commentsCount ?? 0} commentaires
          </span>
        </div>
      </Card>
    </Link>
  );
}
