/**
 * Sheet — modal Radix Dialog avec rendu adaptatif :
 *  - Desktop (>md) : modal centré (max-w 640), backdrop blur, ESC + clic
 *    backdrop pour fermer.
 *  - Mobile  (≤md) : bottom sheet qui slide depuis le bas avec
 *    drag-to-dismiss (drag y > 120 ou velocity > 500).
 *
 * A11y native via Radix (focus trap, ESC, role="dialog", aria-modal,
 * aria-labelledby via Title, etc.).
 *
 * Pattern interne — IMPORTANT :
 *  Dialog.Content asChild a besoin que son enfant soit un composant
 *  forwardRef qui passe ref + props sur son DOM root. motion.div de
 *  framer-motion est déjà forwardRef, donc on le met EN DIRECT comme
 *  enfant (pas via un wrapper function component) — c'est le même
 *  pattern que MobileNav qui fonctionne.
 *
 *  Si on encapsulait motion.div dans un function component non-forwardRef,
 *  Radix perdrait la ref du contenu et son DismissableLayer interpréterait
 *  les clicks intérieurs comme « outside » → modal qui ferme dès qu'on
 *  tape un input.
 *
 *  Pour desktop, on utilise un wrapper motion.div fixed inset-0
 *  pointer-events-none qui centre via flex. Le wrapper EST le ref Radix,
 *  le modal interne (pointer-events-auto) est son enfant DOM → les clicks
 *  dans le modal sont contenus dans le wrapper → « inside ». Les clicks
 *  sur la zone sombre passent à travers (pointer-events-none) et tombent
 *  sur l'Overlay → close.
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

            <Dialog.Content asChild aria-describedby={undefined}>
              {isMobile ? (
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
                    if (info.offset.y > 120 || info.velocity.y > 500) onOpenChange(false);
                  }}
                >
                  {/* Drag handle */}
                  <div className="flex shrink-0 justify-center pt-3 pb-1">
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
                        aria-label="Fermer"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-soft hover:bg-surface-2 hover:text-text"
                      >
                        <X size={18} />
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="flex-1 overflow-y-auto px-5 pb-6">{children}</div>
                </motion.div>
              ) : (
                <motion.div
                  // Wrapper fixed inset-0 — c'est ICI que Radix attache sa
                  // ref via asChild. Pointer-events-none pour laisser passer
                  // les clicks sur la zone sombre vers l'Overlay. Le modal
                  // interne (pointer-events-auto) capte les clicks et reste
                  // « inside » du point de vue de Radix.
                  className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                >
                  <motion.div
                    className={clsx(
                      'pointer-events-auto flex max-h-[90vh] w-[min(640px,92vw)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl',
                      className
                    )}
                    initial={{ y: 12, scale: 0.98 }}
                    animate={{ y: 0, scale: 1 }}
                    exit={{ y: 8, scale: 0.98 }}
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
                          aria-label="Fermer"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-soft hover:bg-surface-2 hover:text-text"
                        >
                          <X size={18} />
                        </button>
                      </Dialog.Close>
                    </div>
                    <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
                  </motion.div>
                </motion.div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
