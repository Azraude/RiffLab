/**
 * AdBanner — bandeau pub placeholder (free tier). Caché si premium ou fermé.
 * Le CTA ouvre la modale RiffLab+ (store global usePremium).
 */
import { useState } from 'react';
import { X } from 'lucide-react';
import { usePremium } from '@/hooks/usePremium';

export function AdBanner() {
  const { isPremium, openPremiumModal } = usePremium();
  const [hidden, setHidden] = useState(false);

  if (isPremium || hidden) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 mx-auto max-w-screen-sm px-3 md:bottom-3">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 shadow-lg">
        <div className="flex h-12 w-20 flex-shrink-0 items-start justify-center rounded-md bg-gradient-to-br from-gold/30 to-surface-2">
          <span className="pt-1 text-[10px] uppercase tracking-wider text-text-soft">Pub</span>
        </div>
        <div className="min-w-0 flex-1 text-xs">
          <p className="truncate font-bold text-text">Marre des pubs ?</p>
          <button
            type="button"
            onClick={() => openPremiumModal({ feature: 'ad-banner', reason: 'Passe à RiffLab+ pour retirer les pubs' })}
            className="text-[11px] text-gold underline"
          >
            Passer à RiffLab+ →
          </button>
        </div>
        <button
          type="button"
          onClick={() => setHidden(true)}
          aria-label="Masquer"
          className="flex-shrink-0 rounded-full p-1 text-text-muted hover:bg-surface-2 hover:text-text"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
