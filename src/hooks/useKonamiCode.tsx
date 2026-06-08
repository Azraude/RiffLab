/**
 * Konami code easter egg — ↑ ↑ ↓ ↓ ← → ← → B A
 *
 * Au trigger : unlock le thème secret "Retro Arcade" dans prefs +
 * affiche un toast "🕹 Cheat code activé !".
 *
 * Le hook s'auto-monte au Layout (cf KonamiProvider). Ignore les
 * events quand un input/textarea est focus.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefs } from '@/stores/prefsStore';

const SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'KeyB',
  'KeyA',
];

type KonamiContextValue = {
  unlocked: boolean;
};
const KonamiContext = createContext<KonamiContextValue>({ unlocked: false });
export const useKonami = () => useContext(KonamiContext);

function isTypingInForm(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}

export function KonamiProvider({ children }: { children: ReactNode }) {
  const unlocked = usePrefs((s) => s.unlockedSecretTheme);
  const unlockSecretTheme = usePrefs((s) => s.unlockSecretTheme);
  const [toastVisible, setToastVisible] = useState(false);
  const seqRef = useRef<number>(0);

  useEffect(() => {
    if (unlocked) return; // déjà débloqué, listener inutile
    const onKey = (e: KeyboardEvent) => {
      if (isTypingInForm(e.target)) return;
      const expected = SEQUENCE[seqRef.current];
      if (e.code === expected) {
        seqRef.current += 1;
        if (seqRef.current === SEQUENCE.length) {
          // SUCCESS
          unlockSecretTheme();
          setToastVisible(true);
          window.setTimeout(() => setToastVisible(false), 4000);
          seqRef.current = 0;
        }
      } else {
        // Reset, sauf si la touche est le 1er pas de la séquence (typing "↑")
        seqRef.current = e.code === SEQUENCE[0] ? 1 : 0;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [unlocked, unlockSecretTheme]);

  return (
    <KonamiContext.Provider value={{ unlocked }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {toastVisible && (
              <motion.div
                initial={{ opacity: 0, y: 32, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 32, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                role="status"
                aria-live="polite"
                className="fixed left-1/2 z-[100] -translate-x-1/2 rounded-2xl border-2 px-5 py-3 shadow-2xl"
                style={{
                  bottom: 'calc(env(safe-area-inset-bottom) + 24px)',
                  background: 'linear-gradient(135deg, #00ffff20, #ff00dd20)',
                  borderColor: '#00ffff',
                  boxShadow: '0 0 24px rgba(0, 255, 255, 0.5), 0 0 48px rgba(255, 0, 220, 0.3)',
                }}
              >
                <div className="text-center">
                  <div
                    className="font-mono text-base font-bold tracking-wider"
                    style={{ color: '#00ffff', textShadow: '0 0 8px rgba(0,255,255,0.8)' }}
                  >
                    🕹 CHEAT CODE ACTIVÉ
                  </div>
                  <div
                    className="mt-0.5 text-xs"
                    style={{ color: '#ff6be0' }}
                  >
                    Theme Retro Arcade débloqué dans Préférences ✨
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </KonamiContext.Provider>
  );
}
