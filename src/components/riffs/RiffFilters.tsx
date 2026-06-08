/**
 * RiffFilters — Sheet de filtres avancés pour /riffs (sess 27 Phase 1).
 *
 * Contenu :
 *  - Genres (multi-select chips)
 *  - Techniques (multi-select chips)
 *  - Niveau (radio 4 couleurs)
 *  - BPM range (slider double-handle simulé via 2 inputs)
 *  - Tri (radio)
 *
 * Footer sticky : "Effacer tout" + "Voir N résultats"
 */
import { Sheet } from '@/components/ui/Sheet';
import {
  ALL_RIFF_TAGS,
  ALL_RIFF_TECHNIQUES,
  TECHNIQUE_LABELS,
  LEVEL_LABELS,
  LEVEL_COLORS,
  type RiffTag,
  type RiffTechnique,
  type RiffLevel,
} from '@/lib/communityRiffs';
import clsx from 'clsx';

export type SortMode = 'relevance' | 'popular' | 'recent' | 'bpm';

export interface RiffFilterState {
  genres: RiffTag[];
  techniques: RiffTechnique[];
  levels: RiffLevel[];
  bpmMin: number;
  bpmMax: number;
  sort: SortMode;
}

export const EMPTY_FILTERS: RiffFilterState = {
  genres: [],
  techniques: [],
  levels: [],
  bpmMin: 40,
  bpmMax: 240,
  sort: 'relevance',
};

/** Compte le nombre de filtres actifs (≠ default) — utilisé pour le badge */
export function activeFilterCount(f: RiffFilterState): number {
  let n = 0;
  n += f.genres.length;
  n += f.techniques.length;
  n += f.levels.length;
  if (f.bpmMin > 40 || f.bpmMax < 240) n += 1;
  if (f.sort !== 'relevance') n += 1;
  return n;
}

interface RiffFiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: RiffFilterState;
  onChange: (f: RiffFilterState) => void;
  resultCount: number;
}

export function RiffFilters({
  open,
  onOpenChange,
  filters,
  onChange,
  resultCount,
}: RiffFiltersProps) {
  const toggleGenre = (g: RiffTag) =>
    onChange({
      ...filters,
      genres: filters.genres.includes(g)
        ? filters.genres.filter((x) => x !== g)
        : [...filters.genres, g],
    });
  const toggleTechnique = (t: RiffTechnique) =>
    onChange({
      ...filters,
      techniques: filters.techniques.includes(t)
        ? filters.techniques.filter((x) => x !== t)
        : [...filters.techniques, t],
    });
  const toggleLevel = (l: RiffLevel) =>
    onChange({
      ...filters,
      levels: filters.levels.includes(l)
        ? filters.levels.filter((x) => x !== l)
        : [...filters.levels, l],
    });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filtrer les riffs"
      description="Combine plusieurs critères pour trouver exactement ce que tu cherches."
    >
      <div className="space-y-6 pb-24">
        {/* Genre */}
        <Section title="Genre">
          <div className="flex flex-wrap gap-2">
            {ALL_RIFF_TAGS.map((g) => (
              <Chip
                key={g}
                active={filters.genres.includes(g)}
                onClick={() => toggleGenre(g)}
              >
                #{g}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Technique */}
        <Section title="Technique">
          <div className="flex flex-wrap gap-2">
            {ALL_RIFF_TECHNIQUES.map((t) => (
              <Chip
                key={t}
                active={filters.techniques.includes(t)}
                onClick={() => toggleTechnique(t)}
              >
                {TECHNIQUE_LABELS[t]}
              </Chip>
            ))}
          </div>
        </Section>

        {/* Difficulté */}
        <Section title="Difficulté">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['beginner', 'intermediate', 'advanced', 'expert'] as RiffLevel[]).map((l) => {
              const active = filters.levels.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() => toggleLevel(l)}
                  className={clsx(
                    'inline-flex h-11 items-center justify-center rounded-xl border text-xs font-semibold transition-colors',
                    active ? LEVEL_COLORS[l] : 'border-border bg-surface-2 text-text-muted hover:border-gold-soft'
                  )}
                >
                  {LEVEL_LABELS[l]}
                </button>
              );
            })}
          </div>
        </Section>

        {/* BPM range */}
        <Section title="Tempo">
          <div className="flex items-center justify-between text-sm">
            <span className="font-mono text-gold">{filters.bpmMin} BPM</span>
            <span className="text-text-soft">→</span>
            <span className="font-mono text-gold">{filters.bpmMax} BPM</span>
          </div>
          <div className="mt-2 space-y-2">
            <input
              type="range"
              min={40}
              max={240}
              step={5}
              value={filters.bpmMin}
              onChange={(e) =>
                onChange({ ...filters, bpmMin: Math.min(Number(e.target.value), filters.bpmMax) })
              }
              className="w-full accent-gold"
              aria-label="BPM minimum"
            />
            <input
              type="range"
              min={40}
              max={240}
              step={5}
              value={filters.bpmMax}
              onChange={(e) =>
                onChange({ ...filters, bpmMax: Math.max(Number(e.target.value), filters.bpmMin) })
              }
              className="w-full accent-gold"
              aria-label="BPM maximum"
            />
          </div>
        </Section>

        {/* Sort */}
        <Section title="Trier par">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(
              [
                ['relevance', 'Pertinence'],
                ['popular', 'Popularité'],
                ['recent', 'Récents'],
                ['bpm', 'BPM ↑'],
              ] as Array<[SortMode, string]>
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ ...filters, sort: key })}
                className={clsx(
                  'inline-flex h-10 items-center justify-center rounded-xl border text-xs font-semibold transition-colors',
                  filters.sort === key
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-border bg-surface-2 text-text-muted hover:border-gold-soft'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Footer sticky */}
      <div className="sticky bottom-0 -mx-5 -mb-6 flex gap-3 border-t border-border bg-surface/95 px-5 py-4 backdrop-blur-md md:-mx-6 md:px-6">
        <button
          type="button"
          onClick={() => onChange(EMPTY_FILTERS)}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm text-text-muted hover:text-text"
        >
          Effacer
        </button>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-semibold text-bg hover:-translate-y-px"
        >
          Voir {resultCount} résultat{resultCount > 1 ? 's' : ''}
        </button>
      </div>
    </Sheet>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-small mb-3">{title}</div>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'inline-flex h-9 items-center rounded-full border px-3 text-xs font-medium transition-colors',
        active
          ? 'border-gold bg-gold/15 text-gold'
          : 'border-border bg-surface-2 text-text-muted hover:border-gold-soft hover:text-text'
      )}
    >
      {children}
    </button>
  );
}
