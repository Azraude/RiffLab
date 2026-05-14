import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sheet } from '@/components/ui/Sheet';
import {
  db,
  getSetlist,
  saveSetlist,
  deleteSetlist,
  type Setlist,
  type Song,
} from '@/lib/db';
import { encodeSetlist, buildShareUrl, copyShareUrl } from '@/lib/share';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  Play,
  Plus,
  Share2,
  Trash2,
  X,
} from 'lucide-react';
import clsx from 'clsx';

export function SetlistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setlist = useLiveQuery(() => (id ? getSetlist(id) : undefined), [id]);
  const songs = useLiveQuery(() => db.songs.toArray(), []);
  const songsById = useMemo(
    () => new Map((songs ?? []).map((s) => [s.id, s] as const)),
    [songs]
  );

  const [addOpen, setAddOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  if (!setlist) {
    return (
      <>
        <Link to="/setlists" className="text-sm text-text-muted hover:text-gold">
          ← Setlists
        </Link>
        <p className="mt-6 text-text-muted">Setlist introuvable.</p>
      </>
    );
  }

  // Mutations
  const moveSong = async (idx: number, delta: -1 | 1) => {
    const newIdx = idx + delta;
    if (newIdx < 0 || newIdx >= setlist.songIds.length) return;
    const reordered = [...setlist.songIds];
    [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
    await saveSetlist({ ...setlist, songIds: reordered });
  };

  const removeSong = async (songId: string) => {
    await saveSetlist({
      ...setlist,
      songIds: setlist.songIds.filter((id) => id !== songId),
    });
  };

  const addSong = async (songId: string) => {
    if (setlist.songIds.includes(songId)) return;
    await saveSetlist({ ...setlist, songIds: [...setlist.songIds, songId] });
  };

  const renameSetlist = async () => {
    if (!tempName.trim()) {
      setEditingName(false);
      return;
    }
    await saveSetlist({ ...setlist, name: tempName.trim() });
    setEditingName(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer "${setlist.name}" ?`)) return;
    await deleteSetlist(setlist.id);
    navigate('/setlists');
  };

  const handleShare = async () => {
    // Encode setlist + full songs (le destinataire n'a pas nos IDs dans sa
    // DB locale). Le payload reste raisonnable : ~2kB par song.
    const orderedSongs = setlist.songIds
      .map((sid) => songsById.get(sid))
      .filter(Boolean) as Song[];
    if (orderedSongs.length === 0) {
      alert('Ajoute au moins un son avant de partager.');
      return;
    }
    const encoded = encodeSetlist(setlist, orderedSongs);
    const url = buildShareUrl(encoded);
    const ok = await copyShareUrl(url);
    if (ok) alert('Lien de partage copié — colle-le dans WhatsApp/Discord/etc.');
  };

  const ordered = setlist.songIds.map((id) => songsById.get(id)).filter(Boolean);
  const availableSongs = (songs ?? []).filter((s) => !setlist.songIds.includes(s.id));

  return (
    <>
      <Link to="/setlists" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-gold">
        <ChevronLeft size={14} /> Setlists
      </Link>

      <div className="mt-4 mb-8 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {editingName ? (
            <input
              type="text"
              defaultValue={setlist.name}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={renameSetlist}
              onKeyDown={(e) => {
                if (e.key === 'Enter') renameSetlist();
                if (e.key === 'Escape') setEditingName(false);
              }}
              autoFocus
              className="display w-full bg-transparent text-display-md outline-none focus:border-b focus:border-gold-soft"
            />
          ) : (
            <h1
              className="display text-display-md cursor-text"
              onClick={() => {
                setTempName(setlist.name);
                setEditingName(true);
              }}
              title="Cliquer pour renommer"
            >
              {setlist.name}
            </h1>
          )}
          <p className="mt-1 text-text-muted">
            {setlist.songIds.length} song{setlist.songIds.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={handleShare}
          aria-label="Partager"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border text-text-muted hover:border-gold-soft hover:text-text md:h-10 md:w-10"
        >
          <Share2 size={16} />
        </button>
      </div>

      {/* CTA mode lecture */}
      {setlist.songIds.length > 0 && (
        <Link
          to={`/setlists/${setlist.id}/play`}
          className="mb-8 inline-flex h-12 items-center gap-2 rounded-2xl bg-gold px-6 text-base font-semibold text-bg shadow-gold hover:bg-gold-bright"
        >
          <Play size={18} fill="currentColor" /> Démarrer le mode lecture
        </Link>
      )}

      {/* Liste des songs (ordonnables) */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div className="eyebrow">Songs dans cette setlist</div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            disabled={availableSongs.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-gold px-3 text-xs hover:bg-gold/5 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Plus size={14} /> Ajouter un son
          </button>
        </div>

        {ordered.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-soft">
            Setlist vide. Ajoute des songs ci-dessus.
          </p>
        ) : (
          <ul className="space-y-2">
            {ordered.map((song, idx) => {
              if (!song) return null;
              return (
                <li
                  key={song.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2"
                >
                  <span className="font-mono text-xs text-text-soft w-5 text-center">
                    {idx + 1}.
                  </span>
                  <Link
                    to={`/songs/${song.id}`}
                    className="min-w-0 flex-1 truncate text-sm hover:text-gold"
                  >
                    <span className="font-semibold">{song.title}</span>
                    {song.artist && (
                      <span className="ml-2 text-xs text-text-muted">{song.artist}</span>
                    )}
                    <span className="ml-2 text-[10px] text-text-soft">
                      {song.key}
                      {song.mode === 'minor' ? 'm' : ''} · {song.tempo}bpm
                    </span>
                  </Link>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSong(idx, -1)}
                      disabled={idx === 0}
                      aria-label="Monter"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-text-soft hover:bg-surface hover:text-text disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSong(idx, 1)}
                      disabled={idx === ordered.length - 1}
                      aria-label="Descendre"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-text-soft hover:bg-surface hover:text-text disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSong(song.id)}
                      aria-label="Retirer de la setlist"
                      className="flex h-8 w-8 items-center justify-center rounded-md text-text-soft hover:bg-danger/10 hover:text-danger"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Zone dangereuse */}
      <div className="mt-12 mb-6 rounded-2xl border border-danger/30 bg-danger/5 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-danger">Zone dangereuse</div>
            <p className="mt-0.5 text-xs text-text-muted">
              Supprimer cette setlist est irréversible. Les sons restent dans ta bibliothèque.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-danger/50 bg-transparent px-4 text-sm font-semibold text-danger hover:bg-danger/10 md:h-10"
          >
            <Trash2 size={16} /> Supprimer cette setlist
          </button>
        </div>
      </div>

      {/* Sheet "Ajouter un son" */}
      <AddSongSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        availableSongs={availableSongs}
        onPick={async (songId) => {
          await addSong(songId);
          setAddOpen(false);
        }}
      />
    </>
  );
}

// ─── Sheet ajout song ─────────────────────────────────────────────────

function AddSongSheet({
  open,
  onOpenChange,
  availableSongs,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableSongs: Song[];
  onPick: (songId: string) => void | Promise<void>;
}) {
  const songs = availableSongs;
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Ajouter un son"
      description={`${songs.length} song${songs.length > 1 ? 's' : ''} disponible${songs.length > 1 ? 's' : ''} dans ta bibliothèque`}
    >
      {songs.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-soft">
          Tous tes sons sont déjà dans cette setlist. Crée-en de nouveaux depuis Mes sons.
        </p>
      ) : (
        <ul className="grid gap-2">
          {songs.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onPick(s.id)}
                className={clsx(
                  'w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-left transition-colors',
                  'hover:border-gold-soft hover:bg-gold/5'
                )}
              >
                <div className="font-semibold">{s.title}</div>
                {s.artist && (
                  <div className="mt-0.5 text-xs text-text-muted">{s.artist}</div>
                )}
                <div className="mt-1 text-[10px] text-text-soft">
                  {s.key}
                  {s.mode === 'minor' ? 'm' : ''} · {s.tempo} bpm
                  {s.capo > 0 && ` · capo ${s.capo}`}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

// Type silence the `Setlist` reference used implicitly above.
export type { Setlist };
