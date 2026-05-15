import { useId } from 'react';
import clsx from 'clsx';

/**
 * RiffLabLogo — flamme stylisée vintage premium.
 *
 * - Bottom half : fill gold solide (--gold)
 * - Top half : fill none, stroke gold 1.5px
 * - Mask SVG pour la séparation propre (rect révèle le fill sur le bottom)
 * - Animation flicker subtile : translateY ±1px ease-in-out infinite slow
 *
 * useId() pour des mask IDs uniques par instance — sans ça les masks
 * collident quand le logo apparaît plusieurs fois dans le DOM (sidebar
 * + landing header par exemple).
 */
interface RiffLabLogoProps {
  size?: number;
  className?: string;
  /** Si true, animation flicker. Défaut true. Désactive pour favicon ou icône inline. */
  animated?: boolean;
}

export function RiffLabLogo({ size = 22, className, animated = true }: RiffLabLogoProps) {
  const id = useId().replace(/:/g, '_');
  const maskId = `flame-mask-${id}`;
  const glowId = `flame-glow-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(animated && 'rifflab-flame-flicker', className)}
      aria-label="RiffLab"
      role="img"
    >
      <defs>
        <mask id={maskId}>
          {/* Tout en blanc = visible. Le rect couvre la moitié basse → seul
              le bas est filled. La moitié haute reste juste outline. */}
          <rect x="0" y="11.5" width="24" height="13" fill="white" />
        </mask>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outline (visible partout : haut en outline only, bas overlay par
          le fill mask) */}
      <path
        d="M12 2 C 9 5, 7 8.5, 8 13 C 8 17, 10 21.5, 12 21.5 C 14 21.5, 16 17, 16 13 C 17 8.5, 15 5, 12 2 Z"
        fill="none"
        stroke="rgb(var(--gold))"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter={animated ? `url(#${glowId})` : undefined}
      />
      {/* Fill (révélé uniquement sur la moitié basse via le mask) */}
      <path
        d="M12 2 C 9 5, 7 8.5, 8 13 C 8 17, 10 21.5, 12 21.5 C 14 21.5, 16 17, 16 13 C 17 8.5, 15 5, 12 2 Z"
        fill="rgb(var(--gold))"
        mask={`url(#${maskId})`}
      />
      {/* Petite étincelle au sommet pour donner du caractère */}
      <circle cx="12" cy="3" r="0.6" fill="rgb(var(--gold-bright))" />
    </svg>
  );
}

/** Version textuelle "RiffLab" complète : logo flamme + wordmark serif. */
export function RiffLabBrand({
  logoSize = 24,
  className,
  textClassName,
}: {
  logoSize?: number;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={clsx('inline-flex items-center gap-2.5', className)}>
      <RiffLabLogo size={logoSize} />
      <span className={clsx('display tracking-wide', textClassName ?? 'text-[26px]')}>
        RiffLab
      </span>
    </span>
  );
}
