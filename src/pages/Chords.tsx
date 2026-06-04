import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { TiltCard } from '@/components/ui/TiltCard';
import { SwipeableChordCard } from '@/components/chord/SwipeableChordCard';
import { CHORDS, QUALITY_ORDER, QUALITY_LABELS } from '@/lib/chordDatabase';
import { NOTE_NAMES } from '@/lib/theory';
import { useAudio } from '@/hooks/useAudio';
import { markInteraction } from '@/lib/db';
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

      {/* Grille de cards swipeables — pas de StaggerGrid ici car la grille
          est sous 2 filtres + recherche, donc < 15% visible au mount →
          whileInView ne trigger pas et toutes les cards restent
          opacity:0 (régression bug session 16 fix session 17). */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((c) => (
          <TiltCard key={c.name} maxTilt={6}>
            <SwipeableChordCard
              chord={c}
              onPlay={() => {
                void strum(c.name);
                // Log l'interaction pour l'auto-validation Practice Plan
                void markInteraction('chord', c.name);
              }}
            />
          </TiltCard>
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

// SwipeableChordCard extrait dans @/components/chord/SwipeableChordCard
// (cf session compositeur) pour réutilisation sur /composer.

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
