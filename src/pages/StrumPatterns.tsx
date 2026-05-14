import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAudio } from '@/hooks/useAudio';
import {
  PRESET_PATTERNS,
  ALL_TAGS,
  cycleCell,
  cellSymbol,
  emptyPattern,
  type StrumPattern,
  type StrumCell,
} from '@/lib/strumPatterns';
import { Pause, Play, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import clsx from 'clsx';

const CHORD_OPTIONS = ['Em', 'G', 'C', 'D', 'Am', 'Cmaj7', 'A7', 'Dm'] as const;
type ChordChoice = (typeof CHORD_OPTIONS)[number];

/**
 * /strum-patterns — bibliothèque de patterns rythmiques + composer custom.
 *
 * - Liste filtrable de patterns précodés (par tag de style)
 * - Sélection d'un pattern → affichage gros, infos, play loop sur un accord
 * - Bouton "Custom" → ouvre l'éditeur grille cliquable (cycle D→U→X→A→.)
 * - Tempo slider 40-200 BPM, accord testeur configurable
 */
export function StrumPatterns() {
  const [selectedId, setSelectedId] = useState<string>(PRESET_PATTERNS[0].id);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [customPattern, setCustomPattern] = useState<StrumPattern | null>(null);
  const [editing, setEditing] = useState(false);

  const filtered = useMemo(() => {
    if (!tagFilter) return PRESET_PATTERNS;
    return PRESET_PATTERNS.filter((p) => p.tags.includes(tagFilter));
  }, [tagFilter]);

  const currentPattern: StrumPattern =
    (editing && customPattern)
      ? customPattern
      : PRESET_PATTERNS.find((p) => p.id === selectedId) ?? PRESET_PATTERNS[0];

  const handleStartCustom = () => {
    setCustomPattern(emptyPattern(8));
    setEditing(true);
  };

  const handleCancelCustom = () => {
    setEditing(false);
    setCustomPattern(null);
  };

  return (
    <>
      <PageHeader
        title="Strum Patterns"
        subtitle="Les rythmiques fondamentales — choisis-en une, joue avec, ou compose la tienne."
      />

      {/* Filtres par tag */}
      {!editing && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            aria-pressed={tagFilter === null}
            className={clsx(
              'inline-flex h-8 items-center rounded-full border px-3 text-xs uppercase tracking-wider transition-colors',
              tagFilter === null
                ? 'border-gold bg-gold text-bg'
                : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
            )}
          >
            Tous
          </button>
          {ALL_TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTagFilter(t)}
              aria-pressed={tagFilter === t}
              className={clsx(
                'inline-flex h-8 items-center rounded-full border px-3 text-xs uppercase tracking-wider transition-colors',
                tagFilter === t
                  ? 'border-gold bg-gold text-bg'
                  : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr,2fr]">
        {/* Liste / picker patterns */}
        {!editing && (
          <div>
            <div className="label-small mb-2">Patterns ({filtered.length})</div>
            <div className="grid gap-2 lg:max-h-[640px] lg:overflow-y-auto lg:pr-2">
              {filtered.map((p) => {
                const isSelected = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={clsx(
                      'flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                      isSelected
                        ? 'border-gold bg-gold/10'
                        : 'border-border bg-surface hover:border-gold-soft hover:bg-gold/5'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className={clsx('font-semibold', isSelected ? 'text-gold' : 'text-text')}>
                        {p.name}
                      </div>
                      <div className="mt-0.5 text-xs text-text-soft">
                        {p.subdivisions === 8 ? 'Croches' : 'Doubles-croches'} · {p.suggestedBpm}
                        {' BPM · diff '}
                        {p.difficulty}/5
                      </div>
                    </div>
                    <PatternMini pattern={p} />
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleStartCustom}
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-gold text-sm font-semibold text-text hover:bg-gold/5"
            >
              <Plus size={16} /> Composer mon pattern
            </button>
          </div>
        )}

        {/* Détail + player */}
        <PatternPlayer
          pattern={currentPattern}
          editable={editing}
          onChange={editing ? setCustomPattern : undefined}
          onCancel={editing ? handleCancelCustom : undefined}
        />
      </div>
    </>
  );
}

// ─── Pattern player + editor ──────────────────────────────────────────

function PatternPlayer({
  pattern,
  editable,
  onChange,
  onCancel,
}: {
  pattern: StrumPattern;
  editable: boolean;
  onChange?: (p: StrumPattern) => void;
  onCancel?: () => void;
}) {
  const { strum } = useAudio();
  const [tempo, setTempo] = useState<number>(pattern.suggestedBpm);
  const [chord, setChord] = useState<ChordChoice>('Em');
  const [playing, setPlaying] = useState(false);
  const [activeCellIdx, setActiveCellIdx] = useState<number | null>(null);
  const cancelRef = useRef(false);

  // Quand le pattern change, on stoppe la lecture et on ajuste le tempo
  useEffect(() => {
    setPlaying(false);
    setTempo(pattern.suggestedBpm);
  }, [pattern.id, pattern.suggestedBpm]);

  // Player en boucle
  useEffect(() => {
    if (!playing) {
      cancelRef.current = true;
      setActiveCellIdx(null);
      return;
    }
    cancelRef.current = false;
    // Durée d'une cellule = (60s / tempo) / (subdivisions / 4)
    // 4 = nombre de noires par mesure (4/4)
    // ex: tempo 100, sub 8 (croches) → cellMs = 600/2 = 300ms
    //     tempo 100, sub 16 → cellMs = 600/4 = 150ms
    const beatMs = 60000 / tempo;
    const cellMs = beatMs / (pattern.subdivisions / 4);
    let idx = 0;

    (async () => {
      while (!cancelRef.current) {
        const cell = pattern.cells[idx % pattern.cells.length];
        setActiveCellIdx(idx % pattern.cells.length);
        triggerCell(cell, chord, strum);
        await new Promise((r) => setTimeout(r, cellMs));
        idx++;
        // Stop sécurité après 32 mesures
        if (idx > pattern.cells.length * 32) {
          setPlaying(false);
          break;
        }
      }
      setActiveCellIdx(null);
    })();

    return () => {
      cancelRef.current = true;
    };
  }, [playing, tempo, pattern, chord, strum]);

  const handleCellClick = (i: number) => {
    if (!editable || !onChange) return;
    const next = [...pattern.cells];
    next[i] = cycleCell(next[i]);
    onChange({ ...pattern, cells: next });
  };

  const handleClear = () => {
    if (!editable || !onChange) return;
    onChange({
      ...pattern,
      cells: Array<StrumCell>(pattern.cells.length).fill('.'),
    });
  };

  const handleSwapSubdivisions = () => {
    if (!editable || !onChange) return;
    const newSub: 8 | 16 = pattern.subdivisions === 8 ? 16 : 8;
    onChange({
      ...pattern,
      subdivisions: newSub,
      cells: Array<StrumCell>(newSub).fill('.'),
    });
  };

  return (
    <Card>
      {/* En-tête pattern */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {editable && onChange ? (
            <input
              type="text"
              value={pattern.name}
              onChange={(e) => onChange({ ...pattern, name: e.target.value })}
              className="display w-full bg-transparent text-display-sm text-text outline-none focus:bg-surface-2 focus:rounded-md focus:px-2"
            />
          ) : (
            <h2 className="display text-display-sm">{pattern.name}</h2>
          )}
          {pattern.description && !editable && (
            <p className="mt-1 text-sm text-text-muted">{pattern.description}</p>
          )}
        </div>
        {editable && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Annuler"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Tags */}
      {!editable && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pattern.tags.map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="label-small">
            Grille · {pattern.subdivisions === 8 ? 'Croches' : 'Doubles-croches'}
          </div>
          {editable && (
            <button
              type="button"
              onClick={handleSwapSubdivisions}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-3 text-xs text-text-muted hover:text-text"
            >
              <RotateCcw size={12} />
              Passer en {pattern.subdivisions === 8 ? '16e' : '8e'}
            </button>
          )}
        </div>
        <PatternGrid
          pattern={pattern}
          activeIdx={activeCellIdx}
          editable={editable}
          onCellClick={handleCellClick}
        />
        {editable && (
          <div className="mt-3 flex items-center justify-between text-xs text-text-soft">
            <span>Clique pour cycler : · → ↓ → ↑ → × → ⤓ → ·</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-text-muted hover:text-danger"
            >
              Effacer
            </button>
          </div>
        )}
      </div>

      {/* Controls : chord + tempo */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="label-small mb-2">Accord testeur</div>
          <div className="flex flex-wrap gap-1.5">
            {CHORD_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setChord(c)}
                aria-pressed={chord === c}
                className={clsx(
                  'inline-flex h-9 items-center rounded-lg border px-3 font-mono text-sm font-bold transition-colors',
                  chord === c
                    ? 'border-gold bg-gold/15 text-gold'
                    : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label-small">Tempo</span>
            <span className="font-mono text-sm font-bold text-gold">{tempo} BPM</span>
          </div>
          <input
            type="range"
            min={40}
            max={200}
            step={1}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="w-full accent-gold"
          />
          <div className="mt-1 flex justify-between text-[10px] text-text-soft">
            <span>40</span>
            <span>{pattern.suggestedBpm} (conseillé)</span>
            <span>200</span>
          </div>
        </div>
      </div>

      {/* Play button */}
      <button
        type="button"
        onClick={() => setPlaying(!playing)}
        className={clsx(
          'mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-all',
          playing
            ? 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25'
            : 'bg-gold text-bg shadow-gold hover:bg-gold-bright hover:-translate-y-px'
        )}
      >
        {playing ? (
          <>
            <Pause size={20} fill="currentColor" /> Stop
          </>
        ) : (
          <>
            <Play size={20} fill="currentColor" /> Lancer la boucle
          </>
        )}
      </button>

      {editable && (
        <button
          type="button"
          onClick={() => alert('Sauvegarde Dexie à venir — pour l\'instant le pattern est volatile.')}
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-gold text-sm font-semibold text-text-muted hover:bg-gold/5"
        >
          <Save size={16} /> Sauver (bientôt)
        </button>
      )}
    </Card>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────

function PatternGrid({
  pattern,
  activeIdx,
  editable,
  onCellClick,
}: {
  pattern: StrumPattern;
  activeIdx: number | null;
  editable: boolean;
  onCellClick: (i: number) => void;
}) {
  // Sur mobile, 16 cellules par ligne c'est trop — on wrap en 2 lignes de 8.
  // Sur desktop, on garde une ligne complète via repeat(16).
  return (
    <div
      className={clsx(
        'grid gap-1.5 rounded-xl border border-border bg-surface-2 p-3',
        pattern.subdivisions === 16
          ? 'grid-cols-8 lg:grid-cols-[repeat(16,minmax(0,1fr))]'
          : 'grid-cols-8'
      )}
    >
      {pattern.cells.map((c, i) => {
        const isActive = activeIdx === i;
        const isBeat = pattern.subdivisions === 8 ? i % 2 === 0 : i % 4 === 0;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onCellClick(i)}
            disabled={!editable}
            className={clsx(
              'flex aspect-square items-center justify-center rounded-lg border font-mono text-base font-bold transition-all',
              isActive && 'scale-110 border-gold-bright bg-gold/20 text-gold-bright shadow-gold',
              !isActive && c === '.' && (isBeat ? 'border-border bg-surface text-text-soft' : 'border-border/60 bg-surface text-text-soft/50'),
              !isActive && c === 'D' && 'border-gold-soft bg-gold/10 text-gold',
              !isActive && c === 'U' && 'border-gold-soft bg-gold/10 text-gold',
              !isActive && c === 'A' && 'border-gold bg-gold/25 text-gold-bright',
              !isActive && c === 'X' && 'border-danger/40 bg-danger/10 text-danger',
              editable && 'cursor-pointer hover:scale-105',
              !editable && 'cursor-default'
            )}
            aria-label={`Cellule ${i + 1}: ${cellSymbol(c)}`}
          >
            {cellSymbol(c)}
          </button>
        );
      })}
    </div>
  );
}

function PatternMini({ pattern }: { pattern: StrumPattern }) {
  // Aperçu mini de 8 cellules (skip 1 sur 2 si pattern 16) — juste visuel
  const display = pattern.subdivisions === 16
    ? pattern.cells.filter((_, i) => i % 2 === 0)
    : pattern.cells;
  return (
    <div className="flex shrink-0 gap-0.5">
      {display.map((c, i) => (
        <span
          key={i}
          className={clsx(
            'inline-flex h-4 w-3 items-center justify-center rounded-sm font-mono text-[8px]',
            c === '.' ? 'bg-border/40 text-text-soft/40' : 'bg-gold/20 text-gold'
          )}
        >
          {c === '.' ? '·' : cellSymbol(c)}
        </span>
      ))}
    </div>
  );
}

// ─── Audio ────────────────────────────────────────────────────────────

function triggerCell(
  cell: StrumCell,
  chord: string,
  strum: (name: string, direction: 'down' | 'up') => Promise<void>
) {
  if (cell === '.' || cell === 'X') return; // X muet pour l'instant
  if (cell === 'U') void strum(chord, 'up');
  else void strum(chord, 'down'); // D, A
}
