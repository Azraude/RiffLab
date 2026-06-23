/**
 * AdSlot — abstraction d'un emplacement publicitaire.
 *
 *  - Premium → rend null (zéro pub).
 *  - AdSense configuré (VITE_ADSENSE_CLIENT_ID) → vrai <ins adsbygoogle>.
 *  - Sinon → placeholder cross-promo RiffLab+ (cliquable → modale premium).
 *
 * Swap vers AdSense réel : cf docs/ADSENSE-INTEGRATION.md (juste remplir
 * l'env var + les adSlot IDs).
 */
import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { usePremium } from '@/hooks/usePremium';
import { ADSENSE_CLIENT_ID, isAdSenseEnabled, pushAd } from '@/lib/ads/adsense';

type AdFormat = 'banner' | 'native' | 'square';

interface Props {
  format: AdFormat;
  /** AdSense ad slot ID (à remplir quand validé). */
  adSlot?: string;
  className?: string;
}

const SLOT_DIMENSIONS: Record<AdFormat, { className: string; minHeight: string }> = {
  banner: { className: 'h-[60px] sm:h-[90px]', minHeight: '60px' },
  native: { className: 'min-h-[120px]', minHeight: '120px' },
  square: { className: 'h-[250px]', minHeight: '250px' },
};

export function AdSlot({ format, adSlot, className }: Props) {
  const { isPremium, openPremiumModal } = usePremium();
  const ref = useRef<HTMLDivElement>(null);
  const dims = SLOT_DIMENSIONS[format];

  const adsenseMode = isAdSenseEnabled() && !!adSlot;

  useEffect(() => {
    if (isPremium || !adsenseMode || !ref.current) return;
    pushAd();
  }, [isPremium, adsenseMode]);

  if (isPremium) return null;

  // Mode AdSense (production)
  if (adsenseMode) {
    return (
      <div
        ref={ref}
        className={clsx('flex items-center justify-center', dims.className, className)}
      >
        <ins
          className="adsbygoogle block w-full"
          style={{ display: 'block', minHeight: dims.minHeight }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={adSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // Mode placeholder (cross-promo RiffLab+)
  return (
    <button
      type="button"
      onClick={() => openPremiumModal({ feature: `ad-${format}`, reason: 'Passe à RiffLab+ pour retirer les pubs' })}
      className={clsx(
        'group relative flex w-full items-center gap-3 overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-r from-gold/10 via-bg to-gold/5 px-4 transition hover:border-gold/60',
        dims.className,
        className,
      )}
    >
      <span className="flex-shrink-0 rounded-full bg-gradient-to-br from-gold-bright to-gold p-2">
        <Sparkles size={16} className="text-bg" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block text-sm font-bold text-text">Passe à RiffLab+</span>
        <span className="block text-xs text-text-muted">
          Aucune pub · Sauvegardes illimitées · Skins exclusifs
        </span>
      </span>
      <span className="hidden text-xs text-gold sm:inline">→</span>
      <span className="absolute bottom-1 right-2 text-[9px] uppercase tracking-wider text-text-soft">
        Publicité
      </span>
    </button>
  );
}
