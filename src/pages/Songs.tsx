import { Link, useLocation } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { TiltCard } from '@/components/ui/TiltCard';
import { SongTileSkeleton } from '@/components/ui/Skeleton';
import { countRecordingsBySong, db, type Song } from '@/lib/db';
import { Mic, Plus } from 'lucide-react';

export function Songs() {
  const songs = useLiveQuery(() => db.songs.orderBy('updatedAt').reverse().toArray(), []);
  const recCounts = useLiveQuery(() => countRecordingsBySong(), []);
  // Quand la route /songs/new est active, le Sheet de création est par-dessus :
  // on cache le FAB (sinon il transparaît à travers le backdrop).
  const location = useLocation();
  const isNewModalOpen = location.pathname === '/songs/new';

  return (
    <>
      <PageHeader
        title="Mes sons"
        subtitle={`${songs?.length ?? 0} sons dans ta bibliothèque.`}
      >
        {/* Header CTA — desktop only. Mobile uses the floating FAB. */}
        <Link
          to="/songs/new"
          className="hidden h-10 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-bg transition-all hover:bg-gold-bright md:inline-flex"
        >
          + Nouveau son
        </Link>
      </PageHeader>

      {!songs ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SongTileSkeleton key={i} />
          ))}
        </div>
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
            <SongTile key={s.id} song={s} recordingsCount={recCounts?.[s.id] ?? 0} />
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

function SongTile({ song, recordingsCount }: { song: Song; recordingsCount: number }) {
  const chords = Array.from(
    new Set(song.sections.flatMap((sec) => sec.chords.map((c) => c.name)))
  ).slice(0, 6);

  return (
    <TiltCard>
    <Link to={`/songs/${song.id}`} className="block">
      <Card hover>
        <h3 className="display text-[22px] leading-tight">{song.title || 'Sans titre'}</h3>
        {song.artist && <p className="mt-0.5 text-sm text-text-muted">{song.artist}</p>}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {chords.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-soft">
          <span>♩ {song.tempo} BPM</span>
          <span>
            {song.key} {song.mode === 'minor' ? 'min' : 'maj'}
          </span>
          {song.capo > 0 && <span>capo {song.capo}</span>}
          <span>● {song.status}</span>
          {recordingsCount > 0 && (
            <span className="inline-flex items-center gap-1 text-gold">
              <Mic size={11} /> {recordingsCount} essai{recordingsCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </Card>
    </Link>
    </TiltCard>
  );
}
