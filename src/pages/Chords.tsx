import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import {
  CHORDS,
  QUALITY_ORDER,
  QUALITY_LABELS,
  type Chord,
} from '@/lib/chordDatabase';
import { NOTE_NAMES } from '@/lib/theory';
import { useAudio } from '@/hooks/useAudio';
import { ChevronDown, Play } from 'lucide-react';
import clsx from 'clsx';

type RootFilter = 'all' | (typeof NOTE_NAMES)[number];
type QualityFilter = 'all' | (typeof QUALITY_ORDER)[number];

export function Chords() {
  const [rootFilter, setRootFilter] = useState<RootFilter>('all');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const { strum } = useAudio();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return CHORDS.filter((c) => {
      if (rootFilter !== 'all' && c.root !== rootFilter) return false;
      if (qualityFilter !== 'all' && c.quality !== qualityFilter) return false;
      if (term && !c.name.toLowerCase().includes(term)) return false;
      return c.voicings.length > 0;
    });
  }, [rootFilter, qualityFilter, search]);

  return (
    <>
      <div className="mb-7">
        <h1 className="display text-display-md">Accords</h1>
        <p className="mt-1 text-text-muted">
          {CHORDS.length} accords. Tape une carte pour entendre. Tape{' '}
          <ChevronDown size={12} className="inline -mt-0.5" /> pour voir toutes
          les façons de la jouer sur le manche.
        </p>
      </div>

      {/* Tonalité — chips scrollables */}
      <div className="mb-3">
        <div className="label-small mb-2">Tonalité</div>
        <div className="-mx-2 overflow-x-auto px-2 pb-1">
          <div className="flex gap-2">
            <FilterChip active={rootFilter === 'all'} onClick={() => setRootFilter('all')}>
              Toutes
            </FilterChip>
            {NOTE_NAMES.map((n) => (
              <FilterChip
                key={n}
                active={rootFilter === n}
                onClick={() => setRootFilter(n)}
                mono
              >
                {n}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {/* Qualité — chips scrollables */}
      <div className="mb-3">
        <div className="label-small mb-2">Qualité</div>
        <div className="-mx-2 overflow-x-auto px-2 pb-1">
          <div className="flex gap-2">
            <FilterChip
              active={qualityFilter === 'all'}
              onClick={() => setQualityFilter('all')}
            >
              Toutes
            </FilterChip>
            {QUALITY_ORDER.map((q) => (
              <FilterChip
                key={q}
                active={qualityFilter === q}
                onClick={() => setQualityFilter(q)}
              >
                {QUALITY_LABELS[q] ?? q}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {/* Recherche */}
      <input
        type="text"
        placeholder="Chercher un accord (ex: Em7, F#m, Cmaj7)…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-5 h-11 w-full rounded-lg border border-border bg-surface px-4 text-sm placeholder:text-text-soft focus:border-gold-soft focus:outline-none md:h-10 md:max-w-md"
      />

      {/* Compteur de résultats */}
      <div className="mb-3 text-xs text-text-soft">
        {filtered.length} accord{filtered.length > 1 ? 's' : ''}
      </div>

      {/* Grille */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((c) => (
          <ChordEntry
            key={c.name}
            chord={c}
            isExpanded={expanded === c.name}
            onToggle={() => setExpanded((e) => (e === c.name ? null : c.name))}
            onPlay={() => strum(c.name)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-text-soft">
          Aucun accord ne correspond à ces filtres.
        </p>
      )}
    </>
  );
}

// ─── Chord entry (card + expanded voicings) ─────────────────────────────

function ChordEntry({
  chord,
  isExpanded,
  onToggle,
  onPlay,
}: {
  chord: Chord;
  isExpanded: boolean;
  onToggle: () => void;
  onPlay: () => void;
}) {
  const primary = chord.voicings[0];
  const hasMore = chord.voicings.length > 1;
  const isOpen = chord.category === 'open';

  return (
    <Card
      hover
      className={clsx(
        'flex flex-col p-4',
        isExpanded ? 'col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6' : '',
        isOpen && !isExpanded && 'border-gold-soft/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onPlay}
          className="flex flex-1 items-center gap-2 text-left"
          aria-label={`Jouer ${chord.name}`}
        >
          <span className="font-mono text-xl font-bold text-gold">{chord.name}</span>
          <span className="text-[10px] uppercase tracking-wider text-text-soft">
            {QUALITY_LABELS[chord.quality] ?? chord.quality}
          </span>
        </button>
        {hasMore && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? 'Réduire' : `Voir ${chord.voicings.length} voicings`}
            className={clsx(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition-all',
              isExpanded
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-border text-text-soft hover:border-gold-soft hover:text-text'
            )}
          >
            <ChevronDown
              size={16}
              className={clsx('transition-transform', isExpanded && 'rotate-180')}
            />
          </button>
        )}
      </div>

      {/* Voicing principal (toujours affiché) */}
      <div className="mt-3 flex justify-center">
        {primary && <ChordDiagram voicing={primary} name={chord.name} size="md" />}
      </div>

      {hasMore && !isExpanded && (
        <div className="mt-2 text-center text-[10px] uppercase tracking-wider text-text-soft">
          + {chord.voicings.length - 1} autre{chord.voicings.length - 1 > 1 ? 's' : ''}
          &nbsp;façon{chord.voicings.length - 1 > 1 ? 's' : ''}
        </div>
      )}

      {/* Voicings additionnels (visibles quand expand) */}
      {isExpanded && (
        <div className="mt-5 border-t border-border pt-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="label-small">Toutes les positions sur le manche</span>
            <button
              type="button"
              onClick={onPlay}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-gold px-2 text-xs hover:bg-gold/5"
            >
              <Play size={12} /> Écouter
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {chord.voicings.map((v, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-1 rounded-lg border border-border bg-surface-2 p-3"
              >
                <ChordDiagram voicing={v} name={chord.name} size="sm" />
                <DifficultyDots level={v.difficulty} />
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

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
        'inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-xs font-medium transition-colors',
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

function DifficultyDots({ level }: { level: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="mt-1 flex justify-center gap-0.5" aria-label={`Difficulté ${level}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={clsx(
            'h-1 w-2.5 rounded-full',
            i < level ? 'bg-gold' : 'bg-border'
          )}
        />
      ))}
    </div>
  );
}
