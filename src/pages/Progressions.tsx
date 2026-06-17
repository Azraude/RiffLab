/**
 * /progressions — Studio simple (sess STUDIO-V2).
 *
 * Refonte simplificatrice : 1 seule vue, 4 cards d'accords pré-générées
 * au mount, cadenas par card. Lock un slot → auto-régen des slots À
 * DROITE non-lockés.
 *
 * Pas de tabs, pas de Classiques, pas de Communauté. Épure max.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Lock, Unlock, Play, Pause, Sparkles, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from '@/components/ui/PageHeader';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import {
  suggestNextChord,
  STYLE_META,
  type ProgressionStyle,
} from '@/lib/progressionTheory';
import { NOTE_NAMES, type NoteName } from '@/lib/theory';
import { getChord } from '@/lib/chordDatabase';
import { useAudio } from '@/hooks/useAudio';

const LENGTH = 4;
const PROG_TEMPO = 80; // BPM lecture séquentielle

/**
 * Pick aléatoire pondéré dans un set de suggestions (top-5 typique).
 * Évite l'écueil "algo déterministe → toujours même top1 → regen visuelle nulle".
 * Bias vers les hauts scores : pondération = score^2 pour favoriser les meilleurs
 * sans pour autant n'en jouer qu'un.
 */
function weightedPick<T extends { score: number; chord: string }>(
  suggestions: T[],
  excludeChord?: string,
): T | undefined {
  const pool = suggestions.filter((s) => s.chord !== excludeChord);
  const eligible = pool.length > 0 ? pool : suggestions;
  if (eligible.length === 0) return undefined;
  const weights = eligible.map((s) => Math.max(1, s.score) ** 2);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < eligible.length; i++) {
    r -= weights[i];
    if (r <= 0) return eligible[i];
  }
  return eligible[eligible.length - 1];
}

/** Génère une progression cascade en piochant random pondéré à chaque étape. */
function generateRandomProgression(
  key: NoteName,
  mode: 'major' | 'minor',
  styles: ProgressionStyle[],
  length: number,
): string[] {
  const out: string[] = [];
  for (let i = 0; i < length; i++) {
    const sugg = suggestNextChord(out, key, mode, styles, 5);
    const pick = weightedPick(sugg);
    out.push(pick?.chord ?? key);
  }
  return out;
}

export function Progressions() {
  const [keyName, setKeyName] = useState<NoteName>('C');
  const [mode, setMode] = useState<'major' | 'minor'>('major');
  const [styles, setStyles] = useState<ProgressionStyle[]>(['pop']);
  const [progression, setProgression] = useState<string[]>(() =>
    generateRandomProgression('C', 'major', ['pop'], LENGTH),
  );
  const [locks, setLocks] = useState<boolean[]>(() => Array(LENGTH).fill(false));
  const [playingProgIdx, setPlayingProgIdx] = useState<number | null>(null);
  const cancelProgRef = useRef(false);
  const { strum } = useAudio();

  /**
   * Reset locks + regen complet quand key/mode/styles change. Géré séparé
   * du mount initial via un flag (sinon double-régen au premier render).
   */
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    const fresh = generateRandomProgression(keyName, mode, styles, LENGTH);
    setProgression(fresh);
    setLocks(Array(LENGTH).fill(false));
  }, [keyName, mode, styles]);

  /**
   * Toggle lock d'un slot. Si lock activé → auto-régen tous les slots à
   * droite non-lockés en respectant l'historique cadence.
   */
  const toggleLock = useCallback(
    (idx: number) => {
      setLocks((prevLocks) => {
        const nextLocks = [...prevLocks];
        nextLocks[idx] = !prevLocks[idx];
        if (nextLocks[idx]) {
          // Lock just enabled → regen right side
          setProgression((prevProg) => {
            const next = [...prevProg];
            for (let i = idx + 1; i < LENGTH; i++) {
              if (!nextLocks[i]) {
                const history = next.slice(0, i);
                const sugg = suggestNextChord(history, keyName, mode, styles, 5);
                next[i] = weightedPick(sugg, next[i])?.chord ?? next[i];
              }
            }
            return next;
          });
        }
        return nextLocks;
      });
    },
    [keyName, mode, styles],
  );

  /** Re-génère tous les slots non-lockés en cascade. */
  const regenerateUnlocked = useCallback(() => {
    setProgression((prevProg) => {
      const next = [...prevProg];
      for (let i = 0; i < LENGTH; i++) {
        if (!locks[i]) {
          const history = next.slice(0, i);
          const sugg = suggestNextChord(history, keyName, mode, styles, 1);
          next[i] = sugg[0]?.chord ?? next[i];
        }
      }
      return next;
    });
  }, [keyName, mode, styles, locks]);

  const allLocked = useMemo(() => locks.every(Boolean), [locks]);

  /** Joue un accord isolé (preview). */
  const playSingle = useCallback(
    (chord: string) => {
      void strum(chord, 'down');
    },
    [strum],
  );

  /** Joue la progression complète séquentiellement, 1 mesure à PROG_TEMPO. */
  const playProgression = useCallback(async () => {
    if (playingProgIdx !== null) {
      cancelProgRef.current = true;
      setPlayingProgIdx(null);
      return;
    }
    cancelProgRef.current = false;
    const beatMs = (60_000 / PROG_TEMPO) * 4; // 1 mesure 4/4
    for (let i = 0; i < progression.length; i++) {
      if (cancelProgRef.current) break;
      setPlayingProgIdx(i);
      void strum(progression[i], 'down');
      await new Promise((r) => setTimeout(r, beatMs));
    }
    setPlayingProgIdx(null);
  }, [progression, strum, playingProgIdx]);

  useEffect(() => () => { cancelProgRef.current = true; }, []);

  return (
    <>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Sparkles size={22} className="text-gold" />
            Studio
          </span>
        }
        subtitle="4 accords cohérents. Verrouille ceux que tu aimes, l'algo recompose le reste."
      />

      {/* === Header config compact === */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5">
          <span className="label-small">Key</span>
          <select
            value={keyName}
            onChange={(e) => setKeyName(e.target.value as NoteName)}
            className="h-10 rounded-xl border border-border bg-surface px-2.5 font-mono text-sm focus:border-gold-soft focus:outline-none"
          >
            {NOTE_NAMES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="inline-flex items-center gap-1.5">
          <span className="label-small">Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'major' | 'minor')}
            className="h-10 rounded-xl border border-border bg-surface px-2.5 text-sm focus:border-gold-soft focus:outline-none"
          >
            <option value="major">Majeur</option>
            <option value="minor">Mineur</option>
          </select>
        </label>

        {/* Style chips inline (collapsible scroll-x) */}
        <div className="-mx-2 flex-1 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-1.5">
            {STYLE_META.map((s) => {
              const active = styles.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (active) {
                      setStyles(styles.filter((x) => x !== s.id));
                    } else if (styles.length < 2) {
                      setStyles([...styles, s.id]);
                    }
                  }}
                  aria-pressed={active}
                  className={clsx(
                    'inline-flex h-10 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors',
                    active
                      ? 'border-gold bg-gold/15 text-gold'
                      : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text',
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* === Grid 4 chord cards (2x2 mobile, 4-col desktop) === */}
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {progression.map((chord, i) => (
          <ChordSlotCard
            key={`${i}-${chord}`}
            slotIndex={i}
            chord={chord}
            locked={locks[i]}
            playing={playingProgIdx === i}
            onToggleLock={() => toggleLock(i)}
            onPlay={() => playSingle(chord)}
          />
        ))}
      </div>

      {/* === Actions footer === */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => void playProgression()}
          className={clsx(
            'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-bold shadow-gold-strong transition-all hover:-translate-y-px active:scale-[0.99]',
            playingProgIdx !== null
              ? 'border border-danger/40 bg-danger/15 text-danger'
              : 'bg-gradient-to-b from-gold-bright to-gold text-bg',
          )}
        >
          {playingProgIdx !== null ? (
            <>
              <Pause size={18} fill="currentColor" />
              Stop
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" />
              Écouter la progression
            </>
          )}
        </button>

        <button
          type="button"
          onClick={regenerateUnlocked}
          disabled={allLocked}
          className={clsx(
            'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-all',
            allLocked
              ? 'cursor-not-allowed border-border/40 bg-surface/40 text-text-soft'
              : 'border-border bg-surface-2 text-text hover:border-gold-soft active:scale-[0.99]',
          )}
        >
          <RefreshCw size={14} />
          {allLocked ? 'Tous les accords sont verrouillés' : 'Re-générer les autres'}
        </button>
      </div>
    </>
  );
}

// ─── ChordSlotCard ─────────────────────────────────────────────────

function ChordSlotCard({
  slotIndex,
  chord,
  locked,
  playing,
  onToggleLock,
  onPlay,
}: {
  slotIndex: number;
  chord: string;
  locked: boolean;
  playing: boolean;
  onToggleLock: () => void;
  onPlay: () => void;
}) {
  const chordData = getChord(chord);
  return (
    <div
      className={clsx(
        'relative flex flex-col items-center gap-2 rounded-2xl border-2 bg-surface-2 p-3 transition-all',
        locked
          ? 'border-gold-bright shadow-gold-strong'
          : playing
            ? 'border-gold bg-gold/10'
            : 'border-gold-soft/50 hover:border-gold-soft',
      )}
    >
      {/* Cadenas top-right — 44×44 tap area */}
      <button
        type="button"
        onClick={onToggleLock}
        aria-label={locked ? `Déverrouiller slot ${slotIndex + 1}` : `Verrouiller slot ${slotIndex + 1}`}
        aria-pressed={locked}
        className={clsx(
          'absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full transition-all active:scale-90',
          locked
            ? 'text-gold-bright drop-shadow-[0_0_6px_rgb(var(--gold-glow)/0.7)]'
            : 'text-text-soft opacity-70 hover:opacity-100 hover:text-gold',
        )}
      >
        {locked ? <Lock size={18} fill="currentColor" /> : <Unlock size={18} />}
      </button>

      {/* Slot index */}
      <span className="self-start font-mono text-[10px] text-text-soft">{slotIndex + 1}</span>

      {/* Nom accord avec animation au changement */}
      <div className="flex h-9 items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={chord}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="display font-mono text-3xl text-text"
          >
            {chord}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Diagram */}
      <div className="flex h-[110px] items-center justify-center">
        {chordData && chordData.voicings[0] ? (
          <ChordDiagram
            voicing={chordData.voicings[0]}
            name={undefined}
            size="sm"
            showFingers={false}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-border/60 text-[10px] text-text-soft">
            pas de diagramme
          </div>
        )}
      </div>

      {/* Bouton play accord isolé */}
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Jouer ${chord}`}
        className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-lg border border-border bg-surface text-xs font-medium text-text-muted transition-colors hover:border-gold-soft hover:text-gold active:scale-95"
      >
        <Play size={12} fill="currentColor" />
        Jouer
      </button>
    </div>
  );
}
