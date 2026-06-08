/**
 * BadgesStrip — affichage des badges unlock + progression.
 * Placé en haut de /riffs (sess 27 Phase 5 gamif).
 *
 * Compact : ligne horizontale avec les badges unlock + total "X/Y".
 * Click sur le strip → ouvre un modal avec tous les badges + détails.
 */
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import clsx from 'clsx';
import { listUserBadges } from '@/lib/db';
import { BADGE_CATALOG, getBadgeMeta } from '@/lib/badges';

export function BadgesStrip() {
  const [open, setOpen] = useState(false);
  const unlockedRows = useLiveQuery(() => listUserBadges(), []) ?? [];
  const unlockedSlugs = new Set(unlockedRows.map((b) => b.slug));
  const unlockedCount = unlockedRows.length;
  const totalCount = BADGE_CATALOG.length;

  // Si zéro badge → on cache (pas d'effet "vide moche")
  if (unlockedCount === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-between rounded-2xl border border-border bg-surface-2 px-4 py-3 text-left transition-colors hover:border-gold-soft"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-lg">
            🏆
          </div>
          <div>
            <div className="label-small">Tes badges</div>
            <div className="mt-0.5 flex items-center gap-1">
              {unlockedRows.slice(0, 5).map((b) => {
                const meta = getBadgeMeta(b.slug);
                if (!meta) return null;
                return (
                  <span key={b.slug} className="text-base" title={meta.title}>
                    {meta.emoji}
                  </span>
                );
              })}
              {unlockedCount > 5 && (
                <span className="ml-1 text-[10px] font-mono text-text-soft">
                  +{unlockedCount - 5}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm font-bold text-gold">
            {unlockedCount}
            <span className="text-text-soft">/{totalCount}</span>
          </div>
          <div className="text-[10px] text-text-soft">débloqués</div>
        </div>
      </button>

      {/* Modal détaillé */}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <AnimatePresence>
          {open && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild aria-describedby={undefined}>
                <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
                  <motion.div
                    className="max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface shadow-2xl md:max-w-md md:rounded-3xl md:border"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                  >
                    <header className="flex items-center justify-between border-b border-border px-5 py-4">
                      <Dialog.Title className="display text-display-sm flex items-center gap-2">
                        <Trophy size={18} className="text-gold" /> Tes badges
                      </Dialog.Title>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:border-gold-soft hover:text-text"
                      >
                        <X size={16} />
                      </button>
                    </header>
                    <div className="space-y-2 p-5">
                      {BADGE_CATALOG.map((b) => {
                        const unlocked = unlockedSlugs.has(b.slug);
                        return (
                          <div
                            key={b.slug}
                            className={clsx(
                              'flex items-center gap-3 rounded-xl border px-3 py-3',
                              unlocked
                                ? 'border-gold/40 bg-gold/8'
                                : 'border-border bg-surface-2 opacity-60'
                            )}
                          >
                            <div
                              className={clsx(
                                'flex h-12 w-12 items-center justify-center rounded-full border text-2xl',
                                unlocked
                                  ? 'border-gold/40 bg-gold/15'
                                  : 'border-border bg-surface'
                              )}
                            >
                              {unlocked ? b.emoji : '🔒'}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-text">{b.title}</div>
                              <div className="mt-0.5 text-xs text-text-muted">
                                {b.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
