import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sheet } from '@/components/ui/Sheet';
import { StaggerGrid, StaggerItem } from '@/components/ui/AnimatedSection';
import {
  db,
  listSetlists,
  emptySetlist,
  saveSetlist,
  type Setlist,
  type Song,
} from '@/lib/db';
import { Plus, ListMusic } from 'lucide-react';
import { SetlistTileSkeleton } from '@/components/ui/SetlistTileSkeleton';

export function Setlists() {
  const setlists = useLiveQuery(() => listSetlists(), []);
  const songs = useLiveQuery(() => db.songs.toArray(), []);
  const songsById = new Map((songs ?? []).map((s) => [s.id, s] as const));
  const navigate = useNavigate();
  const [newOpen, setNewOpen] = useState(false);

  const handleCreate = async (name: string) => {
    const sl = emptySetlist({ name: name.trim() || 'Nouvelle setlist' });
    await saveSetlist(sl);
    setNewOpen(false);
    navigate(`/setlists/${sl.id}`);
  };

  return (
    <>
      <PageHeader
        title="Setlists"
        subtitle={`${setlists?.length ?? 0} setlist${(setlists?.length ?? 0) > 1 ? 's' : ''}. Pour enchaîner les morceaux en répèt ou en live.`}
      >
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="hidden h-10 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-bg transition-all hover:bg-gold-bright md:inline-flex"
        >
          + Nouvelle setlist
        </button>
      </PageHeader>

      {!setlists ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SetlistTileSkeleton key={i} />
          ))}
        </div>
      ) : setlists.length === 0 ? (
        <Card className="text-center py-12">
          <ListMusic size={32} className="mx-auto mb-3 text-gold-soft" strokeWidth={1.5} />
          <p className="text-text-muted">Pas encore de setlist.</p>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:bg-gold-bright md:h-10"
          >
            Créer ma première setlist
          </button>
        </Card>
      ) : (
        <StaggerGrid className="grid gap-5 sm:grid-cols-2 md:grid-cols-3" stagger={0.05}>
          {setlists.map((sl) => (
            <StaggerItem key={sl.id}>
              <SetlistTile setlist={sl} songsById={songsById} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}

      {/* Mobile FAB */}
      {!newOpen && (
        <button
          type="button"
          onClick={() => setNewOpen(true)}
          aria-label="Nouvelle setlist"
          className="fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-bg shadow-gold-strong transition-transform active:scale-95 md:hidden"
          style={{ bottom: 'calc(72px + env(safe-area-inset-bottom) + 1rem)' }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      )}

      {/* Modal nouvelle setlist (Sheet) */}
      <NewSetlistSheet open={newOpen} onOpenChange={setNewOpen} onCreate={handleCreate} />
    </>
  );
}

// ─── Tile ──────────────────────────────────────────────────────────────

function SetlistTile({
  setlist,
  songsById,
}: {
  setlist: Setlist;
  songsById: Map<string, Song>;
}) {
  const titles = setlist.songIds
    .map((id) => songsById.get(id)?.title)
    .filter((t): t is string => !!t)
    .slice(0, 4);
  const totalCount = setlist.songIds.length;

  return (
    <Link to={`/setlists/${setlist.id}`} className="block">
      <Card hover>
        <h3 className="display text-[22px] leading-tight">{setlist.name}</h3>
        <p className="mt-0.5 text-sm text-text-muted">
          {totalCount} song{totalCount > 1 ? 's' : ''}
        </p>
        {titles.length > 0 ? (
          <ul className="mt-4 space-y-1 text-sm text-text-muted">
            {titles.map((t, i) => (
              <li key={i} className="truncate">
                <span className="font-mono text-xs text-text-soft">{i + 1}.</span>{' '}
                {t}
              </li>
            ))}
            {totalCount > titles.length && (
              <li className="text-[11px] text-text-soft">
                + {totalCount - titles.length} autre{totalCount - titles.length > 1 ? 's' : ''}
              </li>
            )}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-text-soft">Setlist vide — ajoute des sons à l'intérieur.</p>
        )}
      </Card>
    </Link>
  );
}

// ─── Modal nouvelle setlist ────────────────────────────────────────────

function NewSetlistSheet({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void | Promise<void>;
}) {
  const [name, setName] = useState('');

  const submit = async () => {
    await onCreate(name);
    setName('');
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Nouvelle setlist"
      description="Donne-lui un nom, tu pourras ajouter les sons ensuite."
    >
      <div className="grid gap-5">
        <div>
          <div className="label-small mb-2">Nom</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ex: Répèt du jeudi, Set Bar Le Caveau…"
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm placeholder:text-text-soft focus:border-gold-soft focus:outline-none md:h-10"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm text-text-muted hover:text-text md:h-10"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright md:h-10"
          >
            Créer
          </button>
        </div>
      </div>
    </Sheet>
  );
}
