import { Skeleton } from './Skeleton';

/**
 * SetlistTileSkeleton — placeholder pour les setlist cards dans la grid
 * /setlists pendant le load Dexie. Matche le SetlistTile réel pour
 * éviter le layout shift.
 */
export function SetlistTileSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6">
      <Skeleton className="h-6 w-3/4" rounded="md" />
      <Skeleton className="mt-2 h-4 w-1/3" rounded="md" />
      <div className="mt-4 space-y-1.5">
        <Skeleton className="h-3 w-4/5" rounded="md" />
        <Skeleton className="h-3 w-3/5" rounded="md" />
        <Skeleton className="h-3 w-2/3" rounded="md" />
      </div>
    </div>
  );
}
