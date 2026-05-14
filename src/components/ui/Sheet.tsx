/**
 * Sheet — modal Radix Dialog avec rendu adaptatif :
 *  - Desktop (>md) : modal centré (max-w 640), backdrop blur, ESC + clic
 *    overlay pour fermer.
 *  - Mobile  (≤md) : bottom sheet qui slide depuis le bas avec
 *    drag-to-dismiss (drag y > 120 ou velocity > 500).
 *
 * Pattern canonique Radix :
 *  - Overlay = full-screen backdrop, click handler natif Radix (close).
 *  - Content = la modal box elle-même (positionnée, animée), PAS de
 *    wrapper englobant tout l'écran. C'est l'overlay qui détecte les
 *    clics outside, pas un wrapper.
 *
 * Bugs précédemment fixés :
 *  - Modal desktop apparaissait en bas-droite : les `-translate-x-1/2
 *    -translate-y-1/2` Tailwind étaient écrasés par `transform` injecté
 *    par Framer Motion. Solution : centrage géré par Framer aussi (style
 *    x: '-50%', y: '-50%').
 *  - Click sur input fermait le modal : le wrapper `pointer-events-none
 *    fixed inset-0 flex` que j'avais utilisé pour centrer interférait
 *    avec la détection click-outside de Radix sur certains navigateurs.
 *    Retiré au profit du pattern canonique.
 */

import { forwardRef, useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import clsx from 'clsx';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Sheet({ open, onOpenChange, title, description, children, className }: SheetProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>

            {isMobile ? (
              <Dialog.Content asChild aria-describedby={undefined}>
                <MobileSheet
                  title={title}
                  description={description}
                  onClose={() => onOpenChange(false)}
                  className={className}
                >
                  {children}
                </MobileSheet>
              </Dialog.Content>
            ) : (
              <Dialog.Content asChild aria-describedby={undefined}>
                <DesktopDialog
                  title={title}
                  description={description}
                  onClose={() => onOpenChange(false)}
                  className={className}
                >
                  {children}
                </DesktopDialog>
              </Dialog.Content>
            )}
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// ─── Desktop : modal centré, Content = la modal box directement ───────
// forwardRef obligatoire : Radix Dialog.Content asChild forward sa ref ici.
// Sans ça, la ref est perdue → Radix ne peut pas détecter "click inside
// content" et considère TOUT click comme outside → modal se ferme au
// moindre clic d'input.

const DesktopDialog = forwardRef<
  HTMLDivElement,
  {
    title?: string;
    description?: string;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
  }
>(function DesktopDialog({ title, description, onClose, children, className }, ref) {
  return (
    <motion.div
      ref={ref}
      className={clsx(
        // Centrage via top/left 50% + style x/y -50% géré par Framer
        // (cohérent avec le transform animé, pas d'écrasement Tailwind).
        'fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-[min(640px,92vw)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl',
        className
      )}
      style={{ x: '-50%', y: '-50%' }}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
        <div className="min-w-0">
          {title && <Dialog.Title className="display text-display-sm">{title}</Dialog.Title>}
          {description && (
            <Dialog.Description className="mt-0.5 text-sm text-text-muted">
              {description}
            </Dialog.Description>
          )}
        </div>
        <Dialog.Close asChild>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-soft hover:bg-surface-2 hover:text-text"
          >
            <X size={18} />
          </button>
        </Dialog.Close>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
    </motion.div>
  );
});

// ─── Mobile : bottom sheet avec drag-to-dismiss ────────────────────────

const MobileSheet = forwardRef<
  HTMLDivElement,
  {
    title?: string;
    description?: string;
    onClose: () => void;
    children: React.ReactNode;
    className?: string;
  }
>(function MobileSheet({ title, description, onClose, children, className }, ref) {
  return (
    <motion.div
      ref={ref}
      className={clsx(
        'fixed inset-x-0 bottom-0 z-50 flex max-h-[92dvh] flex-col rounded-t-3xl border-t border-border bg-surface shadow-2xl',
        className
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 36 }}
      drag="y"
      dragConstraints={{ top: 0 }}
      dragElastic={{ top: 0, bottom: 0.5 }}
      onDragEnd={(_, info) => {
        if (info.offset.y > 120 || info.velocity.y > 500) onClose();
      }}
    >
      {/* Drag handle */}
      <div className="flex shrink-0 cursor-grab justify-center pt-3 pb-1 active:cursor-grabbing">
        <span className="h-1.5 w-12 rounded-full bg-text-soft/40" />
      </div>
      <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3">
        <div className="min-w-0">
          {title && <Dialog.Title className="display text-display-sm">{title}</Dialog.Title>}
          {description && (
            <Dialog.Description className="mt-0.5 text-sm text-text-muted">
              {description}
            </Dialog.Description>
          )}
        </div>
        <Dialog.Close asChild>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-soft hover:bg-surface-2 hover:text-text"
          >
            <X size={18} />
          </button>
        </Dialog.Close>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>
    </motion.div>
  );
});
