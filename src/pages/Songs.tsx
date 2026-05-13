import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { db, type Song } from '@/lib/db';
import { Trash2 } from 'lucide-react';

export function Songs() {
  const songs = useLiveQuery(() => db.songs.orderBy('updatedAt').reverse().toArray(), []);

  return (
    <>
      <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="display text-display-md">Mes sons</h1>
          <p className="mt-1 text-text-muted">
            {songs?.length ?? 0} sons dans ta bibliothèque.
          </p>
        </div>
        <Link
          to="/songs/new"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-bg transition-all hover:bg-gold-bright"
        >
          + Nouveau son
        </Link>
      </div>

      {!songs ? (
        <div className="text-text-soft">Chargement…</div>
      ) : songs.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-text-muted">Aucun son pour l'instant.</p>
          <Link
            to="/songs/new"
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:bg-gold-bright"
          >
            Ajouter ton premier son
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-3">
          {songs.map((s) => (
            <SongTile key={s.id} song={s} />
          ))}
        </div>
      )}
    </>
  );
}

function SongTile({ song }: { song: Song }) {
  const chords = Array.from(
    new Set(song.sections.flatMap((sec) => sec.chords.map((c) => c.name)))
  ).slice(0, 6);

  return (
    <Card hover className="group relative">
      <Link to={`/songs/${song.id}`} className="block">
        <h3 className="display text-[22px] leading-tight">{song.title || 'Sans titre'}</h3>
        {song.artist && <p className="mt-0.5 text-sm text-text-muted">{song.artist}</p>}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {chords.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-soft">
          <span>♩ {song.tempo} BPM</span>
          <span>
            {song.key} {song.mode === 'minor' ? 'min' : 'maj'}
          </span>
          {song.capo > 0 && <span>capo {song.capo}</span>}
          <span>● {song.status}</span>
        </div>
      </Link>
      <button
        onClick={async (e) => {
          e.preventDefault();
          if (confirm(`Supprimer "${song.title}" ?`)) {
            await db.songs.delete(song.id);
          }
        }}
        className="absolute right-3 top-3 rounded-md p-1.5 text-text-soft opacity-0 transition-opacity hover:bg-surface-2 hover:text-danger group-hover:opacity-100"
        aria-label="Supprimer"
      >
        <Trash2 size={16} />
      </button>
    </Card>
  );
}
