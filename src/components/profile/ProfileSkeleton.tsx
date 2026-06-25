/**
 * ProfileSkeleton — placeholder pour /profile et /u/:username pendant le
 * fetch Supabase (profil + riffs + counts + xp + badges). Câblé sur un VRAI
 * loading state async (contrairement aux pages riff mock synchrones).
 */
import { Skeleton } from '@/components/ui/Skeleton';

export function ProfileSkeleton() {
  return (
    <div>
      {/* Back link */}
      <Skeleton className="mb-4 h-4 w-28" />

      {/* Cover */}
      <Skeleton className="h-28 w-full sm:h-40" rounded="2xl" />

      {/* Avatar + identité (chevauche le cover) */}
      <div className="-mt-8 flex items-end gap-4 px-1">
        <Skeleton className="h-20 w-20 border-4 border-bg" rounded="full" />
        <div className="flex-1 space-y-2 pb-1">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-24" rounded="full" />
      </div>

      {/* Bio */}
      <div className="mt-4 space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>

      {/* Stats row */}
      <div className="mt-5 flex gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-5 w-10" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-9 w-24" rounded="full" />
        <Skeleton className="h-9 w-24" rounded="full" />
      </div>

      {/* Grid de cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" rounded="2xl" />
        ))}
      </div>
    </div>
  );
}
