import { useState, useMemo } from 'react';
import { ChordCard } from '@/components/chord/ChordCard';
import { CHORDS, type Chord } from '@/lib/chordDatabase';
import { useAudio } from '@/hooks/useAudio';
import clsx from 'clsx';

const CATEGORIES: Array<{ id: Chord['category'] | 'all'; label: string }> = [
  { id: 'all', label: 'Tout' },
  { id: 'open', label: 'Ouverts' },
  { id: 'barre', label: 'Barrés' },
  { id: 'extended', label: 'Étendus' },
  { id: 'power', label: 'Power' },
];

export function Chords() {
  const [filter, setFilter] = useState<Chord['category'] | 'all'>('all');
  const [search, setSearch] = useState('');
  const { strum } = useAudio();

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return CHORDS.filter((c) => {
      if (filter !== 'all' && c.category !== filter) return false;
      if (term && !c.name.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [filter, search]);

  return (
    <>
      <div className="mb-9">
        <h1 className="display text-display-md">Accords</h1>
        <p className="mt-1 text-text-muted">
          {CHORDS.length} accords précodés. Clique sur une carte pour l'entendre.
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={clsx(
                'inline-flex h-11 items-center rounded-lg border px-4 text-sm font-medium transition-colors md:h-9 md:px-3 md:text-xs',
                filter === cat.id
                  ? 'border-gold bg-gold text-bg'
                  : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Chercher un accord (ex: Em, F#m7)…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm placeholder:text-text-soft focus:border-gold-soft focus:outline-none md:h-9 md:w-72"
        />
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((c) => (
          <ChordCard key={c.name} chord={c} onClick={() => strum(c.name)} showDifficulty />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-text-soft">Aucun accord ne correspond à ta recherche.</p>
      )}
    </>
  );
}
