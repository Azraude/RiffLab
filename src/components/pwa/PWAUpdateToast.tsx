import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, RefreshCw, X } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

/**
 * PWAUpdateToast — affiche un toast en bas de l'écran quand une nouvelle
 * version de l'app est disponible (Service Worker waiting), avec un
 * bouton "Recharger" pour activer la mise à jour immédiatement.
 *
 * Workbox `skipWaiting + clientsClaim` est déjà configuré côté SW (cf
 * vite.config.ts) — donc reloading.html fait l'affaire. On laisse juste
 * l'user décider du moment pour ne pas surprendre une session en cours.
 *
 * Bonus : affiche aussi un toast "RiffLab installé hors-ligne" la
 * première fois que le SW prend la main (clic offline-ready).
 */
export function PWAUpdateToast() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [updateSW, setUpdateSW] = useState<((reload?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    // registerSW retourne une fonction qui prompt + reload
    const update = registerSW({
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
        // Auto-dismiss après 4s
        setTimeout(() => setOfflineReady(false), 4000);
      },
    });
    setUpdateSW(() => update);
  }, []);

  const close = () => {
    setNeedRefresh(false);
    setOfflineReady(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          key="refresh"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-4 z-[80] mx-auto w-[min(420px,92vw)] rounded-2xl border border-gold bg-gradient-to-b from-surface to-bg p-4 shadow-gold-strong"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold bg-gold/10 text-gold">
              <RefreshCw size={16} />
            </span>
            <div className="flex-1">
              <div className="display text-sm">Nouvelle version dispo</div>
              <p className="mt-0.5 text-xs text-text-muted">
                Recharge pour profiter des dernières améliorations.
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Fermer"
              className="flex h-7 w-7 items-center justify-center rounded-full text-text-soft hover:text-text"
            >
              <X size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => updateSW?.(true)}
            className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold font-semibold text-bg shadow-gold-strong hover:-translate-y-px"
          >
            <RefreshCw size={14} />
            Recharger maintenant
          </button>
        </motion.div>
      )}
      {offlineReady && !needRefresh && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed inset-x-0 bottom-4 z-[80] mx-auto w-[min(380px,92vw)] rounded-2xl border border-success/40 bg-surface px-4 py-3 shadow-2xl"
          style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center gap-3">
            <Download size={16} className="text-success" />
            <span className="text-sm text-text">
              RiffLab installé hors-ligne. Ferme et rouvre quand tu veux.
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
