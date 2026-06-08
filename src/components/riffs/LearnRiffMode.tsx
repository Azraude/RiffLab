/**
 * LearnRiffMode — overlay focus plein écran pour apprendre un riff
 * (sess 27 Phase 2).
 *
 * Activée depuis le bouton "Apprendre" d'une RiffCard ou de la page
 * détail. Affiche :
 *  - Background sombre, distractions zéro
 *  - RiffPlayer géant avec loop activé par défaut
 *  - Compteur géant "Tu l'as joué Nx" (typo serif large)
 *  - Bouton "✓ Je le maîtrise" → save Dexie + confetti + toast
 *  - Bouton "Quitter" top-right
 *
 * Au unmount, le player s'arrête. Au quit avec un riff déjà marqué
 * maîtrisé, on ne re-save pas (no-op du markRiffMastered).
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Check, Trophy } from 'lucide-react';
import type { CommunityRiff } from '@/lib/communityRiffs';
import type { Tab } from '@/lib/tabsDatabase';
import { checkAndUnlockBadges, isRiffMastered, markRiffMastered } from '@/lib/db';
import { getBadgeMeta } from '@/lib/badges';
import { RiffPlayer } from './RiffPlayer';
import { Confetti } from '@/components/ui/Confetti';
import { useToast } from '@/hooks/useToast';

interface LearnRiffModeProps {
  open: boolean;
  onClose: () => void;
  riff: CommunityRiff | null;
  tab: Tab | null;
}

export function LearnRiffMode({ open, onClose, riff, tab }: LearnRiffModeProps) {
  const [playCount, setPlayCount] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
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

  const handleMaster = async () => {
    if (!riff) return;
    await markRiffMastered(riff.id, playCount);
    setConfettiTrigger((t) => t + 1);
    toast.success(`🏆 ${tab?.name ?? 'Riff'} maîtrisé !`);
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
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:border-danger/40 hover:text-danger"
            >
              <X size={18} />
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

              {/* Player synchronisé en loop */}
              <RiffPlayer
                tab={tab}
                autoLoop
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
                    className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-gold-bright to-gold px-8 text-base font-bold text-bg shadow-gold-strong transition-all hover:-translate-y-px"
                  >
                    <Check size={18} strokeWidth={3} />
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
