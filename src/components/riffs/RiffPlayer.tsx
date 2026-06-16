/**
 * RiffPlayer — player synchronisé pour les riffs.
 *
 * Sess 27 P2 : speed pills, loop, métronome, autoscroll horizontal,
 * highlight mesure courante, progress bar.
 *
 * Sess B P2 (Session B) :
 *  - forwardRef expose { play(), pause(), stop() } pour déclenchement
 *    externe (CTA "Écouter le riff" du parent RiffDetail)
 *  - Indicateur "Mesure X/Y" + flèches ← → tap-to-scroll par mesure
 *  - Sticky bottom bar mini-player quand playing (au-dessus du MobileNav)
 *    avec close button qui arrête + cache
 *  - Auto-pause de l'autoscroll si l'user scroll manuellement (3s de
 *    grace period avant de reprendre le follow)
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Repeat,
  Square,
  Volume2,
  X,
} from 'lucide-react';
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
  /** Désactive la sticky bottom bar (ex: mode Apprendre full-screen). */
  hideStickyBar?: boolean;
}

export interface RiffPlayerHandle {
  play: () => void;
  pause: () => void;
  stop: () => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;
type Speed = (typeof SPEED_OPTIONS)[number];
const BEAT_WIDTH = 18;
const BEATS_PER_MEASURE = 16;
const MEASURE_WIDTH = BEAT_WIDTH * BEATS_PER_MEASURE;
const PAD_LEFT = 24;
const MANUAL_SCROLL_GRACE_MS = 3000;

export const RiffPlayer = forwardRef<RiffPlayerHandle, RiffPlayerProps>(function RiffPlayer(
  { tab, autoLoop = false, onPlayCountChange, extraAction, hideStickyBar = false },
  ref
) {
  const { playMidi } = useAudio();
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [loop, setLoop] = useState(autoLoop);
  const [metronome, setMetronome] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const [scrollMeasureIdx, setScrollMeasureIdx] = useState(0);
  /**
   * Token d'annulation PAR-RUN (fix bug tempo « tarpin vite », hotfix).
   * Un booléen partagé ne marchait pas : quand l'effet se relançait (ex.
   * `ready` qui flip après l'init audio → `playMidi` change d'identité), la
   * nouvelle run remettait le flag à false AVANT que l'ancienne boucle async
   * ne le voie → 2 boucles concurrentes jouaient en même temps = lecture
   * ultra-rapide. Chaque run a maintenant son propre token ; le cleanup
   * n'annule QUE sa run. `runRef` permet aussi à stop/reset d'annuler la
   * run courante immédiatement. */
  const runRef = useRef<{ cancelled: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const manualScrollUntilRef = useRef(0);
  /**
   * Refs pour les callbacks volatils : `playMidi` change d'identité au flip
   * de `ready` (init audio) et `onPlayCountChange` peut être inline côté
   * parent. Les lire via ref évite de relancer la boucle (et donc le saut au
   * beat 0) en plein milieu de la lecture. */
  const playMidiRef = useRef(playMidi);
  playMidiRef.current = playMidi;
  const onPlayCountChangeRef = useRef(onPlayCountChange);
  onPlayCountChangeRef.current = onPlayCountChange;

  // Expose impératif au parent
  useImperativeHandle(
    ref,
    () => ({
      play: () => setPlaying(true),
      pause: () => setPlaying(false),
      stop: () => {
        if (runRef.current) runRef.current.cancelled = true;
        setPlaying(false);
        setActiveBeat(null);
      },
    }),
    []
  );

  // Tempo effectif (BPM × speed)
  const effectiveTempo = useMemo(() => tab.tempo * speed, [tab.tempo, speed]);

  // Notes pré-flatten
  const flat = useMemo(() => flattenTab(tab), [tab]);
  const totalBeats = useMemo(() => tab.measures.length * BEATS_PER_MEASURE, [tab.measures.length]);

  /** Mesure courante : si on joue, basée sur activeBeat. Sinon mesure visible (scrollLeft). */
  const currentMeasureIdx = useMemo(() => {
    if (playing && activeBeat != null) {
      return Math.floor(activeBeat / BEATS_PER_MEASURE);
    }
    return scrollMeasureIdx;
  }, [playing, activeBeat, scrollMeasureIdx]);

  /**
   * Auto-scroll horizontal pour suivre la note active.
   * Skip si l'user a scrollé manuellement dans les MANUAL_SCROLL_GRACE_MS dernières ms.
   */
  useEffect(() => {
    if (activeBeat == null) return;
    if (Date.now() < manualScrollUntilRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const targetX = PAD_LEFT + activeBeat * BEAT_WIDTH;
    const scrollTarget = Math.max(0, targetX - el.clientWidth * 0.3);
    if (Math.abs(el.scrollLeft - scrollTarget) > 32) {
      el.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }
  }, [activeBeat]);

  /**
   * Observer le scrollLeft pour calculer la mesure visible + détecter scroll
   * manuel (pour pause de l'autoscroll).
   */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      // Mesure dont le bord gauche est visible (la plus proche de PAD_LEFT)
      const idx = Math.round((el.scrollLeft - 0) / MEASURE_WIDTH);
      const clamped = Math.max(0, Math.min(tab.measures.length - 1, idx));
      setScrollMeasureIdx(clamped);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [tab.measures.length]);

  // Detection scroll-manuel : tactile / wheel / pointer down → pause autoscroll 3s
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const markManual = () => {
      manualScrollUntilRef.current = Date.now() + MANUAL_SCROLL_GRACE_MS;
    };
    el.addEventListener('touchstart', markManual, { passive: true });
    el.addEventListener('wheel', markManual, { passive: true });
    el.addEventListener('pointerdown', markManual, { passive: true });
    return () => {
      el.removeEventListener('touchstart', markManual);
      el.removeEventListener('wheel', markManual);
      el.removeEventListener('pointerdown', markManual);
    };
  }, []);

  /**
   * Game loop audio + visual sync.
   */
  useEffect(() => {
    if (!playing) {
      setActiveBeat(null);
      return;
    }
    if (flat.length === 0) {
      setPlaying(false);
      return;
    }
    // Token d'annulation propre à CETTE run.
    const run = { cancelled: false };
    runRef.current = run;
    const beatMs = 15000 / effectiveTempo; // 16e en ms

    (async () => {
      let cycle = 0;
      do {
        for (let i = 0; i < flat.length; i++) {
          if (run.cancelled) break;
          const note = flat[i];
          setActiveBeat(note.absoluteBeat);
          const midi = tabNoteToMidi(note);
          void playMidiRef.current(midi);
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
              // Tone pas init
            }
          }
          await new Promise((r) => setTimeout(r, note.duration * beatMs));
        }
        cycle++;
        if (loop && !run.cancelled) {
          setPlayCount((c) => {
            const next = c + 1;
            onPlayCountChangeRef.current?.(next);
            return next;
          });
        }
      } while (loop && !run.cancelled && cycle < 99);
      if (!run.cancelled) {
        setPlaying(false);
        setActiveBeat(null);
        if (!loop) {
          setPlayCount((c) => {
            const next = c + 1;
            onPlayCountChangeRef.current?.(next);
            return next;
          });
        }
      }
    })();

    return () => {
      run.cancelled = true;
    };
  }, [playing, flat, effectiveTempo, loop, metronome]);

  const handleReset = useCallback(() => {
    if (runRef.current) runRef.current.cancelled = true;
    setPlaying(false);
    setActiveBeat(null);
  }, []);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetBeat = Math.floor(ratio * totalBeats);
      setActiveBeat(targetBeat);
    },
    [totalBeats]
  );

  const scrollToMeasure = useCallback(
    (idx: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const clamped = Math.max(0, Math.min(tab.measures.length - 1, idx));
      manualScrollUntilRef.current = Date.now() + MANUAL_SCROLL_GRACE_MS;
      el.scrollTo({ left: clamped * MEASURE_WIDTH, behavior: 'smooth' });
    },
    [tab.measures.length]
  );

  const cycleSpeed = useCallback(() => {
    const i = SPEED_OPTIONS.indexOf(speed);
    setSpeed(SPEED_OPTIONS[(i + 1) % SPEED_OPTIONS.length]);
  }, [speed]);

  const progress = activeBeat != null ? (activeBeat / totalBeats) * 100 : 0;
  const playerCurrentMeasureIdx = activeBeat != null ? Math.floor(activeBeat / BEATS_PER_MEASURE) : -1;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {/* === Tab notation avec scroll horizontal auto === */}
        <div
          ref={scrollRef}
          className="relative max-h-[200px] overflow-x-auto overflow-y-hidden border-b border-border bg-surface-2 px-3 py-4 [scrollbar-width:thin]"
        >
          {/* Highlight overlay de la mesure courante (en lecture seulement) */}
          {playerCurrentMeasureIdx >= 0 && (
            <div
              aria-hidden
              className="pointer-events-none absolute top-2 bottom-2 rounded-md bg-gold/8 transition-all duration-150"
              style={{
                left: `${PAD_LEFT + playerCurrentMeasureIdx * MEASURE_WIDTH}px`,
                width: `${MEASURE_WIDTH}px`,
              }}
            />
          )}
          <TabReader tab={tab} activeAbsBeat={activeBeat} lineHeight={20} beatWidth={BEAT_WIDTH} />
        </div>

        {/* === Indicateur Mesure X/Y + flèches navigation === */}
        <div className="flex items-center justify-between gap-2 border-b border-border bg-bg/40 px-2 py-1.5">
          <button
            type="button"
            onClick={() => scrollToMeasure(currentMeasureIdx - 1)}
            disabled={currentMeasureIdx <= 0}
            aria-label="Mesure précédente"
            className="flex h-11 w-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="font-mono text-xs">
            <span className="text-text-soft">Mesure </span>
            <span className="font-bold text-text">{currentMeasureIdx + 1}</span>
            <span className="text-text-soft"> / {tab.measures.length}</span>
          </div>
          <button
            type="button"
            onClick={() => scrollToMeasure(currentMeasureIdx + 1)}
            disabled={currentMeasureIdx >= tab.measures.length - 1}
            aria-label="Mesure suivante"
            className="flex h-11 w-11 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
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

        {/* === Toolbar inline === */}
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

          {/* Right : extra action + reset count */}
          <div className="flex items-center gap-2">
            {loop && playCount > 0 && (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 font-mono text-xs text-gold">
                Joué {playCount}×
              </span>
            )}
            {extraAction}
          </div>
        </div>

        {speed !== 1 && (
          <div className="border-t border-border bg-surface-2 px-4 py-2 text-center text-[11px] text-text-soft">
            Tempo effectif :{' '}
            <span className="font-mono text-gold">{Math.round(effectiveTempo)} BPM</span>{' '}
            (×{speed} du tempo original {tab.tempo})
          </div>
        )}

        {playCount > 0 && !loop && (
          <button
            type="button"
            onClick={() => setPlayCount(0)}
            className="w-full border-t border-border bg-surface-2 px-4 py-1.5 text-[10px] text-text-soft hover:text-text"
          >
            ↺ Reset compteur ({playCount})
          </button>
        )}
      </div>

      {/* === STICKY BOTTOM MINI-PLAYER (apparaît pendant lecture) ===
          Au-dessus du MobileNav (z-40 = nav, 45 = nous) + offset bottom
          pour ne pas écraser le nav. Compact : play/pause + info + speed +
          close. Masqué en mode Apprendre (hideStickyBar). */}
      {playing && !hideStickyBar && (
        <div
          className="fixed inset-x-0 z-[45] border-t border-border bg-surface/95 backdrop-blur-lg md:bottom-0 md:px-4"
          style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
          role="region"
          aria-label="Mini-player"
        >
          {/* Progress bar full-width au top */}
          <div
            role="slider"
            aria-label="Position dans le riff"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            onClick={handleSeek}
            className="relative h-1 cursor-pointer bg-bg/50"
          >
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-bright transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-2">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold transition-all active:scale-95"
              aria-label={playing ? 'Pause' : 'Lecture'}
            >
              {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            </button>

            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold text-text">{tab.name}</div>
              <div className="truncate font-mono text-[10px] text-text-muted">
                Mesure {playerCurrentMeasureIdx + 1}/{tab.measures.length} · {speed}x
                {loop ? ' · 🔁' : ''}
              </div>
            </div>

            <button
              type="button"
              onClick={cycleSpeed}
              aria-label={`Vitesse ${speed}x (cycler)`}
              className="h-9 rounded-md border border-border bg-surface-2 px-2 font-mono text-[11px] font-bold text-text-muted hover:border-gold-soft hover:text-text"
            >
              {speed}x
            </button>
            <button
              type="button"
              onClick={() => setLoop((l) => !l)}
              aria-label={loop ? 'Désactiver loop' : 'Activer loop'}
              aria-pressed={loop}
              className={clsx(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border transition-colors',
                loop
                  ? 'border-gold bg-gold/15 text-gold'
                  : 'border-border bg-surface-2 text-text-muted hover:border-gold-soft hover:text-text'
              )}
            >
              <Repeat size={14} />
            </button>
            <button
              type="button"
              onClick={() => {
                if (runRef.current) runRef.current.cancelled = true;
                setPlaying(false);
                setActiveBeat(null);
              }}
              aria-label="Arrêter la lecture et fermer le mini-player"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-2 text-text-muted hover:border-danger/40 hover:text-danger"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
});

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
