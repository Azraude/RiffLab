/**
 * LearnRiffMode — overlay focus plein écran pour apprendre un riff.
 *
 * Sess 27 P2 : base overlay + RiffPlayer loop + compteur + bouton master.
 * Sess B P3 :
 *  - Wake Lock API : l'écran reste allumé tant que le mode est ouvert
 *    (chrome/edge/safari iOS 16.4+ ; firefox = no-op silencieux)
 *  - Tap targets ≥56px sur les boutons primaires (close, master)
 *  - hideStickyBar passé au RiffPlayer (pas de mini-player en overlay)
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Check, Trophy } from 'lucide-react';
import type { CommunityRiff } from '@/lib/communityRiffs';
import type { Tab } from '@/lib/tabsDatabase';
import { checkAndUnlockBadges, isRiffMastered, markRiffMastered } from '@/lib/db';
import { getBadgeMeta } from '@/lib/badges';
import { useSocialStreak } from '@/stores/socialStreakStore';
import { RiffPlayer } from './RiffPlayer';
import { Confetti } from '@/components/ui/Confetti';
import { useToast } from '@/hooks/useToast';

interface LearnRiffModeProps {
  open: boolean;
  onClose: () => void;
  riff: CommunityRiff | null;
  tab: Tab | null;
}

// Screen Wake Lock API (chrome/edge/safari ; firefox no-op)
type WakeLockSentinel = { release: () => Promise<void>; released: boolean };
type WakeLockNav = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinel> } };

export function LearnRiffMode({ open, onClose, riff, tab }: LearnRiffModeProps) {
  const [playCount, setPlayCount] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const toast = useToast();

  const masteredRow = useLiveQuery(
    () => (riff ? isRiffMastered(riff.id) : Promise.resolve(undefined)),
    [riff?.id]
  );
  const alreadyMastered = !!masteredRow;

  // Reset le compteur quand on ouvre un nouveau riff
  useEffect(() => {
    if (open && riff) setPlayCount(0);
  }, [open, riff?.id]);

  // ESC pour fermer
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Lock body scroll quand l'overlay est ouvert
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  /**
   * Screen Wake Lock pendant le mode Apprendre (smartphone sur stand,
   * répèt, on veut pas que l'écran s'éteigne). Re-request si l'app
   * passe en background puis revient au foreground (visibilitychange).
   * Silent no-op si pas supporté (firefox, vieux safari).
   */
  useEffect(() => {
    if (!open) return;
    const nav = navigator as WakeLockNav;
    if (!nav.wakeLock) return;
    let cancelled = false;

    const acquire = async () => {
      try {
        const sentinel = await nav.wakeLock!.request('screen');
        if (cancelled) {
          void sentinel.release();
          return;
        }
        wakeLockRef.current = sentinel;
      } catch {
        // Permission denied / Tab not visible
      }
    };
    void acquire();

    const onVis = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current?.released) {
        // Réacquérir si on revient au foreground (sentinel relâché auto)
        void acquire();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      const sentinel = wakeLockRef.current;
      wakeLockRef.current = null;
      if (sentinel && !sentinel.released) void sentinel.release();
    };
  }, [open]);

  const handleMaster = async () => {
    if (!riff) return;
    await markRiffMastered(riff.id, playCount);
    setConfettiTrigger((t) => t + 1);
    toast.success(`🏆 ${tab?.name ?? 'Riff'} maîtrisé !`);
    // Record streak social activity (sess 30)
    useSocialStreak.getState().recordActivity();
    // Check les badges qui débloquent suite à un nouveau mastery
    const newBadges = await checkAndUnlockBadges();
    for (const slug of newBadges) {
      const meta = getBadgeMeta(slug);
      if (meta) {
        toast.success(`${meta.emoji} Badge débloqué : ${meta.title}`, { duration: 6000 });
      }
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && riff && tab && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex flex-col bg-bg/98 backdrop-blur-md"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {/* === Top bar === */}
          <header className="flex shrink-0 items-center justify-between border-b border-border/60 bg-bg/80 px-5 py-3 md:px-10">
            <div>
              <div className="eyebrow flex items-center gap-1.5">
                <Trophy size={11} className="text-gold-soft" /> Mode apprendre
              </div>
              <h1 className="display mt-0.5 text-display-sm leading-tight md:text-display-md">
                {tab.name}
              </h1>
              {tab.artist && (
                <p className="text-xs text-text-muted md:text-sm">{tab.artist}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Quitter le mode apprendre"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:border-danger/40 hover:text-danger active:scale-95"
            >
              <X size={20} />
            </button>
          </header>

          {/* === Body === */}
          <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-6 md:px-10 md:py-8">
            <div className="w-full max-w-4xl space-y-6">
              {/* Compteur géant */}
              <div className="text-center">
                <div className="eyebrow">Tu l'as joué</div>
                <motion.div
                  key={playCount}
                  initial={{ scale: 0.95, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="display mt-1 text-7xl text-gold md:text-8xl"
                  style={{ filter: 'drop-shadow(0 0 20px rgb(var(--gold-glow) / 0.4))' }}
                >
                  {playCount}
                  <span className="text-display-md text-text-soft">×</span>
                </motion.div>
                <p className="mt-2 text-xs text-text-muted">
                  Loop activé — chaque cycle compte automatiquement.
                </p>
              </div>

              {/* Player synchronisé en loop (pas de sticky bar : on est
                  déjà en overlay full-screen) */}
              <RiffPlayer
                tab={tab}
                autoLoop
                hideStickyBar
                onPlayCountChange={(n) => setPlayCount(n)}
              />

              {/* Bouton "Je le maîtrise" */}
              <div className="flex flex-col items-center gap-3">
                {alreadyMastered ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-gold bg-gold/15 px-4 py-2 text-sm font-bold text-gold">
                    <Trophy size={16} />
                    Maîtrisé le{' '}
                    {new Date(masteredRow.masteredAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleMaster()}
                    className="inline-flex h-14 min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-gold-bright to-gold px-8 text-base font-bold text-bg shadow-gold-strong transition-all hover:-translate-y-px active:scale-[0.99]"
                  >
                    <Check size={20} strokeWidth={3} />
                    Je le maîtrise
                  </button>
                )}
                <p className="max-w-md text-center text-xs text-text-soft">
                  {alreadyMastered
                    ? "Tu peux relancer la lecture pour entretenir. Quitte quand tu veux."
                    : "Une fois marqué maîtrisé, ton riff aura un badge 🏆 visible dans le feed."}
                </p>
              </div>
            </div>
          </div>

          {/* Confetti overlay — déclenché par incrément du trigger */}
          <Confetti trigger={confettiTrigger} count={60} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
