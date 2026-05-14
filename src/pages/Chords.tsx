import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import {
  CHORDS,
  QUALITY_ORDER,
  QUALITY_LABELS,
  type Chord,
} from '@/lib/chordDatabase';
import { NOTE_NAMES } from '@/lib/theory';
import { useAudio } from '@/hooks/useAudio';
import clsx from 'clsx';

type RootFilter = 'all' | (typeof NOTE_NAMES)[number];
type QualityFilter = 'all' | (typeof QUALITY_ORDER)[number];

export function Chords() {
  const [rootFilter, setRootFilter] = useState<RootFilter>('all');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [search, setSearch] = useState('');
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
      <PageHeader
        title="Accords"
        subtitle={`${CHORDS.length} accords. Tape une carte pour entendre, swipe pour voir d'autres positions.`}
      />

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

      {/* Grille de cards swipeables */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((c) => (
          <SwipeableChordCard key={c.name} chord={c} onPlay={() => strum(c.name)} />
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

// ─── Swipeable chord card ──────────────────────────────────────────────

function SwipeableChordCard({ chord, onPlay }: { chord: Chord; onPlay: () => void }) {
  const [idx, setIdx] = useState(0);
  const voicing = chord.voicings[idx];
  const total = chord.voicings.length;
  const hasMultiple = total > 1;

  const goTo = (newIdx: number) => {
    const clamped = Math.max(0, Math.min(total - 1, newIdx));
    if (clamped === idx) return;
    setIdx(clamped);
  };

  return (
    <Card hover className="flex flex-col p-3">
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Jouer ${chord.name}`}
        className="flex items-baseline gap-2 text-left"
      >
        <span className="font-mono text-xl font-bold text-gold">{chord.name}</span>
        <span className="text-[10px] uppercase tracking-wider text-text-soft">
          {QUALITY_LABELS[chord.quality] ?? chord.quality}
        </span>
      </button>

      {/* Zone swipe — drag horizontal pour changer de voicing.
          Re-mount via key={idx} → la motion.div retombe à x=0 entre les
          changements de voicing (effet "snap"). */}
      <div className="mt-2 select-none">
        <motion.div
          key={idx}
          initial={{ x: 0 }}
          animate={{ x: 0 }}
          drag={hasMultiple ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragEnd={(_, info) => {
            const threshold = 50;
            if (info.offset.x < -threshold || info.velocity.x < -400) {
              goTo(idx + 1);
            } else if (info.offset.x > threshold || info.velocity.x > 400) {
              goTo(idx - 1);
            }
          }}
          className={clsx(
            'flex justify-center',
            hasMultiple && 'cursor-grab active:cursor-grabbing'
          )}
        >
          <ChordDiagram voicing={voicing} name={chord.name} size="md" />
        </motion.div>
      </div>

      {/* Indicateurs pagination — petits traits gold si plusieurs voicings */}
      {hasMultiple && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {chord.voicings.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goTo(i);
              }}
              aria-label={`Voicing ${i + 1} sur ${total}`}
              aria-current={i === idx}
              className={clsx(
                'h-1 rounded-full transition-all',
                i === idx ? 'w-6 bg-gold' : 'w-2 bg-border hover:bg-gold-soft'
              )}
            />
          ))}
        </div>
      )}
    </Card>
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
