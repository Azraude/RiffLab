import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import { db, getSetlist } from '@/lib/db';
import { getChord, getDefaultVoicing } from '@/lib/chordDatabase';
import { useAudio } from '@/hooks/useAudio';
import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import clsx from 'clsx';

/**
 * Mode lecture setlist — enchaîne les songs en plein focus.
 *
 * Pas une reprise de SongDetail (pour garder le live-friendly épuré).
 * Affichage : grosse zone titre + sections + accords cliquables pour
 * écouter. Header sticky avec progression "Song N/M → Suivant : X" + nav.
 *
 * Ne couvre PAS le teleprompter lyrics : c'est Phase 3.5 (mapping
 * chord↔syllabe à trancher).
 */
export function SetlistPlay() {
  const { id } = useParams();
  const navigate = useNavigate();
  const setlist = useLiveQuery(() => (id ? getSetlist(id) : undefined), [id]);
  const songs = useLiveQuery(() => db.songs.toArray(), []);
  const songsById = useMemo(
    () => new Map((songs ?? []).map((s) => [s.id, s] as const)),
    [songs]
  );
  const [pos, setPos] = useState(0);
  const { strum } = useAudio();
  const [activeChord, setActiveChord] = useState<string | null>(null);

  // Reset pos quand la setlist change
  useEffect(() => {
    setPos(0);
  }, [id]);

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

  if (setlist.songIds.length === 0) {
    return (
      <>
        <Link
          to={`/setlists/${setlist.id}`}
          className="text-sm text-text-muted hover:text-gold"
        >
          ← {setlist.name}
        </Link>
        <Card className="mt-6 text-center py-12">
          <p className="text-text-muted">Setlist vide — ajoute des sons avant la lecture.</p>
        </Card>
      </>
    );
  }

  const total = setlist.songIds.length;
  const currentSong = songsById.get(setlist.songIds[pos]);
  const nextSong = pos + 1 < total ? songsById.get(setlist.songIds[pos + 1]) : null;
  const isLast = pos === total - 1;
  const isFirst = pos === 0;

  const handleChordClick = async (name: string) => {
    setActiveChord(name);
    await strum(name, 'down');
    setTimeout(() => setActiveChord(null), 400);
  };

  if (!currentSong) {
    return (
      <Card className="text-center py-12">
        <p className="text-text-muted">Song introuvable dans cette setlist.</p>
        <button
          type="button"
          onClick={() => setPos((p) => Math.min(total - 1, p + 1))}
          className="mt-4 text-sm text-gold hover:text-gold-bright"
        >
          Suivant →
        </button>
      </Card>
    );
  }

  const uniqueChords = Array.from(
    new Set(currentSong.sections.flatMap((sec) => sec.chords.map((c) => c.name)))
  );

  return (
    <>
      {/* Header sticky : progression + nav */}
      <div className="sticky top-0 z-20 -mx-5 mb-6 border-b border-border bg-bg/95 px-5 py-3 backdrop-blur md:-mx-12 md:px-12">
        <div className="flex items-center justify-between gap-3">
          <Link
            to={`/setlists/${setlist.id}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-soft hover:bg-surface-2 hover:text-text"
            aria-label="Quitter la lecture"
          >
            <X size={18} />
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <div className="label-small">{setlist.name}</div>
            <div className="mt-0.5 text-xs text-text-muted">
              Song {pos + 1}/{total}
              {nextSong && (
                <>
                  {' · '}
                  <span className="text-text-soft">Suivant : </span>
                  <span className="text-text">{nextSong.title}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setPos((p) => Math.max(0, p - 1))}
              disabled={isFirst}
              aria-label="Song précédent"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:border-gold-soft hover:text-text disabled:opacity-30 disabled:hover:border-border disabled:hover:text-text-muted"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() =>
                isLast ? navigate(`/setlists/${setlist.id}`) : setPos((p) => p + 1)
              }
              aria-label={isLast ? 'Terminer la setlist' : 'Song suivant'}
              className={clsx(
                'flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold',
                isLast
                  ? 'bg-success/20 text-success hover:bg-success/30'
                  : 'bg-gold text-bg hover:bg-gold-bright'
              )}
            >
              {isLast ? 'Terminer' : 'Suivant'}
              {!isLast && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Big title */}
      <div className="mb-8 text-center">
        <h1 className="display text-display-lg md:text-display-xl">{currentSong.title}</h1>
        {currentSong.artist && (
          <p className="mt-1 text-text-muted">{currentSong.artist}</p>
        )}
        <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-text-soft">
          <span>♩ {currentSong.tempo} BPM</span>
          <span>
            {currentSong.key} {currentSong.mode === 'minor' ? 'min' : 'maj'}
          </span>
          {currentSong.capo > 0 && <span>capo {currentSong.capo}</span>}
        </div>
      </div>

      {/* Chord palette */}
      <div className="mb-8">
        <h2 className="eyebrow mb-3">Accords du morceau</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
          {uniqueChords.map((name) => {
            const voicing = getDefaultVoicing(name);
            const chord = getChord(name);
            return (
              <Card
                key={name}
                hover
                className={clsx(
                  'cursor-pointer text-center p-4',
                  activeChord === name && 'border-gold shadow-gold'
                )}
                onClick={() => handleChordClick(name)}
              >
                <div className="font-mono text-lg font-bold text-gold">{name}</div>
                <div className="mt-2 flex justify-center">
                  {voicing ? (
                    <ChordDiagram voicing={voicing} name={name} size="sm" />
                  ) : (
                    <div className="text-[10px] text-text-soft">Diagramme à venir</div>
                  )}
                </div>
                {chord && (
                  <div className="mt-1 text-[10px] uppercase tracking-wider text-text-soft">
                    {chord.quality}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Sections + progressions */}
      <div className="space-y-5">
        {currentSong.sections.map((sec) => (
          <Card key={sec.id}>
            <h3 className="display text-display-sm mb-4">{sec.name}</h3>
            <div className="flex flex-wrap gap-2">
              {sec.chords.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleChordClick(c.name)}
                  className={clsx(
                    'flex h-11 items-center gap-2 rounded-lg border px-3 transition-all md:h-auto md:py-2',
                    activeChord === c.name
                      ? 'border-gold bg-gold/10'
                      : 'border-border bg-surface hover:border-gold-soft'
                  )}
                >
                  <span className="font-mono text-sm font-bold text-gold">{c.name}</span>
                  <span className="text-[10px] text-text-soft">{c.beats}t</span>
                </button>
              ))}
              {sec.chords.length === 0 && (
                <span className="text-sm text-text-soft">Aucun accord dans cette section.</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Big Next button at bottom */}
      <div className="mt-12 mb-8 flex justify-center">
        <button
          type="button"
          onClick={() =>
            isLast ? navigate(`/setlists/${setlist.id}`) : setPos((p) => p + 1)
          }
          className={clsx(
            'inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-8 text-base font-semibold shadow-gold',
            isLast
              ? 'bg-success/15 text-success border border-success/40'
              : 'bg-gold text-bg hover:bg-gold-bright hover:-translate-y-px transition-all'
          )}
        >
          {isLast ? (
            <>
              ✓ Terminer la setlist
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" /> Song suivant — {nextSong?.title}
            </>
          )}
        </button>
      </div>
    </>
  );
}
