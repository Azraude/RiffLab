import clsx from 'clsx';
import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  style?: CSSProperties;
}

/**
 * Skeleton — placeholder pour les loading states. Background gradient
 * `skeleton-shimmer` défini dans globals.css : passe un sweep gold subtil
 * de gauche à droite en 1.6s linear infinite.
 *
 * Usage :
 *   <Skeleton className="h-6 w-32" />
 *   <Skeleton width={120} height={40} rounded="xl" />
 *
 * Combine librement les props ou les classes utilitaires Tailwind.
 */
export function Skeleton({
  className,
  width,
  height,
  rounded = 'md',
  style,
}: SkeletonProps) {
  const roundedClass = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  }[rounded];

  return (
    <div
      className={clsx('skeleton-shimmer', roundedClass, className)}
      style={{
        width,
        height,
        ...style,
      }}
      aria-hidden
    />
  );
}

/** Carte placeholder pour les grids de Songs/Recent — taille calibrée
 *  pour matcher le rendu réel et éviter le layout shift. */
export function SongTileSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <Skeleton className="h-6 w-3/4" rounded="md" />
      <Skeleton className="mt-2 h-4 w-1/2" rounded="md" />
      <div className="mt-4 flex gap-1.5">
        <Skeleton className="h-5 w-10" rounded="md" />
        <Skeleton className="h-5 w-10" rounded="md" />
        <Skeleton className="h-5 w-10" rounded="md" />
      </div>
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-3 w-14" rounded="md" />
        <Skeleton className="h-3 w-10" rounded="md" />
        <Skeleton className="h-3 w-12" rounded="md" />
      </div>
    </div>
  );
}
