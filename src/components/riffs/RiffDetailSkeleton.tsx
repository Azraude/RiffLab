/**
 * RiffDetailSkeleton — placeholder pour la page détail riff pendant un
 * chargement async (ex: riff Supabase par UUID). Mirror du layout :
 * header, titre+auteur, note, bouton lecture, tab, annotations.
 * Non câblé sur /riffs/:id pour les riffs mock (synchrones).
 */
import { Skeleton } from '@/components/ui/Skeleton';

export function RiffDetailSkeleton() {
  return (
    <div className="pb-12">
      {/* Header back + menu */}
      <div className="-mx-5 -mt-6 flex items-center justify-between border-b border-border px-3 py-2 md:-mx-12 md:px-12">
        <Skeleton className="h-10 w-10" rounded="full" />
        <Skeleton className="h-10 w-10" rounded="full" />
      </div>

      {/* Titre + artiste */}
      <div className="pt-5">
        <Skeleton className="h-8 w-2/3" rounded="lg" />
        <Skeleton className="mt-2 h-4 w-1/3" />

        {/* Auteur + follow */}
        <div className="mt-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10" rounded="full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-2 w-20" />
          </div>
          <Skeleton className="h-9 w-20" rounded="full" />
        </div>
      </div>

      {/* Note auteur */}
      <Skeleton className="mt-5 h-20 w-full" rounded="2xl" />

      {/* Bouton Lire avec l'audio */}
      <div className="mt-5 rounded-2xl border border-border bg-surface-2 p-4">
        <Skeleton className="h-14 w-full" rounded="xl" />
        <Skeleton className="mx-auto mt-3 h-3 w-40" />
      </div>

      {/* Tab */}
      <Skeleton className="mt-6 h-32 w-full" rounded="2xl" />

      {/* Annotations */}
      <div className="mt-6 space-y-2">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" rounded="xl" />
        ))}
      </div>
    </div>
  );
}
