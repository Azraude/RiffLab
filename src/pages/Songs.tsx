import { Link, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { db, type Song } from '@/lib/db';
import { useLongPress } from '@/hooks/useLongPress';
import { Plus, Trash2 } from 'lucide-react';

export function Songs() {
  const songs = useLiveQuery(() => db.songs.orderBy('updatedAt').reverse().toArray(), []);
  // Quand la route /songs/new est active, le Sheet de création est par-dessus :
  // on cache le FAB (sinon il transparaît à travers le backdrop).
  const location = useLocation();
  const isNewModalOpen = location.pathname === '/songs/new';

  return (
    <>
      <div className="mb-9 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="display text-display-md">Mes sons</h1>
          <p className="mt-1 text-text-muted">
            {songs?.length ?? 0} sons dans ta bibliothèque.{' '}
            <span className="md:hidden">Appui long sur une carte = supprimer.</span>
          </p>
        </div>
        {/* Header CTA — desktop only. Mobile uses the floating FAB below. */}
        <Link
          to="/songs/new"
          className="hidden h-10 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-bg transition-all hover:bg-gold-bright md:inline-flex"
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
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:bg-gold-bright md:h-10"
          >
            Ajouter ton premier son
          </Link>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {songs.map((s) => (
            <SongTile key={s.id} song={s} />
          ))}
        </div>
      )}

      {/* Mobile FAB — sits above the bottom nav + safe-area. Caché quand
          le modal /songs/new est ouvert. */}
      {!isNewModalOpen && (
        <Link
          to="/songs/new"
          aria-label="Ajouter un son"
          className="fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-bg shadow-gold-strong transition-transform active:scale-95 md:hidden"
          style={{ bottom: 'calc(72px + env(safe-area-inset-bottom) + 1rem)' }}
        >
          <Plus size={26} strokeWidth={2.5} />
        </Link>
      )}
    </>
  );
}

function SongTile({ song }: { song: Song }) {
  const chords = Array.from(
    new Set(song.sections.flatMap((sec) => sec.chords.map((c) => c.name)))
  ).slice(0, 6);

  const deleteSong = async () => {
    if (confirm(`Supprimer "${song.title}" ?`)) {
      await db.songs.delete(song.id);
    }
  };

  const longPress = useLongPress(deleteSong, 550);

  return (
    <Card hover className="group relative select-none" {...longPress.handlers}>
      <Link
        to={`/songs/${song.id}`}
        onClick={(e) => {
          if (longPress.wasLongPress()) e.preventDefault();
        }}
        className="block"
      >
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
      {/* Desktop : hover reveals trash. Mobile : long-press the card. */}
      <button
        onClick={async (e) => {
          e.preventDefault();
          await deleteSong();
        }}
        className="absolute right-3 top-3 hidden h-8 w-8 items-center justify-center rounded-md text-text-soft opacity-0 transition-opacity hover:bg-surface-2 hover:text-danger group-hover:opacity-100 md:flex"
        aria-label="Supprimer"
      >
        <Trash2 size={16} />
      </button>
    </Card>
  );
}
