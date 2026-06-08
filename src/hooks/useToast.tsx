/**
 * Toast système centralisé — Zustand store + ToastViewport.
 *
 * 4 types : success (vert) / warning (jaune) / error (rouge) / info (gold).
 * Stack max 3 visibles, anim slide-in depuis top-right, durée selon type.
 * Bordure 4px gauche colorée. Icône emoji + Lucide.
 *
 * Usage (n'importe quel composant) :
 *   const toast = useToast();
 *   toast.success("Profil sauvegardé");
 *   toast.error("Connexion échouée", { duration: 8000 });
 *
 * Le ToastViewport doit être monté UNE seule fois dans Layout (sous
 * KonamiProvider). Multi-tab safe (chaque tab a son propre store).
 */
import { create } from 'zustand';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type ToastType = 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

interface ToastStore {
  items: ToastItem[];
  push: (item: Omit<ToastItem, 'id'>) => number;
  dismiss: (id: number) => void;
}

let nextId = 1;

const useToastStore = create<ToastStore>((set, get) => ({
  items: [],
  push: (partial) => {
    const id = nextId++;
    const item: ToastItem = { id, ...partial };
    set((s) => ({ items: [...s.items, item].slice(-3) })); // max 3 visibles
    if (item.duration > 0) {
      window.setTimeout(() => get().dismiss(id), item.duration);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
}));

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 3000,
  warning: 5000,
  error: 7000,
  info: 4000,
};

/**
 * Hook API ergonomique : `const toast = useToast()` → `toast.success(msg)`.
 * Stable (recrée jamais les fonctions, juste resolved depuis le store).
 */
export function useToast() {
  const push = useToastStore((s) => s.push);
  const dismiss = useToastStore((s) => s.dismiss);

  return {
    success: (message: string, opts?: { duration?: number }) =>
      push({ type: 'success', message, duration: opts?.duration ?? DEFAULT_DURATIONS.success }),
    warning: (message: string, opts?: { duration?: number }) =>
      push({ type: 'warning', message, duration: opts?.duration ?? DEFAULT_DURATIONS.warning }),
    error: (message: string, opts?: { duration?: number }) =>
      push({ type: 'error', message, duration: opts?.duration ?? DEFAULT_DURATIONS.error }),
    info: (message: string, opts?: { duration?: number }) =>
      push({ type: 'info', message, duration: opts?.duration ?? DEFAULT_DURATIONS.info }),
    dismiss,
  };
}

// ─── Viewport (à monter dans Layout) ─────────────────────────────────

const TYPE_META: Record<
  ToastType,
  { Icon: LucideIcon; emoji: string; borderColor: string; iconColor: string; bg: string }
> = {
  success: {
    Icon: CheckCircle2,
    emoji: '✅',
    borderColor: 'border-l-success',
    iconColor: 'text-success',
    bg: 'bg-success/5',
  },
  warning: {
    Icon: AlertTriangle,
    emoji: '⚠️',
    borderColor: 'border-l-gold-bright',
    iconColor: 'text-gold-bright',
    bg: 'bg-gold/5',
  },
  error: {
    Icon: XCircle,
    emoji: '❌',
    borderColor: 'border-l-danger',
    iconColor: 'text-danger',
    bg: 'bg-danger/5',
  },
  info: {
    Icon: Info,
    emoji: '💡',
    borderColor: 'border-l-gold',
    iconColor: 'text-gold',
    bg: 'bg-surface',
  },
};

export function ToastViewport() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2 md:right-6 md:top-6"
      aria-live="polite"
      aria-atomic="false"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const meta = TYPE_META[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.95, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-border border-l-4 ${meta.borderColor} ${meta.bg} bg-surface-2 px-4 py-3 shadow-lg backdrop-blur-md`}
            >
              <meta.Icon size={18} className={`mt-0.5 shrink-0 ${meta.iconColor}`} strokeWidth={2} />
              <p className="flex-1 text-sm leading-snug text-text">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fermer"
                className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-text-soft hover:bg-surface hover:text-text"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
