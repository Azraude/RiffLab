/**
 * RiffPlayer — player synchronisé pour les riffs (sess 27 Phase 2).
 *
 * Améliorations sur TabPlayer existant :
 *  - Speed pills 0.5x / 0.75x / 1x / 1.25x / 1.5x (multiplie le tempo)
 *  - Toggle Loop ∞
 *  - Toggle Métronome (click sur chaque temps fort)
 *  - Compteur "Joué Nx" si loop actif
 *  - Auto-scroll horizontal pour suivre la note active
 *  - Highlight de la mesure courante (bg-gold/8 derrière)
 *  - Barre de progression cliquable (seek to position)
 *
 * Audio : utilise playMidi (single voice) via useAudio. La métronome
 * utilise Tone.Synth direct (un click court).
 *
 * Callbacks :
 *  - onPlayCountChange(n) : remonté à chaque cycle complet (pour
 *    le mode Apprendre qui affiche "Joué Nx")
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Repeat, Square, Volume2 } from 'lucide-react';
import clsx from 'clsx';
import * as Tone from 'tone';
import { TabReader } from '@/components/tabs/TabReader';
import { flattenTab, tabNoteToMidi, type Tab } from '@/lib/tabsDatabase';
import { useAudio } from '@/hooks/useAudio';

interface RiffPlayerProps {
  tab: Tab;
  /** Démarre auto en mode loop (cas du mode Apprendre). Default false. */
  autoLoop?: boolean;
  /** Callback à chaque tour complet de loop (pour compteur Apprendre). */
  onPlayCountChange?: (n: number) => void;
  /** Bouton extra dans la toolbar (ex: "✓ Maîtrisé" dans le mode apprendre). */
  extraAction?: React.ReactNode;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;
type Speed = (typeof SPEED_OPTIONS)[number];

export function RiffPlayer({ tab, autoLoop = false, onPlayCountChange, extraAction }: RiffPlayerProps) {
  const { playMidi } = useAudio();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [loop, setLoop] = useState(autoLoop);
  const [metronome, setMetronome] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const cancelRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Tempo effectif (BPM × speed)
  const effectiveTempo = useMemo(() => tab.tempo * speed, [tab.tempo, speed]);

  // Notes pré-flatten
  const flat = useMemo(() => flattenTab(tab), [tab]);
  const totalBeats = useMemo(() => tab.measures.length * 16, [tab.measures.length]);

  /**
   * Auto-scroll horizontal pour suivre la note active.
   * On scroll smooth pour que la note active soit au centre (ou 30% gauche).
   */
  useEffect(() => {
    if (activeBeat == null) return;
    const el = scrollRef.current;
    if (!el) return;
    const beatWidth = 18; // doit matcher beatWidth du TabReader
    const padLeft = 24;
    const targetX = padLeft + activeBeat * beatWidth;
    // On veut que la note soit à ~30% du viewport visible
    const scrollTarget = Math.max(0, targetX - el.clientWidth * 0.3);
    if (Math.abs(el.scrollLeft - scrollTarget) > 32) {
      el.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }
  }, [activeBeat]);

  /**
   * Game loop audio + visual sync.
   * Sur chaque play/stop, on cancel + relance.
   */
  useEffect(() => {
    if (!playing) {
      cancelRef.current = true;
      setActiveBeat(null);
      return;
    }
    cancelRef.current = false;
    if (flat.length === 0) {
      setPlaying(false);
      return;
    }
    const beatMs = 15000 / effectiveTempo; // 16e en ms

    (async () => {
      let cycle = 0;
      do {
        for (let i = 0; i < flat.length; i++) {
          if (cancelRef.current) break;
          const note = flat[i];
          // Synchro visuelle + audio
          setActiveBeat(note.absoluteBeat);
          const midi = tabNoteToMidi(note);
          void playMidi(midi);
          // Métronome click sur chaque temps fort (chaque noire = 4 × 16e)
          if (metronome && note.absoluteBeat % 4 === 0) {
            try {
              await Tone.start();
              const clickSynth = new Tone.MembraneSynth({
                pitchDecay: 0.05,
                octaves: 4,
                envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
                volume: -10,
              }).toDestination();
              clickSynth.triggerAttackRelease('C5', 0.02);
              window.setTimeout(() => clickSynth.dispose(), 100);
            } catch {
              // Tone pas init, on skip
            }
          }
          // Wait durée de la note avant la suivante
          await new Promise((r) => setTimeout(r, note.duration * beatMs));
        }
        cycle++;
        if (loop && !cancelRef.current) {
          setPlayCount((c) => {
            const next = c + 1;
            onPlayCountChange?.(next);
            return next;
          });
        }
      } while (loop && !cancelRef.current && cycle < 99);
      if (!cancelRef.current) {
        setPlaying(false);
        setActiveBeat(null);
        if (!loop) {
          setPlayCount((c) => {
            const next = c + 1;
            onPlayCountChange?.(next);
            return next;
          });
        }
      }
    })();

    return () => {
      cancelRef.current = true;
    };
  }, [playing, flat, effectiveTempo, loop, metronome, playMidi, onPlayCountChange]);

  const handleReset = useCallback(() => {
    cancelRef.current = true;
    setPlaying(false);
    setActiveBeat(null);
  }, []);

  /** Click sur la progress bar = seek. Note : on ne supporte que reset →
   *  full play. Un vrai seek nécessiterait Tone.Transport.position. */
  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetBeat = Math.floor(ratio * totalBeats);
      // Visual seek instant (le player reprend au prochain start)
      setActiveBeat(targetBeat);
    },
    [totalBeats]
  );

  const progress = activeBeat != null ? (activeBeat / totalBeats) * 100 : 0;

  // Calcule la mesure courante pour highlight (bg-gold/8 overlay)
  const currentMeasureIdx = activeBeat != null ? Math.floor(activeBeat / 16) : -1;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* === Tab notation avec scroll horizontal auto === */}
      <div
        ref={scrollRef}
        className="relative max-h-[200px] overflow-x-auto overflow-y-hidden border-b border-border bg-surface-2 px-3 py-4 [scrollbar-width:thin]"
      >
        {/* Highlight overlay de la mesure courante */}
        {currentMeasureIdx >= 0 && (
          <div
            aria-hidden
            className="pointer-events-none absolute top-2 bottom-2 rounded-md bg-gold/8 transition-all duration-150"
            style={{
              // 16 beats par mesure × beatWidth 18px + offset PAD_LEFT 24
              left: `${24 + currentMeasureIdx * 16 * 18}px`,
              width: `${16 * 18}px`,
            }}
          />
        )}
        <TabReader tab={tab} activeAbsBeat={activeBeat} lineHeight={20} beatWidth={18} />
      </div>

      {/* === Progress bar interactive === */}
      <div
        role="slider"
        aria-label="Position dans le riff"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        tabIndex={0}
        onClick={handleSeek}
        className="relative h-2 cursor-pointer border-b border-border bg-bg/50"
      >
        <div
          className="h-full bg-gradient-to-r from-gold to-gold-bright transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* === Toolbar : play + speed pills + loop + metronome + extra === */}
      <div className="grid gap-3 px-4 py-3 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-4">
        {/* Play / Reset */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className={clsx(
              'inline-flex h-12 w-12 items-center justify-center rounded-full transition-all',
              playing
                ? 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25'
                : 'bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold-strong hover:-translate-y-px'
            )}
            aria-label={playing ? 'Pause' : 'Lecture'}
          >
            {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-text-muted hover:border-gold-soft hover:text-text"
            aria-label="Stop & reset"
          >
            <Square size={14} />
          </button>
        </div>

        {/* Center : speed pills + toggles */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full border border-border bg-surface-2 p-1">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={clsx(
                  'h-8 rounded-full px-2.5 font-mono text-[11px] font-bold transition-colors',
                  speed === s ? 'bg-gold text-bg' : 'text-text-muted hover:text-text'
                )}
              >
                {s}x
              </button>
            ))}
          </div>
          <ToggleBtn active={loop} onClick={() => setLoop((l) => !l)} label="Loop">
            <Repeat size={13} />
            <span>Loop {loop ? '∞' : ''}</span>
          </ToggleBtn>
          <ToggleBtn active={metronome} onClick={() => setMetronome((m) => !m)} label="Métronome">
            <Volume2 size={13} />
            <span>Click</span>
          </ToggleBtn>
        </div>

        {/* Right : extra action (ex: "✓ Maîtrisé" mode Apprendre) + reset count */}
        <div className="flex items-center gap-2">
          {loop && playCount > 0 && (
            <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 font-mono text-xs text-gold">
              Joué {playCount}×
            </span>
          )}
          {extraAction}
        </div>
      </div>

      {/* Indicateur tempo effectif */}
      {speed !== 1 && (
        <div className="border-t border-border bg-surface-2 px-4 py-2 text-center text-[11px] text-text-soft">
          Tempo effectif :{' '}
          <span className="font-mono text-gold">{Math.round(effectiveTempo)} BPM</span>{' '}
          (×{speed} du tempo original {tab.tempo})
        </div>
      )}

      {/* Reset count caché s'il déborde l'attention */}
      {playCount > 0 && !loop && (
        <button
          type="button"
          onClick={() => setPlayCount(0)}
          className="w-full border-t border-border bg-surface-2 px-4 py-1.5 text-[10px] text-text-soft hover:text-text"
        >
          ↺ Reset compteur ({playCount})
        </button>
      )}

      {/* Reset count exposé aussi en mode loop pour repartir à 0 */}
      {playCount > 0 && loop && (
        <button
          type="button"
          onClick={() => {
            setPlayCount(0);
            onPlayCountChange?.(0);
          }}
          className="hidden w-full border-t border-border bg-surface-2 px-4 py-1.5 text-[10px] text-text-soft hover:text-text"
        >
          ↺ Reset compteur
        </button>
      )}
    </div>
  );
}

// ─── Sous-composant ─────────────────────────────────────────────────

function ToggleBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={clsx(
        'inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
        active
          ? 'border-gold bg-gold/15 text-gold'
          : 'border-border bg-surface-2 text-text-muted hover:border-gold-soft hover:text-text'
      )}
    >
      {children}
    </button>
  );
}

// Re-export du wrapper RotateCcw pas utilisé — purge import
void RotateCcw;
