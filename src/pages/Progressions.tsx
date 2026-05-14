import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Sheet } from '@/components/ui/Sheet';
import {
  PROGRESSIONS,
  ALL_MOODS,
  MOOD_LABELS,
  transposeProgression,
  type Mood,
  type Progression,
  type Difficulty,
} from '@/lib/progressionDatabase';
import { db, newSectionId, saveSong, type Song } from '@/lib/db';
import { NOTE_NAMES, type NoteName } from '@/lib/theory';
import { useAudio } from '@/hooks/useAudio';
import { Play, Pause, Plus, Sparkles } from 'lucide-react';
import clsx from 'clsx';

type RootFilter = 'all' | NoteName;
type MoodFilter = 'all' | Mood;
type DiffFilter = 'all' | Difficulty;

export function Progressions() {
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('all');
  const [rootFilter, setRootFilter] = useState<RootFilter>('all');
  const [diffFilter, setDiffFilter] = useState<DiffFilter>('all');
  const [targetRoot, setTargetRoot] = useState<NoteName>('C');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [addToSongFor, setAddToSongFor] = useState<Progression | null>(null);

  const filtered = useMemo(() => {
    return PROGRESSIONS.filter((p) => {
      if (moodFilter !== 'all' && !p.moods.includes(moodFilter)) return false;
      if (diffFilter !== 'all' && p.difficulty !== diffFilter) return false;
      // Filtre par root cible = pas pertinent pour le filtrage,
      // la transposition recompose toutes les progressions dans le target.
      // On garde rootFilter pour usage futur si besoin.
      if (rootFilter !== 'all' && p.refRoot !== rootFilter) return false;
      return true;
    });
  }, [moodFilter, rootFilter, diffFilter]);

  return (
    <>
      <PageHeader
        title="Progressions"
        subtitle={`${PROGRESSIONS.length} progressions classiques, taggées par mood. Transpose live, écoute en boucle, ajoute à un song en 1 tap.`}
      />

      {/* Filters */}
      <div className="mb-3">
        <div className="label-small mb-2">Mood</div>
        <div className="-mx-2 overflow-x-auto px-2 pb-1">
          <div className="flex gap-2">
            <FilterChip active={moodFilter === 'all'} onClick={() => setMoodFilter('all')}>
              Tous
            </FilterChip>
            {ALL_MOODS.map((m) => (
              <FilterChip
                key={m}
                active={moodFilter === m}
                onClick={() => setMoodFilter(m)}
              >
                {MOOD_LABELS[m]}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3">
        <div className="label-small mb-2">Difficulté</div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={diffFilter === 'all'} onClick={() => setDiffFilter('all')}>
            Toutes
          </FilterChip>
          {[1, 2, 3, 4, 5].map((d) => (
            <FilterChip
              key={d}
              active={diffFilter === d}
              onClick={() => setDiffFilter(d as Difficulty)}
            >
              <span className="inline-flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={clsx(
                      'h-1 w-1.5 rounded-full',
                      i < d ? 'bg-current' : 'bg-current opacity-25'
                    )}
                  />
                ))}
              </span>
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <div className="label-small mb-2">
          Tonalité cible — toutes les progressions seront transposées
        </div>
        <div className="-mx-2 overflow-x-auto px-2 pb-1">
          <div className="flex gap-2">
            {NOTE_NAMES.map((n) => (
              <FilterChip
                key={n}
                active={targetRoot === n}
                onClick={() => setTargetRoot(n)}
                mono
              >
                {n}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-3 text-xs text-text-soft">
        {filtered.length} progression{filtered.length > 1 ? 's' : ''}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((prog) => (
          <ProgressionCard
            key={prog.id}
            progression={prog}
            targetRoot={targetRoot}
            isPlaying={playingId === prog.id}
            onPlay={() => setPlayingId(playingId === prog.id ? null : prog.id)}
            onAddToSong={() => setAddToSongFor(prog)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-text-soft">
          Aucune progression ne correspond à ces filtres.
        </p>
      )}

      {/* Sheet "Ajouter à un song" */}
      <AddToSongSheet
        progression={addToSongFor}
        targetRoot={targetRoot}
        onClose={() => setAddToSongFor(null)}
      />
    </>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────

function ProgressionCard({
  progression,
  targetRoot,
  isPlaying,
  onPlay,
  onAddToSong,
}: {
  progression: Progression;
  targetRoot: NoteName;
  isPlaying: boolean;
  onPlay: () => void;
  onAddToSong: () => void;
}) {
  const { strum } = useAudio();
  const chords = useMemo(
    () => transposeProgression(progression, targetRoot),
    [progression, targetRoot]
  );
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const stopRef = useRef<boolean>(false);
  const onPlayRef = useRef(onPlay);
  onPlayRef.current = onPlay;

  // Pilote la boucle quand isPlaying change. Limité à 4 cycles avant
  // auto-stop pour éviter une boucle infinie en arrière-plan.
  useEffect(() => {
    if (!isPlaying) {
      stopRef.current = true;
      setActiveIdx(null);
      return;
    }
    stopRef.current = false;
    const tempo = 100;
    const beatMs = 60000 / tempo;
    const cycles = 4;
    let idx = 0;
    const total = chords.length * cycles;
    let cancelled = false;

    (async () => {
      while (idx < total && !stopRef.current && !cancelled) {
        const c = chords[idx % chords.length];
        if (cancelled) break;
        setActiveIdx(idx % chords.length);
        void strum(c.name, 'down');
        await new Promise((r) => setTimeout(r, c.beats * beatMs));
        idx++;
      }
      if (!cancelled) {
        setActiveIdx(null);
        if (idx >= total) onPlayRef.current(); // toggle off via parent
      }
    })();

    return () => {
      cancelled = true;
      stopRef.current = true;
      setActiveIdx(null);
    };
  }, [isPlaying, chords, strum]);

  return (
    <Card hover className="flex flex-col">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="display text-display-sm leading-tight">{progression.name}</h3>
          <div className="mt-0.5 font-mono text-xs text-gold">{progression.degrees}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className={clsx(
                'h-1.5 w-2 rounded-full',
                i < progression.difficulty ? 'bg-gold' : 'bg-border'
              )}
            />
          ))}
        </div>
      </div>

      <p className="mt-2 text-sm text-text-muted">{progression.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {progression.moods.map((m) => (
          <span
            key={m}
            className="rounded-md bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold"
          >
            {MOOD_LABELS[m]}
          </span>
        ))}
      </div>

      {progression.examples && (
        <p className="mt-2 text-xs text-text-soft">{progression.examples}</p>
      )}

      {/* Chords transposés */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {chords.map((c, i) => (
          <div
            key={i}
            className={clsx(
              'flex h-9 items-center rounded-lg border px-2.5 font-mono text-sm font-bold transition-colors',
              activeIdx === i
                ? 'border-gold bg-gold/15 text-gold-bright shadow-gold'
                : 'border-border bg-surface-2 text-gold'
            )}
          >
            {c.name}
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onPlay}
          className={clsx(
            'inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors',
            isPlaying
              ? 'bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25'
              : 'bg-gold text-bg hover:bg-gold-bright'
          )}
        >
          {isPlaying ? (
            <>
              <Pause size={14} fill="currentColor" /> Stop loop
            </>
          ) : (
            <>
              <Play size={14} fill="currentColor" /> Écouter
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onAddToSong}
          aria-label="Ajouter à un song"
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border-gold px-3 text-xs hover:bg-gold/5"
        >
          <Plus size={14} /> + son
        </button>
      </div>
    </Card>
  );
}

// ─── Sheet ajouter à un song ──────────────────────────────────────────

function AddToSongSheet({
  progression,
  targetRoot,
  onClose,
}: {
  progression: Progression | null;
  targetRoot: NoteName;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const songs = useLiveQuery(() => db.songs.toArray(), []);

  const handlePick = async (song: Song) => {
    if (!progression) return;
    const chords = transposeProgression(progression, targetRoot);
    const newSection = {
      id: newSectionId(),
      name: progression.name,
      chords: chords.map((c) => ({ name: c.name, beats: c.beats })),
    };
    await saveSong({
      ...song,
      sections: [...song.sections, newSection],
    });
    onClose();
    navigate(`/songs/${song.id}`);
  };

  return (
    <Sheet
      open={progression !== null}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      title="Ajouter à un song"
      description={
        progression
          ? `${progression.name} en ${targetRoot} sera ajouté comme nouvelle section.`
          : undefined
      }
    >
      {!songs || songs.length === 0 ? (
        <p className="py-6 text-center text-sm text-text-soft">
          Aucun song dans ta bibliothèque. Crée-en un d'abord.
        </p>
      ) : (
        <ul className="grid gap-2">
          {songs.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => handlePick(s)}
                className="w-full rounded-xl border border-border bg-surface-2 px-4 py-3 text-left transition-colors hover:border-gold-soft hover:bg-gold/5"
              >
                <div className="font-semibold">{s.title}</div>
                {s.artist && <div className="mt-0.5 text-xs text-text-muted">{s.artist}</div>}
                <div className="mt-1 text-[10px] text-text-soft">
                  {s.key}
                  {s.mode === 'minor' ? 'm' : ''} · {s.tempo} bpm · {s.sections.length} sections
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

// ─── Filter chip ───────────────────────────────────────────────────────

function FilterChip({
  active,
  onClick,
  mono,
  children,
}: {
  active: boolean;
  onClick: () => void;
  mono?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'inline-flex h-9 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors',
        mono && 'font-mono',
        active
          ? 'border-gold bg-gold text-bg'
          : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
      )}
    >
      {children}
    </button>
  );
}

// silence Sparkles unused
void Sparkles;
