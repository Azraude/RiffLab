import { useId } from 'react';
import clsx from 'clsx';

/**
 * RiffLabLogo — flamme stylisée vintage premium avec half-fill propre.
 *
 * Session 17 fix : la version mask SVG (session 16) ne montrait pas le
 * half-fill — sur certains navigateurs / configurations, l'attribut
 * `mask` n'était pas honoré. Refait avec `clipPath` (plus fiable cross-
 * browser) :
 * - 1er path : outline complet (haut + bas), fill none, stroke gold
 * - 2e path : même tracé, fill gradient gold, clippé sur la moitié basse
 *   uniquement via clipPath
 *
 * Animation flicker subtile via la classe globals.css .rifflab-flame-flicker
 * (translateY ±1px + scale 1.02 sur 2.4s ease-in-out infinite, origin
 * 50% 90%).
 *
 * useId() pour des clipPath IDs uniques par instance — sinon collision
 * quand le logo apparaît plusieurs fois dans le DOM (sidebar + landing
 * header par exemple, ou MobileNav + page open).
 */
interface RiffLabLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function RiffLabLogo({ size = 22, className, animated = true }: RiffLabLogoProps) {
  const id = useId().replace(/:/g, '_');
  const clipId = `flame-clip-${id}`;
  const gradId = `flame-grad-${id}`;

  // Path commun pour outline + fill (réutilisé par les deux <path>)
  const flamePath =
    'M12 2 C 8 6, 6 10, 6 14 C 6 18, 9 22, 12 22 C 15 22, 18 18, 18 14 C 18 10, 16 6, 12 2 Z';

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
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--gold-bright))" />
          <stop offset="100%" stopColor="rgb(var(--gold))" />
        </linearGradient>
        {/* clipPath couvre la moitié basse (y > 12) — seul le fill
            apparaît dans cette zone, le reste reste outline only */}
        <clipPath id={clipId}>
          <rect x="0" y="12" width="24" height="12" />
        </clipPath>
      </defs>

      {/* Outline complet (haut + bas) — visible partout, dessine le
          contour de toute la flamme */}
      <path
        d={flamePath}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Fill gradient gold, clippé à la moitié basse */}
      <path d={flamePath} fill={`url(#${gradId})`} clipPath={`url(#${clipId})`} />

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
