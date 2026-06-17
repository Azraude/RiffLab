import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Download, Share2, X } from 'lucide-react';

// Clés localStorage
const FIRST_VISIT_KEY = 'rifflab-first-visit';
const INSTALL_DISMISSED_KEY = 'rifflab-install-dismissed';
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

// BeforeInstallPromptEvent n'est pas dans les types TS standards
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function detectIOS() {
  const ua = navigator.userAgent;
  const isIphone = /iPhone|iPod/.test(ua);
  // iPads récents se font passer pour MacIntel avec maxTouchPoints > 1
  const isIpad =
    /iPad/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return (isIphone || isIpad) && !('MSStream' in window);
}

function isStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function shouldShowPrompt(): boolean {
  if (isStandaloneMode()) return false;

  const now = Date.now();

  // Enregistre la première visite
  const firstVisit = localStorage.getItem(FIRST_VISIT_KEY);
  if (!firstVisit) {
    localStorage.setItem(FIRST_VISIT_KEY, String(now));
    return false; // ne pas montrer dès la première visite
  }

  // Ne pas montrer si dismiss récent (< 14 jours)
  const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
  if (dismissed && now - Number(dismissed) < DISMISS_COOLDOWN_MS) return false;

  // Montrer seulement si actif depuis > 2 jours
  return now - Number(firstVisit) >= TWO_DAYS_MS;
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const ios = detectIOS();

  useEffect(() => {
    if (!shouldShowPrompt()) return;

    if (ios) {
      // iOS ne déclenche pas beforeinstallprompt — on affiche le guide après un délai
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    }

    // Android / Chrome Desktop : écoute l'événement natif
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Si déjà installé via appinstalled
    const onInstalled = () => {
      setShow(false);
      deferredPrompt.current = null;
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [ios]);

  const dismiss = () => {
    localStorage.setItem(INSTALL_DISMISSED_KEY, String(Date.now()));
    setShow(false);
    setShowIOSGuide(false);
  };

  const handleInstall = async () => {
    if (ios) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    deferredPrompt.current = null;
    if (outcome === 'accepted') setShow(false);
  };

  return (
    <AnimatePresence>
      {/* ── Toast principal ──────────────────────────────────────── */}
      {show && !showIOSGuide && (
        <motion.div
          key="install-toast"
          role="complementary"
          aria-label="Installer RiffLab"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30, delay: 0.15 }}
          className="fixed inset-x-0 z-[75] mx-auto w-[min(420px,92vw)] rounded-2xl border border-border bg-surface p-4 shadow-2xl"
          style={{
            bottom: 'max(5.5rem, calc(env(safe-area-inset-bottom) + 5rem))',
          }}
        >
          <div className="flex items-start gap-3">
            {/* Mini logo */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/30 bg-bg">
              <img src="/favicon.svg" width={24} height={24} alt="" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-text">Installe RiffLab</div>
              <p className="mt-0.5 text-xs text-text-muted leading-relaxed">
                Accès rapide depuis l'écran d'accueil, mode hors-ligne.
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Fermer"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-text-soft hover:text-text"
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={dismiss}
              className="flex-1 h-10 rounded-xl border border-border text-sm text-text-muted hover:text-text transition-colors"
            >
              Plus tard
            </button>
            <button
              type="button"
              onClick={handleInstall}
              className="flex-[2] h-10 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold text-sm font-semibold text-bg shadow-gold-strong hover:-translate-y-px transition-transform"
            >
              <Download size={14} />
              Installer
            </button>
          </div>
        </motion.div>
      )}

      {/* ── Guide iOS (bottom sheet) ─────────────────────────────── */}
      {showIOSGuide && (
        <motion.div
          key="ios-guide-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[85] bg-black/60 backdrop-blur-sm"
          onClick={dismiss}
        >
          <motion.div
            key="ios-guide-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-6"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/favicon.svg" width={32} height={32} alt="" aria-hidden />
                <h2 className="display text-lg text-text">Installe RiffLab</h2>
              </div>
              <button
                type="button"
                onClick={dismiss}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-text-soft hover:text-text"
              >
                <X size={16} />
              </button>
            </div>

            <p className="mb-4 text-sm text-text-muted">
              Ajoute l'app à ton écran d'accueil en 2 taps depuis Safari&nbsp;:
            </p>

            <div className="space-y-3">
              {/* Étape 1 */}
              <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 font-bold text-gold text-sm">
                  1
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">
                    Tape le bouton <strong>Partager</strong>
                  </p>
                  <p className="text-xs text-text-muted">L'icône en bas de Safari</p>
                </div>
                <Share2 size={18} className="shrink-0 text-gold" />
              </div>

              {/* Étape 2 */}
              <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/10 font-bold text-gold text-sm">
                  2
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text">
                    Tape <strong>« Sur l'écran d'accueil »</strong>
                  </p>
                  <p className="text-xs text-text-muted">
                    Puis confirme en haut à droite
                  </p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-text-soft" />
              </div>
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="mt-5 w-full h-11 rounded-xl border border-border text-sm text-text-muted hover:text-text transition-colors"
            >
              Compris, merci !
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
