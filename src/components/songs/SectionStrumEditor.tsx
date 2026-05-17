/**
 * SectionStrumEditor — mini éditeur de strum pattern in-form.
 *
 * Embarqué dans `SongForm` pour chaque section. Permet :
 * - choisir une subdivision (croches = 8 cellules, doubles-croches = 16)
 * - clicker une cellule pour cycler ↓ → ↑ → · → ↓
 * - appliquer un preset depuis `PRESET_PATTERNS`
 * - clear/reset le pattern
 *
 * Le pattern est stocké au format `StrumPattern` de db.ts (beats: StrumDir[]).
 * On convertit avec `cellToStrumDir` / `strumDirToCell` au passage du
 * format interne `StrumCell[]` (réutilise les helpers de strumPatterns.ts).
 *
 * Pas de preview audio inline pour rester léger — la page /strum-patterns
 * reste le full composer si l'utilisateur veut tester à l'oreille.
 */
import { useState } from 'react';
import {
  PRESET_PATTERNS,
  cycleCell,
  cellSymbol,
  emptyPattern,
  type StrumCell,
} from '@/lib/strumPatterns';
import type { StrumPattern as DbStrumPattern, StrumDir } from '@/lib/db';
import { Music, X } from 'lucide-react';
import clsx from 'clsx';

interface SectionStrumEditorProps {
  value?: DbStrumPattern;
  onChange: (pattern: DbStrumPattern | undefined) => void;
}

function cellToStrumDir(c: StrumCell): StrumDir {
  switch (c) {
    case 'D':
    case 'A':
      return 'down';
    case 'U':
      return 'up';
    case 'X':
      return 'mute';
    case '.':
      return 'rest';
  }
}

function strumDirToCell(d: StrumDir): StrumCell {
  switch (d) {
    case 'down':
      return 'D';
    case 'up':
      return 'U';
    case 'mute':
      return 'X';
    case 'rest':
      return '.';
  }
}

function dbToCells(p: DbStrumPattern | undefined, fallbackSub: 8 | 16): {
  cells: StrumCell[];
  subdivisions: 8 | 16;
} {
  if (!p) {
    return {
      cells: Array<StrumCell>(fallbackSub).fill('.'),
      subdivisions: fallbackSub,
    };
  }
  const sub: 8 | 16 = p.subdivision === 16 ? 16 : 8;
  const cells = p.beats.map(strumDirToCell);
  // Pad ou trim pour matcher subdivisions
  while (cells.length < sub) cells.push('.');
  cells.length = sub;
  return { cells, subdivisions: sub };
}

function cellsToDb(cells: StrumCell[], subdivisions: 8 | 16): DbStrumPattern {
  return {
    beats: cells.map(cellToStrumDir),
    subdivision: subdivisions,
  };
}

export function SectionStrumEditor({ value, onChange }: SectionStrumEditorProps) {
  // Edition expanded uniquement quand l'utilisateur choisit de configurer un
  // pattern. Évite d'encombrer le form pour les sections sans rythmique.
  const [expanded, setExpanded] = useState<boolean>(Boolean(value));

  if (!expanded && !value) {
    return (
      <div className="mt-3 flex justify-start">
        <button
          type="button"
          onClick={() => {
            setExpanded(true);
            onChange(cellsToDb(Array<StrumCell>(8).fill('.'), 8));
          }}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-border px-3 text-xs text-text-soft transition-colors hover:border-gold-soft hover:text-gold"
        >
          <Music size={12} /> Ajouter une rythmique
        </button>
      </div>
    );
  }

  const { cells, subdivisions } = dbToCells(value, 8);

  const setCells = (next: StrumCell[]) =>
    onChange(cellsToDb(next, subdivisions));

  const setSubdivisions = (next: 8 | 16) => {
    const empty = Array<StrumCell>(next).fill('.');
    // Copie les cellules existantes (étend ou tronque)
    cells.forEach((c, i) => {
      if (i < next) empty[i] = c;
    });
    onChange(cellsToDb(empty, next));
  };

  const handleCellClick = (i: number) => {
    const next = [...cells];
    next[i] = cycleCell(next[i]);
    setCells(next);
  };

  const applyPreset = (id: string) => {
    if (!id) return;
    const preset = PRESET_PATTERNS.find((p) => p.id === id);
    if (!preset) return;
    const sub: 8 | 16 = preset.subdivisions;
    // Trim à 1 mesure si le preset est sur 2 mesures
    const presetCells = preset.cells.slice(0, sub);
    while (presetCells.length < sub) presetCells.push('.');
    onChange(cellsToDb(presetCells, sub));
  };

  const clear = () => {
    onChange(undefined);
    setExpanded(false);
  };

  return (
    <div className="mt-3 rounded-lg border border-border bg-surface/60 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="label-small">Rythmique</div>
        <button
          type="button"
          onClick={clear}
          className="flex h-7 w-7 items-center justify-center rounded-md text-text-soft hover:bg-surface-2 hover:text-danger"
          aria-label="Retirer la rythmique"
        >
          <X size={14} />
        </button>
      </div>

      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        <select
          aria-label="Preset rythmique"
          value=""
          onChange={(e) => {
            applyPreset(e.target.value);
            e.currentTarget.value = '';
          }}
          className="h-8 rounded-md border border-border bg-surface px-2 text-xs text-text-muted focus:border-gold-soft focus:outline-none"
        >
          <option value="">Preset…</option>
          {PRESET_PATTERNS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="inline-flex h-8 overflow-hidden rounded-md border border-border">
          {[8, 16].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSubdivisions(s as 8 | 16)}
              className={clsx(
                'px-2.5 text-[11px] font-mono transition-colors',
                subdivisions === s
                  ? 'bg-gold/15 text-gold'
                  : 'text-text-soft hover:bg-surface-2',
              )}
            >
              {s === 8 ? '8e' : '16e'}
            </button>
          ))}
        </div>
      </div>

      <div
        className={clsx(
          'grid gap-1',
          subdivisions === 8
            ? 'grid-cols-8'
            : 'grid-cols-8 sm:grid-cols-16',
        )}
      >
        {cells.map((c, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleCellClick(i)}
            aria-label={`Cellule ${i + 1} : ${cellSymbol(c)}`}
            className={clsx(
              'flex h-9 items-center justify-center rounded border font-mono text-sm transition-colors',
              c === '.'
                ? 'border-border bg-surface text-text-soft hover:border-gold-soft'
                : c === 'D' || c === 'A'
                ? 'border-gold-soft bg-gold/15 text-gold-bright'
                : c === 'U'
                ? 'border-gold-soft/70 bg-gold/10 text-gold'
                : 'border-border-gold/50 bg-danger/10 text-danger',
              // Accent visuel sur les premiers de chaque temps
              i % (subdivisions === 8 ? 2 : 4) === 0 && 'ring-1 ring-gold/20',
            )}
          >
            {cellSymbol(c)}
          </button>
        ))}
      </div>

      <div className="mt-2 text-[10px] text-text-soft">
        Click : · → ↓ → ↑ → × → ⤓ → ·  ·  ↓ down, ↑ up, × mute, ⤓ accent
      </div>
    </div>
  );
}
