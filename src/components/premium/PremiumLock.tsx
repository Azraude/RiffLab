/**
 * PremiumLock — grise un enfant + cadenas, et intercepte le clic pour ouvrir
 * la modale RiffLab+. Si l'user est premium, rend l'enfant tel quel.
 */
import { Lock } from 'lucide-react';
import type { ReactNode, MouseEvent } from 'react';
import { usePremium } from '@/hooks/usePremium';

interface Props {
  children: ReactNode;
  /** Nom de feature (analytics / messaging). */
  feature?: string;
  /** Texte custom affiché dans la modale. */
  reason?: string;
  className?: string;
}

export function PremiumLock({ children, feature, reason, className }: Props) {
  const { isPremium, openPremiumModal } = usePremium();

  if (isPremium) return <>{children}</>;

  const handleClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openPremiumModal({ feature, reason });
  };

  return (
    <div className={`relative ${className ?? ''}`}>
      <div className="pointer-events-none opacity-40 grayscale" aria-hidden="true">
        {children}
      </div>
      <button
        type="button"
        onClick={handleClick}
        className="absolute inset-0 flex items-center justify-center rounded-xl bg-bg/30 backdrop-blur-[1px] transition hover:bg-bg/50"
        aria-label="Fonctionnalité Premium — débloquer avec RiffLab+"
      >
        <span className="rounded-full bg-gradient-to-br from-gold-bright to-gold p-2 shadow-gold">
          <Lock size={16} className="text-bg" />
        </span>
      </button>
    </div>
  );
}
