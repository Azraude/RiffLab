/**
 * RiffCardSkeleton — placeholder pulse calibré sur RiffCard (h-[400px]
 * sm:h-[360px]) pour éviter le layout shift pendant un chargement async
 * (ex: feed Supabase à venir). Réutilisable partout où des cards riff
 * chargent réellement (non câblé sur /riffs car les données y sont
 * synchrones — mock COMMUNITY_RIFFS).
 */
import { Skeleton } from '@/components/ui/Skeleton';

export function RiffCardSkeleton() {
  return (
    <article className="flex h-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-surface-2 sm:h-[360px]">
      {/* Header */}
      <div className="flex items-center gap-2 p-3 pb-2">
        <Skeleton className="h-9 w-9" rounded="full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-2 w-16" />
        </div>
        <Skeleton className="h-5 w-16" rounded="full" />
      </div>

      {/* Titre */}
      <div className="px-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="mt-1 h-3 w-1/2" />
      </div>

      {/* Caption */}
      <div className="mt-2 space-y-1 px-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>

      {/* Tab preview */}
      <div className="mt-3 flex-1 space-y-1.5 px-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-2 w-full" />
        ))}
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between px-3 pt-1">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Footer actions */}
      <footer className="mt-2 flex items-center justify-between border-t border-border px-3 py-2">
        <div className="flex gap-3">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-12" />
        </div>
        <Skeleton className="h-6 w-6" />
      </footer>
    </article>
  );
}
