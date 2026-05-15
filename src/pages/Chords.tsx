import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { TiltCard } from '@/components/ui/TiltCard';
import { StaggerGrid, StaggerItem } from '@/components/ui/AnimatedSection';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import {
  CHORDS,
  QUALITY_ORDER,
  QUALITY_LABELS,
  type Chord,
} from '@/lib/chordDatabase';
import { NOTE_NAMES } from '@/lib/theory';
import { useAudio } from '@/hooks/useAudio';
import { Volume2 } from 'lucide-react';
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

      {/* Grille de cards swipeables — stagger entrée */}
      <StaggerGrid
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6"
        stagger={0.025}
      >
        {filtered.map((c) => (
          <StaggerItem key={c.name}>
            <TiltCard maxTilt={6}>
              <SwipeableChordCard chord={c} onPlay={() => strum(c.name)} />
            </TiltCard>
          </StaggerItem>
        ))}
      </StaggerGrid>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-text-soft">
          Aucun accord ne correspond à ces filtres.
        </p>
      )}
    </>
  );
}

// ─── Swipeable chord card ──────────────────────────────────────────────

// Option A retenue : AnimatePresence mode="popLayout" + variants slide
// directionnels. popLayout (vs "wait") laisse l'enter mounter immédiatement
// avec son own animation pendant que l'exit fade out → SVG passe direct au
// bon voicing sans flicker, contrairement à mode="wait" qui gardait le
// snapshot exitant figé (bug précédent).
// Option B (3 voicings absolute side-by-side) aurait été plus propre pour
// le swipe gesture continu, mais Option A est suffisante ici (le swipe est
// "discret" : un voicing à la fois).
const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

function SwipeableChordCard({ chord, onPlay }: { chord: Chord; onPlay: () => void }) {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(0);
  const voicing = chord.voicings[idx];
  const total = chord.voicings.length;
  const hasMultiple = total > 1;

  const goTo = (newIdx: number) => {
    const clamped = Math.max(0, Math.min(total - 1, newIdx));
    if (clamped === idx) return;
    setDirection(clamped > idx ? 1 : -1);
    setIdx(clamped);
  };

  return (
    <Card hover className="group relative flex flex-col p-3">
      {/* Volume icon top-right : signale que le card est cliquable et
          qu'on l'entend. Pulse au hover. */}
      <span
        className="pointer-events-none absolute right-2.5 top-2.5 text-text-soft transition-all group-hover:scale-110 group-hover:text-gold"
        aria-hidden
      >
        <Volume2 size={14} strokeWidth={1.8} />
      </span>
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

      {/* Zone swipe — drag horizontal pour changer de voicing. overflow-hidden
          contient les translations d'entrée/sortie. */}
      <div className="mt-2 select-none overflow-hidden">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.div
            key={idx}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ x: { type: 'spring', stiffness: 360, damping: 32 }, opacity: { duration: 0.15 } }}
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
        </AnimatePresence>
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
