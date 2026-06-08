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

/**
 * Skeleton plein écran pour SongDetail pendant le chargement Dexie.
 * Mirror la structure : breadcrumb, titre + meta, sections accords,
 * recorder. Évite le flash "Son introuvable" qui apparaissait pendant
 * les ~100-200ms du await useLiveQuery.
 */
export function SongDetailSkeleton() {
  return (
    <>
      <Skeleton className="h-4 w-32" rounded="md" />
      <div className="mt-6">
        <Skeleton className="h-10 w-2/3 max-w-sm" rounded="lg" />
        <Skeleton className="mt-3 h-4 w-1/3 max-w-xs" rounded="md" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-6 w-16" rounded="full" />
          <Skeleton className="h-6 w-20" rounded="full" />
          <Skeleton className="h-6 w-14" rounded="full" />
        </div>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-surface p-6">
            <Skeleton className="h-5 w-1/3" rounded="md" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Skeleton className="h-7 w-12" rounded="md" />
              <Skeleton className="h-7 w-14" rounded="md" />
              <Skeleton className="h-7 w-10" rounded="md" />
              <Skeleton className="h-7 w-12" rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Skeleton bloc générique réutilisable — utilisé sur SetlistDetail /
 * Composer / etc pendant le boot.
 */
export function PageBlockSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <Skeleton className="h-5 w-1/3" rounded="md" />
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" rounded="md" />
        ))}
      </div>
    </div>
  );
}
