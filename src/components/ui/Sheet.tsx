/**
 * Sheet — modal Radix Dialog avec rendu adaptatif :
 *  - Desktop (>md) : modal centré (max-w 640), backdrop blur, ESC + clic
 *    backdrop pour fermer. Centrage via flex parent (compatible avec les
 *    transforms d'entrée/sortie de Framer Motion).
 *  - Mobile  (≤md) : bottom sheet qui slide depuis le bas avec
 *    drag-to-dismiss (drag y > 120 ou velocity > 500).
 *
 * A11y native via Radix (focus trap, ESC, role="dialog", aria-modal,
 * aria-labelledby via Title, etc.).
 *
 * Quirks fixés :
 *  - Desktop mal centré : on n'utilise plus -translate-x/y combinés avec
 *    Framer (qui override transform). Maintenant un wrapper fixed inset-0
 *    flex items-center justify-center → le motion.div peut animer
 *    librement sans casser le centrage.
 *  - Click sur input fermait le modal sur desktop : onInteractOutside
 *    protégé pour les éléments rendus en portail (Radix Select, etc.).
 */

import { useEffect, useState } from 'react';
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

            <Dialog.Content
              onInteractOutside={(e) => {
                // Ne pas fermer si l'interaction vient d'un portail (Radix
                // Select, Popover, dropdowns natifs OS, etc.) — sinon
                // cliquer sur une option d'un select dans le form ferme
                // le modal.
                const target = e.target as Element | null;
                if (target?.closest?.('[data-radix-portal]')) {
                  e.preventDefault();
                }
              }}
              asChild
              aria-describedby={undefined}
            >
              {isMobile ? (
                <MobileSheet
                  title={title}
                  description={description}
                  onClose={() => onOpenChange(false)}
                  className={className}
                >
                  {children}
                </MobileSheet>
              ) : (
                <DesktopDialog
                  title={title}
                  description={description}
                  onClose={() => onOpenChange(false)}
                  className={className}
                >
                  {children}
                </DesktopDialog>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// ─── Desktop : centered modal via flex parent ─────────────────────────

function DesktopDialog({
  title,
  description,
  onClose,
  children,
  className,
}: {
  title?: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // Wrapper fixed inset-0 + flex centering. Le motion.div animé reste
    // libre de transformer sans casser le centrage.
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        className={clsx(
          'pointer-events-auto flex max-h-[90vh] w-[min(640px,92vw)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl',
          className
        )}
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
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
    </div>
  );
}

// ─── Mobile : bottom sheet with drag-to-dismiss ────────────────────────

function MobileSheet({
  title,
  description,
  onClose,
  children,
  className,
}: {
  title?: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
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
}
