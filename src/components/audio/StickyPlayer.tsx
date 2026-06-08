/**
 * StickyPlayer — mini-player flottant en bas de l'écran qui suit
 * l'utilisateur quand il change de page.
 *
 * STATUT (session 25) : MONTÉ MAIS PAS BRANCHÉ.
 * `usePlayer.source` reste null tant qu'aucune source d'audio ne
 * pousse via `setSource()`. Donc le composant ne rend rien → zéro
 * régression sur l'audio existant.
 *
 * Sources à brancher (1 commit par source dans une future session) :
 *  - TabPlayer.tsx (Riffs feed → drawer)
 *  - Composer playProgression()
 *  - Progressions preview
 *  - RecorderSection playback
 *  - DailyChallengeCard preview
 *
 * Layout :
 *  - Mobile : fullwidth bar au-dessus du MobileNav 72px (safe-area aware)
 *  - Desktop : bar 480px centrée bottom, ou collapse en pill compact
 *
 * Anim entrée/sortie spring depuis le bas, layoutId pour smooth track
 * changes.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Pause, Play, X, Music2, Mic, Sparkles, Disc3, ListMusic } from 'lucide-react';
import { usePlayer, type AudioSourceType } from '@/stores/playerStore';

const TYPE_ICONS: Record<AudioSourceType, typeof Music2> = {
  riff: Disc3,
  song: Music2,
  progression: Sparkles,
  recording: Mic,
  preview: ListMusic,
};

export function StickyPlayer() {
  const source = usePlayer((s) => s.source);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const positionMs = usePlayer((s) => s.positionMs);
  const setIsPlaying = usePlayer((s) => s.setIsPlaying);
  const clear = usePlayer((s) => s.clear);

  const handleToggle = () => {
    if (!source) return;
    if (isPlaying) {
      setIsPlaying(false);
      void source.onPause?.();
    } else {
      setIsPlaying(true);
      void source.onPlay?.();
    }
  };

  const Icon = source ? TYPE_ICONS[source.type] : Music2;
  const progress =
    source?.durationMs && source.durationMs > 0
      ? Math.min(1, positionMs / source.durationMs)
      : 0;

  return (
    <AnimatePresence>
      {source && (
        <motion.div
          layout
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          role="region"
          aria-label="Lecteur audio en cours"
          className="fixed left-1/2 z-30 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border-gold bg-surface/95 shadow-2xl backdrop-blur-xl"
          style={{
            // Sit above MobileNav (72px) + safe-area + FeedbackButton margin
            bottom: 'calc(72px + env(safe-area-inset-bottom) + 12px)',
          }}
        >
          {/* Progress bar — sliver gold sur le top */}
          {source.durationMs ? (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-border">
              <div
                className="h-full bg-gradient-to-r from-gold to-gold-bright transition-[width] duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          ) : null}

          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              <Icon size={18} />
            </div>

            <div className="min-w-0 flex-1">
              {source.href ? (
                <Link
                  to={source.href}
                  className="block truncate text-sm font-semibold text-text hover:text-gold"
                  title={source.title}
                >
                  {source.title}
                </Link>
              ) : (
                <div className="truncate text-sm font-semibold text-text" title={source.title}>
                  {source.title}
                </div>
              )}
              {source.subtitle && (
                <div className="truncate text-[11px] text-text-soft">{source.subtitle}</div>
              )}
            </div>

            <button
              type="button"
              onClick={handleToggle}
              aria-label={isPlaying ? 'Pause' : 'Lecture'}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-bg shadow-gold transition-transform hover:-translate-y-px active:scale-95"
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" />
              )}
            </button>

            <button
              type="button"
              onClick={clear}
              aria-label="Arrêter et fermer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-soft hover:bg-surface-2 hover:text-text"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
