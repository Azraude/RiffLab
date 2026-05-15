/**
 * CommunityRiffCard — widget Dashboard pour le riff hebdomadaire
 * communautaire. Affiche le tab via TabPlayer, le contributeur,
 * un bouton like persisté en Dexie, et un bouton "Partager mon riff"
 * (modal "Bientôt Phase 5" pour l'instant).
 */
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Sparkles, Upload, X } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { TabPlayer } from '@/components/tabs/TabPlayer';
import { getCurrentCommunityRiff } from '@/lib/communityRiffs';
import { isRiffLiked, toggleRiffLike } from '@/lib/db';
import { getCurrentISOWeek } from '@/lib/riffOfTheWeek';

export function CommunityRiffCard() {
  const current = useMemo(() => getCurrentCommunityRiff(), []);
  const liked = useLiveQuery(
    () => (current ? isRiffLiked(current.riff.id) : Promise.resolve(false)),
    [current?.riff.id]
  );
  const [shareOpen, setShareOpen] = useState(false);
  const week = useMemo(() => getCurrentISOWeek(), []);

  if (!current) return null;
  const { riff, tab } = current;
  const totalLikes = riff.baseLikes + (liked ? 1 : 0);

  const handleLike = async () => {
    await toggleRiffLike(riff.id);
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="eyebrow !text-gold-soft">Riff du moment · Semaine {week}</div>
            <h2 className="display mt-1.5 text-display-sm">
              ⭐ {tab.name}
              {tab.artist && (
                <span className="ml-1 font-sans text-base font-normal text-text-muted">
                  — {tab.artist}
                </span>
              )}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-xs text-text-soft">
              <span className="font-mono text-gold-soft">{riff.contributor}</span>
              <span>·</span>
              <button
                type="button"
                onClick={handleLike}
                aria-pressed={!!liked}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-xs transition-all',
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
                  <Heart size={11} fill={liked ? 'currentColor' : 'none'} />
                </motion.span>
                {totalLikes}
              </button>
            </div>
          </div>
        </div>

        {/* Tab player */}
        <div className="mt-5">
          <TabPlayer tab={tab} loop={false} />
        </div>

        {/* Divider + share CTA */}
        <div className="my-5 h-px bg-gradient-to-r from-transparent via-gold-soft/40 to-transparent" />
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-gold bg-gold/5 text-sm font-semibold text-text transition-all hover:bg-gold/10"
        >
          <Upload size={15} className="transition-transform group-hover:-translate-y-px" />
          Partager mon riff
        </button>
      </Card>

      {/* Share modal — placeholder Phase 5 */}
      <Dialog.Root open={shareOpen} onOpenChange={setShareOpen}>
        <AnimatePresence>
          {shareOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild aria-describedby={undefined}>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                  <motion.div
                    className="w-[min(420px,92vw)] rounded-3xl border border-border-gold bg-surface p-7 shadow-2xl"
                    initial={{ opacity: 0, scale: 0.94, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 12 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  >
                    <button
                      type="button"
                      onClick={() => setShareOpen(false)}
                      aria-label="Fermer"
                      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
                    >
                      <X size={16} />
                    </button>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-gold bg-gold/10 text-gold">
                      <Sparkles size={22} />
                    </div>
                    <Dialog.Title className="display mt-4 text-display-sm">
                      Bientôt disponible — Phase 5
                    </Dialog.Title>
                    <p className="mt-2 text-sm text-text-muted">
                      La communauté arrive avec la Phase 5 (auth + cloud). Tu pourras
                      uploader tes propres riffs avec une tab + un audio, et liker
                      ceux des autres guitaristes.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShareOpen(false)}
                      className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-b from-gold-bright to-gold font-semibold text-bg hover:-translate-y-px"
                    >
                      OK, j'attendrai
                    </button>
                  </motion.div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </>
  );
}
