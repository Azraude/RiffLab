/**
 * SelectorDrawer — bottom-sheet de sélection (mobile-first) pour les rows
 * Settings (Langue, Niveau, Son, Skin, Thème). Liste d'options avec check
 * sur l'actif + badge cadenas sur les premium verrouillés.
 *
 * Mobile : collé en bas (items-end, rounded-t-3xl). Desktop : centré.
 */
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import clsx from 'clsx';

export interface SelectorOption {
  id: string;
  label: string;
  /** Description secondaire optionnelle. */
  sublabel?: string;
  /** Emoji/flag affiché à gauche (ex: langue). */
  flag?: string;
  /** Option premium verrouillée. */
  locked?: boolean;
}

interface SelectorDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  options: SelectorOption[];
  currentId: string;
  onSelect: (id: string) => void;
}

export function SelectorDrawer({
  open,
  onClose,
  title,
  options,
  currentId,
  onSelect,
}: SelectorDrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none sm:items-center sm:p-3">
            <motion.div
              role="dialog"
              aria-label={title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
              className="pointer-events-auto max-h-[80vh] w-full overflow-y-auto overflow-x-hidden rounded-t-3xl border-t border-border-gold bg-bg p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-2xl sm:border sm:pb-5"
            >
              {/* Poignée mobile */}
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden />
              <h3 className="display mb-3 text-display-sm">{title}</h3>
              <ul className="space-y-1.5">
                {options.map((opt) => {
                  const active = opt.id === currentId;
                  return (
                    <li key={opt.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelect(opt.id);
                          if (!opt.locked) onClose();
                        }}
                        aria-pressed={active}
                        className={clsx(
                          'flex min-h-[48px] w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors',
                          active
                            ? 'border-gold bg-gold/10'
                            : 'border-border bg-surface-2 hover:border-gold-soft'
                        )}
                      >
                        {opt.flag && (
                          <span className="shrink-0 text-lg" aria-hidden>
                            {opt.flag}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span
                            className={clsx(
                              'block truncate text-sm font-semibold',
                              active ? 'text-gold' : 'text-text'
                            )}
                          >
                            {opt.label}
                          </span>
                          {opt.sublabel && (
                            <span className="block truncate text-xs text-text-soft">
                              {opt.sublabel}
                            </span>
                          )}
                        </span>
                        {opt.locked && <Lock size={14} className="shrink-0 text-text-soft" />}
                        {active && (
                          <Check size={18} strokeWidth={3} className="shrink-0 text-gold" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
