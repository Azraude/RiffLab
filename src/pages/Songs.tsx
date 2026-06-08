import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { TiltCard } from '@/components/ui/TiltCard';
import { SongTileSkeleton } from '@/components/ui/Skeleton';
import { StaggerGrid, StaggerItem } from '@/components/ui/AnimatedSection';
import { EmptyState } from '@/components/ui/EmptyState';
import { countRecordingsBySong, db, seedIfEmpty, type Song } from '@/lib/db';
import { Dices, Mic, Music2, Plus } from 'lucide-react';

export function Songs() {
  const { t } = useTranslation();
  const songs = useLiveQuery(() => db.songs.orderBy('updatedAt').reverse().toArray(), []);
  const recCounts = useLiveQuery(() => countRecordingsBySong(), []);
  // Quand la route /songs/new est active, le Sheet de création est par-dessus :
  // on cache le FAB (sinon il transparaît à travers le backdrop).
  const location = useLocation();
  const navigate = useNavigate();
  const isNewModalOpen = location.pathname === '/songs/new';

  /**
   * Random song picker — bonus : pondéré pour pousser le backlog "à bosser".
   * Si plusieurs songs marqués "à bosser", 60% chance pick parmi eux.
   * Sinon random total sur la bibliothèque. Pas d'effet si <2 sons.
   */
  const handleRandomSong = async () => {
    const allSongs = await db.songs.toArray();
    if (allSongs.length === 0) return;
    if (allSongs.length === 1) {
      navigate(`/songs/${allSongs[0].id}`);
      return;
    }
    const toWork = allSongs.filter((s) => s.status === 'à bosser');
    const pool =
      toWork.length >= 2 && Math.random() < 0.6 ? toWork : allSongs;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    navigate(`/songs/${picked.id}`);
  };

  const songsCount = songs?.length ?? 0;
  const canRandom = songsCount >= 2;

  return (
    <>
      <PageHeader
        title={t('songs.title')}
        subtitle={
          songsCount > 1
            ? t('songs.countOther', { count: songsCount })
            : t('songs.countOne', { count: songsCount })
        }
      >
        <div className="hidden gap-2 md:flex">
          {/* Bouton "Au hasard" — pondéré pour pousser le backlog "à bosser" */}
          {canRandom && (
            <button
              type="button"
              onClick={handleRandomSong}
              aria-label={t('songs.randomAria')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border-gold bg-surface px-4 text-sm font-semibold text-text transition-colors hover:bg-gold/5"
            >
              <Dices size={14} className="text-gold" /> {t('songs.random')}
            </button>
          )}
          {/* Header CTA — desktop only. Mobile uses the floating FAB.
              Variant "hero" : gradient gold + sheen au hover pour distinguer
              cette action critique du reste. */}
          <Link
            to="/songs/new"
            className="group relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px"
          >
            <span className="pointer-events-none absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 group-hover:left-full" />
            <span className="relative inline-flex items-center gap-2">
              <span className="font-serif italic text-base leading-none transition-transform group-hover:rotate-90">+</span>
              {t('songs.newSong')}
            </span>
          </Link>
        </div>
      </PageHeader>

      {!songs ? (
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SongTileSkeleton key={i} />
          ))}
        </div>
      ) : songs.length === 0 ? (
        <EmptyState
          icon={Music2}
          title={t('songs.emptyTitle')}
          description={t('songs.emptyDescription')}
          primaryAction={{
            label: t('songs.emptyPrimary'),
            onClick: () => navigate('/songs/new'),
          }}
          secondaryAction={{
            label: t('songs.emptySecondary'),
            onClick: () => void seedIfEmpty(),
            sublabel: t('songs.emptySublabel'),
          }}
        />
      ) : (
        <StaggerGrid className="grid gap-5 sm:grid-cols-2 md:grid-cols-3" stagger={0.04}>
          {songs.map((s) => (
            <StaggerItem key={s.id}>
              <SongTile song={s} recordingsCount={recCounts?.[s.id] ?? 0} />
            </StaggerItem>
          ))}
        </StaggerGrid>
      )}

      {/* Mobile FAB — sits above the bottom nav + safe-area. Caché quand
          le modal /songs/new est ouvert. */}
      {!isNewModalOpen && (
        <Link
          to="/songs/new"
          aria-label={t('songs.newSongFab')}
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
