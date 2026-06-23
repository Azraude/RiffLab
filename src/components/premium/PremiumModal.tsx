/**
 * PremiumModal — modale d'upsell RiffLab+ (gradient or, bénéfices, CTA).
 *
 * `PremiumModal` est présentationnel (props). `GlobalPremiumModal` le branche
 * sur le store global usePremiumModal et se monte UNE fois dans Layout, pour
 * que requirePremium()/openPremiumModal() depuis n'importe où l'affichent.
 */
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePremiumModal } from '@/hooks/usePremium';

interface Props {
  open: boolean;
  onClose: () => void;
  feature?: string;
  reason?: string;
}

const BENEFITS = [
  { icon: '♾️', text: 'Sauvegardes illimitées (riffs, setlists, progressions)' },
  { icon: '📄', text: 'Export PDF de tes tabs et setlists' },
  { icon: '✨', text: 'Tous les skins de manche premium' },
  { icon: '🚫', text: 'Plus aucune pub' },
  { icon: '🏆', text: 'Badge RiffLab+ doré sur ton profil' },
  { icon: '🎓', text: 'Parcours complet débloqué' },
];

export function PremiumModal({ open, onClose, reason }: Props) {
  const navigate = useNavigate();

  const handleCTA = () => {
    onClose();
    navigate('/premium');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl border-t-2 border-gold bg-surface sm:rounded-3xl sm:border"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header gradient or */}
            <div className="relative bg-gradient-to-b from-gold/30 via-gold/10 to-transparent p-6 pb-4 text-center">
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="absolute right-3 top-3 rounded-full p-1.5 text-text-muted hover:bg-bg/50 hover:text-text"
              >
                <X size={18} />
              </button>

              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold-bright to-gold shadow-[0_0_30px_rgba(245,217,122,0.45)]"
              >
                <Crown size={32} className="text-bg" />
              </motion.div>

              <h2 className="display text-2xl font-bold text-text">
                RiffLab<span className="text-gold">+</span>
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                {reason ?? 'Cette fonctionnalité est réservée aux membres RiffLab+'}
              </p>
            </div>

            {/* Bénéfices */}
            <div className="px-6 pb-2">
              <div className="space-y-2.5">
                {BENEFITS.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    className="flex items-center gap-3 text-sm"
                  >
                    <span className="text-lg">{b.icon}</span>
                    <span className="text-text">{b.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 p-6 pt-4">
              <button
                type="button"
                onClick={handleCTA}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-gold-bright to-gold py-3.5 font-bold text-bg shadow-gold transition hover:-translate-y-px"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Sparkles size={16} />
                  Découvrir RiffLab+
                </span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-2xl py-2.5 text-sm text-text-muted hover:text-text"
              >
                Plus tard
              </button>
              <p className="pt-1 text-center text-[11px] text-text-soft">
                Essai gratuit 7 jours · Annulable à tout moment
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Hôte global — monté une fois dans Layout, branché sur le store. */
export function GlobalPremiumModal() {
  const open = usePremiumModal((s) => s.open);
  const reason = usePremiumModal((s) => s.reason);
  const feature = usePremiumModal((s) => s.feature);
  const close = usePremiumModal((s) => s.close);
  return <PremiumModal open={open} onClose={close} reason={reason} feature={feature} />;
}
