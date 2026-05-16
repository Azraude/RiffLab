import { useId, useState } from 'react';
import clsx from 'clsx';

/**
 * RiffLabLogo — flamme stylisée vintage premium, half-fill bottom.
 *
 * Session 18 fix : ni mask (session 16) ni clipPath (session 17) ne
 * rendaient le half-fill correctement sur tous les navigateurs.
 * Refait en **2 paths totalement indépendants** :
 *
 *   1. flameTop : moitié haute de la flamme, outline only (fill="none")
 *   2. flameBottom : moitié basse, fill gradient + même contour
 *
 * Les paths sont dessinés à la main pour se rejoindre exactement à la
 * ligne médiane y=12. Plus de risque de clip/mask qui se chie sur un
 * navigateur exotique — c'est juste deux <path> SVG natifs.
 *
 * Bonus session 18 : animation hover "la flamme s'enflamme" — au
 * mouseEnter, la moitié basse devient la flamme entière (le path
 * bottom est animé pour s'étendre vers le haut), au mouseLeave retour.
 */
interface RiffLabLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function RiffLabLogo({ size = 22, className, animated = true }: RiffLabLogoProps) {
  const id = useId().replace(/:/g, '_');
  const gradId = `flame-grad-${id}`;
  const [hover, setHover] = useState(false);

  // Path moitié haute : démarre au sommet, descend gauche, traverse à
  // y=12 vers la droite, remonte symétrique. Outline uniquement.
  const flameTopPath = 'M12 2 C 8 5, 6 8, 6 12 L 18 12 C 18 8, 16 5, 12 2 Z';

  // Path moitié basse : démarre à gauche y=12, descend, traverse en
  // bas, remonte à droite y=12. Le contour latéral suit la silhouette
  // naturelle de la flamme.
  const flameBottomPath =
    'M 6 12 C 6 16, 9 22, 12 22 C 15 22, 18 16, 18 12 L 6 12 Z';

  // Path full pour l'hover "enflammée" — la flamme entière fillée
  const flameFullPath =
    'M12 2 C 8 5, 6 8, 6 12 C 6 16, 9 22, 12 22 C 15 22, 18 16, 18 12 C 18 8, 16 5, 12 2 Z';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={clsx(animated && 'rifflab-flame-flicker', 'transition-all', className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="RiffLab"
      role="img"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--gold-bright))" />
          <stop offset="100%" stopColor="rgb(var(--gold))" />
        </linearGradient>
      </defs>

      {hover && animated ? (
        // État hover : flamme entièrement fillée + outline visible
        <path
          d={flameFullPath}
          fill={`url(#${gradId})`}
          stroke={`url(#${gradId})`}
          strokeWidth="1.5"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 6px rgb(var(--gold-glow) / 0.6))' }}
        />
      ) : (
        <>
          {/* Moitié haute : outline only */}
          <path
            d={flameTopPath}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Moitié basse : fill solid + outline */}
          <path
            d={flameBottomPath}
            fill={`url(#${gradId})`}
            stroke={`url(#${gradId})`}
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      )}

      {/* Petite étincelle au sommet */}
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
