/**
 * Global keyboard shortcuts.
 *
 * Pattern Gmail / Linear : `g <letter>` go-to chord (timeout 1.2s).
 * Plus :
 * - `?` open cheatsheet
 * - `Esc` close cheatsheet ou modal opened
 * - `cmd/ctrl+k` stub command palette (à venir Phase 5)
 *
 * Ignore les events quand l'utilisateur tape dans un input / textarea /
 * contenteditable — sinon impossible de taper "g" ou "?" dans un form.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';

type ShortcutGroup = {
  label: string;
  items: Array<{ keys: string[]; description: string }>;
};

export const SHORTCUTS: ShortcutGroup[] = [
  {
    label: 'Navigation',
    items: [
      { keys: ['g', 'd'], description: 'Aller au Dashboard' },
      { keys: ['g', 's'], description: 'Aller aux Sons' },
      { keys: ['g', 'c'], description: 'Aller aux Accords' },
      { keys: ['g', 'g'], description: 'Aller aux Gammes' },
      { keys: ['g', 'p'], description: 'Aller au Plan' },
      { keys: ['g', 'r'], description: 'Aller aux Riffs' },
      { keys: ['g', 't'], description: 'Aller au Tuner' },
      { keys: ['g', 'm'], description: 'Aller au Métronome' },
      { keys: ['g', 'l'], description: 'Aller aux Setlists' },
      { keys: ['g', 'j'], description: 'Aller au mode Jam' },
    ],
  },
  {
    label: 'Général',
    items: [
      { keys: ['?'], description: "Afficher l'aide raccourcis" },
      { keys: ['Esc'], description: 'Fermer modal / drawer' },
      { keys: ['Ctrl', 'K'], description: 'Command palette (à venir)' },
    ],
  },
];

type ShortcutsContextValue = {
  open: () => void;
  close: () => void;
};

const ShortcutsContext = createContext<ShortcutsContextValue | null>(null);

export function useShortcuts(): ShortcutsContextValue {
  const ctx = useContext(ShortcutsContext);
  if (!ctx)
    throw new Error('useShortcuts must be used inside KeyboardShortcutsProvider');
  return ctx;
}

function isTypingInForm(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Provider à monter au root de l'app. Installe les listeners globaux et
 * gère le state du cheatsheet modal.
 */
export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  // Chord state : si l'utilisateur a tapé "g", on attend la 2e touche
  // pendant CHORD_TIMEOUT_MS, sinon on reset.
  const chordRef = useRef<{ key: string; timer: number } | null>(null);
  const CHORD_TIMEOUT_MS = 1200;

  const clearChord = useCallback(() => {
    if (chordRef.current) {
      window.clearTimeout(chordRef.current.timer);
      chordRef.current = null;
    }
  }, []);

  const handleChord = useCallback(
    (first: string, second: string) => {
      // Navigation map — basée sur les routes existantes
      const map: Record<string, string> = {
        d: '/dashboard',
        s: '/songs',
        c: '/chords',
        g: '/scales', // g g = Gammes
        p: '/plan',
        r: '/riffs',
        t: '/tuner',
        m: '/metronome',
        l: '/setlists',
        j: '/jam',
      };
      if (first === 'g' && map[second]) {
        navigate(map[second]);
      }
    },
    [navigate],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd+K → stub command palette
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        // Pour l'instant ouvre le cheatsheet — Phase 5 = vraie palette
        setCheatsheetOpen(true);
        return;
      }

      // Esc → ferme le cheatsheet (les autres modals Radix gèrent eux-mêmes)
      if (e.key === 'Escape' && cheatsheetOpen) {
        setCheatsheetOpen(false);
        return;
      }

      if (isTypingInForm(e.target)) return;

      // Ignore quand modifier (sauf ceux déjà handled au-dessus)
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      // ? → ouvre cheatsheet (Shift+/ produit "?")
      if (e.key === '?') {
        e.preventDefault();
        setCheatsheetOpen(true);
        return;
      }

      // Chord "g <letter>"
      const k = e.key.toLowerCase();
      if (k.length === 1 && /[a-z]/.test(k)) {
        if (chordRef.current) {
          const first = chordRef.current.key;
          clearChord();
          handleChord(first, k);
          return;
        }
        // Premier caractère d'un chord potentiel — seul "g" déclenche pour
        // l'instant. Si un jour on ajoute autre chose (ex: "s s"), étendre.
        if (k === 'g') {
          const timer = window.setTimeout(() => {
            chordRef.current = null;
          }, CHORD_TIMEOUT_MS);
          chordRef.current = { key: k, timer };
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearChord();
    };
  }, [cheatsheetOpen, clearChord, handleChord]);

  const value: ShortcutsContextValue = {
    open: () => setCheatsheetOpen(true),
    close: () => setCheatsheetOpen(false),
  };

  return (
    <ShortcutsContext.Provider value={value}>
      {children}
      <ShortcutsCheatsheet open={cheatsheetOpen} onOpenChange={setCheatsheetOpen} />
    </ShortcutsContext.Provider>
  );
}

function ShortcutsCheatsheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.18, ease: [0.25, 1, 0.5, 1] }}
                className="fixed inset-x-2 top-1/2 z-50 max-h-[90vh] -translate-y-1/2 overflow-y-auto rounded-2xl border border-border-gold bg-bg p-6 shadow-gold-strong sm:inset-x-auto sm:left-1/2 sm:max-w-2xl sm:-translate-x-1/2 sm:translate-y-[-50%]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-gold">
                      <Keyboard size={18} />
                      <Dialog.Title className="display text-display-sm">
                        Raccourcis clavier
                      </Dialog.Title>
                    </div>
                    <p className="mt-1 text-sm text-text-muted">
                      Appuie sur <Kbd>?</Kbd> à tout moment pour revoir cette
                      liste.
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      aria-label="Fermer"
                      className="flex h-9 w-9 items-center justify-center rounded-md text-text-soft hover:bg-surface hover:text-text"
                    >
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="mt-5 grid gap-5">
                  {SHORTCUTS.map((group) => (
                    <section key={group.label}>
                      <h3 className="eyebrow mb-2">{group.label}</h3>
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {group.items.map((item) => (
                          <li
                            key={item.description}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface-2 px-3 py-2"
                          >
                            <span className="text-sm text-text-muted">
                              {item.description}
                            </span>
                            <span className="flex shrink-0 items-center gap-1">
                              {item.keys.map((k, i) => (
                                <Kbd key={i}>{k}</Kbd>
                              ))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md border border-border-gold bg-surface px-1.5 font-mono text-[11px] font-semibold text-gold-bright">
      {children}
    </kbd>
  );
}
