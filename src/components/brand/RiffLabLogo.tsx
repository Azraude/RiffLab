import { useId } from 'react';
import clsx from 'clsx';

/**
 * RiffLabLogo — flamme half-fill v3, technique imparable.
 *
 * Sessions précédentes :
 * - v1 (session 16) : mask SVG → ne rendait pas sur certains browsers
 * - v2 (session 17) : clipPath → idem
 * - v3 (session 18) : 2 paths indépendants → marchait mais Melvin
 *   signalait que la flamme apparaissait pleine selon le contexte
 *   (probable conflit avec un état React conditionnel quelque part)
 *
 * v4 (session 19) — UN SEUL path avec linearGradient à STOPS DUPLIQUÉS
 * au même offset (50%). Le 1er stop à 50% est transparent (opacity 0),
 * le 2e stop à 50% est gold solide (opacity 1) — ce qui crée une coupe
 * NETTE à la ligne médiane. Impossible à foirer car :
 * - 1 seul path → pas de synchro entre 2 paths
 * - Aucun clipping → marche sur tous browsers nativement
 * - Le stroke trace l'outline complet sur toute la silhouette
 *
 * La flamme est CONSTANTE par défaut : pas d'état React qui toggle.
 * Animation flicker via classe CSS uniquement.
 */
interface RiffLabLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export function RiffLabLogo({ size = 22, className, animated = true }: RiffLabLogoProps) {
  const id = useId().replace(/:/g, '_');
  const gradId = `flame-${id}`;

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
        {/* Gradient avec coupe nette à 50% via stops dupliqués :
            - 0-50% : transparent (la moitié haute reste juste outline)
            - 50-100% : gold (la moitié basse est filled en dégradé gold) */}
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0" />
          <stop offset="50%" stopColor="rgb(var(--gold))" stopOpacity="0" />
          <stop offset="50%" stopColor="rgb(var(--gold))" stopOpacity="1" />
          <stop offset="100%" stopColor="rgb(var(--gold-bright))" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* UN SEUL path : fill = gradient (half transparent / half gold),
          stroke = outline gold solide qui trace toute la silhouette. */}
      <path
        d="M12 2 C 8 5, 6 8, 6 12 C 6 16, 9 22, 12 22 C 15 22, 18 16, 18 12 C 18 8, 16 5, 12 2 Z"
        fill={`url(#${gradId})`}
        stroke="rgb(var(--gold))"
        strokeWidth="1.5"
        strokeLinejoin="round"
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
