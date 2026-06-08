/**
 * RiffTabModal — modal/sheet "Voir le tab" propre (sess 27 Phase 1.6).
 *
 * Fix du bug actuel : avant le tab affiché en modal scrollait verticalement
 * → moche. Maintenant : hauteur fixe (6 lignes EBGDAE), scroll horizontal
 * pur, indicateur "swipe →" visible si tab dépasse.
 *
 * - Mobile : full-screen sheet bas vers haut
 * - Desktop : modal max-w-5xl centré
 * - Footer sticky : 3 boutons d'action
 */
import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Play, Target, Share2, ChevronRight } from 'lucide-react';
import { TabReader } from '@/components/tabs/TabReader';
import type { CommunityRiff } from '@/lib/communityRiffs';
import type { Tab } from '@/lib/tabsDatabase';
import clsx from 'clsx';

interface RiffTabModalProps {
  open: boolean;
  onClose: () => void;
  riff: CommunityRiff | null;
  tab: Tab | null;
  onListen?: () => void;
  onLearn?: () => void;
  onShare?: () => void;
}

export function RiffTabModal({
  open,
  onClose,
  riff,
  tab,
  onListen,
  onLearn,
  onShare,
}: RiffTabModalProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Détecte si le tab dépasse → affiche l'indicateur "swipe"
  useEffect(() => {
    if (!open || !tab) return;
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setHasOverflow(el.scrollWidth > el.clientWidth + 8);
    };
    check();
    const onScroll = () => setScrolled(el.scrollLeft > 16);
    el.addEventListener('scroll', onScroll);
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', check);
    };
  }, [open, tab]);

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && riff && tab && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              aria-describedby={undefined}
              className="outline-none"
            >
              <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
                <motion.div
                  className="flex h-[92dvh] w-full flex-col rounded-t-3xl border-t border-border bg-surface shadow-2xl md:h-auto md:max-h-[88vh] md:max-w-5xl md:rounded-3xl md:border"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                  style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                  {/* Header */}
                  <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 md:px-7">
                    <div className="min-w-0 flex-1">
                      <Dialog.Title className="display text-display-sm truncate">
                        {tab.name}
                      </Dialog.Title>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-muted">
                        {tab.artist && <span>{tab.artist}</span>}
                        <span className="font-mono text-gold">{tab.tempo} BPM</span>
                        <span>·</span>
                        <span>{tab.key}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Fermer"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-text-muted hover:border-gold-soft hover:text-text"
                    >
                      <X size={16} />
                    </button>
                  </header>

                  {/* Body : tab scroll horizontal pur, hauteur fixe */}
                  <div className="relative flex-1 overflow-hidden bg-bg/40 px-3 py-4 md:px-5">
                    {/* Player placeholder pour Phase 2 */}
                    <div className="mb-3 rounded-xl border border-border bg-surface px-4 py-3 text-center text-xs text-text-muted">
                      🎵 Player synchronisé arrive en Phase 2 — pour l'instant clique « Écouter » pour la lecture audio.
                    </div>

                    {/* Tab : hauteur fixe naturelle du SVG (6 strings × 18px),
                        scroll horizontal smooth via overflow-x-auto, blocage
                        vertical via overflow-y-hidden + max-h. */}
                    <div
                      ref={scrollRef}
                      className="relative max-h-[calc(100%-3.5rem)] overflow-x-auto overflow-y-hidden rounded-xl border border-border bg-surface-2 px-3 py-4 [scrollbar-width:thin]"
                    >
                      <TabReader tab={tab} lineHeight={22} beatWidth={20} />
                    </div>

                    {/* Indicateur "swipe →" si overflow et pas encore scrollé */}
                    {hasOverflow && !scrolled && (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute bottom-6 right-6 z-10 flex items-center gap-1 rounded-full border border-gold/40 bg-bg/90 px-3 py-1.5 text-xs text-gold backdrop-blur-md"
                      >
                        <span>swipe</span>
                        <ChevronRight size={14} className="animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Footer sticky : 3 boutons d'action */}
                  <footer className="grid shrink-0 grid-cols-3 gap-2 border-t border-border bg-surface px-3 py-3 md:gap-3 md:px-5 md:py-4">
                    <ActionBtn
                      onClick={onListen}
                      icon={<Play size={16} fill="currentColor" />}
                      label="Écouter"
                    />
                    <ActionBtn
                      onClick={onLearn}
                      icon={<Target size={16} />}
                      label="Apprendre"
                      highlight
                    />
                    <ActionBtn
                      onClick={onShare}
                      icon={<Share2 size={16} />}
                      label="Partager"
                    />
                  </footer>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function ActionBtn({
  onClick,
  icon,
  label,
  highlight = false,
}: {
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-all',
        highlight
          ? 'bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold hover:-translate-y-px'
          : 'border border-border bg-surface-2 text-text hover:border-gold-soft'
      )}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}
