/**
 * InterstitialAd — pub plein écran avec skip après 5s. Pilotée par adStore.
 * Caché si premium. CTA bas → modale RiffLab+.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { usePremium } from '@/hooks/usePremium';
import { useAdStore } from '@/stores/adStore';
import { AdSlot } from './AdSlot';

const SKIP_SECONDS = 5;

export function InterstitialAd() {
  const { isPremium, openPremiumModal } = usePremium();
  const interstitialOpen = useAdStore((s) => s.interstitialOpen);
  const closeInterstitial = useAdStore((s) => s.closeInterstitial);
  const [countdown, setCountdown] = useState(SKIP_SECONDS);

  useEffect(() => {
    if (!interstitialOpen) {
      setCountdown(SKIP_SECONDS);
      return;
    }
    setCountdown(SKIP_SECONDS);
    const interval = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [interstitialOpen]);

  if (isPremium) return null;
  const canSkip = countdown <= 0;

  return (
    <AnimatePresence>
      {interstitialOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col bg-black/95 backdrop-blur-md"
        >
          {/* Header */}
          <div
            className="flex items-center justify-between p-4"
            style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}
          >
            <span className="text-xs uppercase tracking-wider text-text-muted">Publicité</span>
            <button
              type="button"
              onClick={canSkip ? closeInterstitial : undefined}
              disabled={!canSkip}
              className={clsx(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition',
                canSkip
                  ? 'border border-border-gold text-text hover:bg-surface'
                  : 'cursor-not-allowed border border-border text-text-muted',
              )}
            >
              {canSkip ? (
                <>
                  <X size={14} /> Passer
                </>
              ) : (
                <>Passer dans {countdown}s</>
              )}
            </button>
          </div>

          {/* Contenu pub */}
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-md">
              <AdSlot format="square" adSlot="" />
            </div>
          </div>

          {/* CTA Premium */}
          <div className="p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
            <button
              type="button"
              onClick={() => {
                closeInterstitial();
                openPremiumModal({ feature: 'interstitial', reason: 'Retire toutes les pubs avec RiffLab+' });
              }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-gold-bright to-gold py-3 font-bold text-bg shadow-gold"
            >
              <Sparkles size={16} />
              Retirer toutes les pubs avec RiffLab+
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
