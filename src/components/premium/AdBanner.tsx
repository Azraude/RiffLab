/**
 * AdBanner — bandeau sticky bottom (free tier). Caché si premium ou fermé.
 * Délègue le rendu à AdSlot (placeholder cross-promo ou AdSense réel).
 */
import { useState } from 'react';
import { X } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';
import { AdSlot } from '@/components/ads/AdSlot';

export function AdBanner() {
  const { isPremium } = usePremium();
  const [hidden, setHidden] = useState(false);

  if (isPremium || hidden) return null;

  return (
    <div className="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-screen-sm px-3 md:bottom-3">
      <div className="relative">
        <AdSlot format="banner" adSlot="" />
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Masquer la publicité"
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-bg text-text-muted hover:text-text"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}
