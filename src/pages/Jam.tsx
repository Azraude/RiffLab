import { useEffect, useMemo, useRef, useState } from 'react';
import * as Tone from 'tone';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Fretboard2D } from '@/components/fretboard/Fretboard2D';
import { FloatingGuitar3DLazy } from '@/components/three/FloatingGuitar3DLazy';
import { useAudio } from '@/hooks/useAudio';
import { usePrefs } from '@/stores/prefsStore';
import {
  PROGRESSIONS,
  transposeProgression,
  ALL_MOODS,
  MOOD_LABELS,
  type Mood,
  type Progression,
  type ProgressionChord,
} from '@/lib/progressionDatabase';
import { NOTE_NAMES, type NoteName } from '@/lib/theory';
import {
  Disc3,
  Drum,
  Music2,
  Pause,
  Play,
  Sparkles,
  Volume2,
  Wand2,
} from 'lucide-react';
import clsx from 'clsx';

/**
 * /jam — Mode Jam : génération auto de progression dans une key/mode/mood,
 * lecture en boucle avec drums + bass + chord strum, fretboard avec gamme
 * highlight pour improviser dessus.
 *
 * Audio :
 * - Drums : MembraneSynth (kick) + NoiseSynth (snare/hat) via Tone.Transport
 * - Bass : MonoSynth (root note octave 2) au début de chaque temps
 * - Chord : strum au début de chaque mesure via useAudio (timbre user)
 * - Sync : Tone.Loop sur 16n pour drums + 4n pour bass + 1m pour chord/measure
 *
 * Toggles drums / bass / chords pour mute des couches indépendamment.
 */
export function Jam() {
  const { strum } = useAudio();
  const tuning = usePrefs((s) => s.tuning);
  const showNoteNames = usePrefs((s) => s.showNoteNames);
  const fretboardSkin = usePrefs((s) => s.fretboardSkin);

  // ─── State ────────────────────────────────────────────────────
  const [key, setKey] = useState<NoteName>('A');
  const [mode, setMode] = useState<'major' | 'minor'>('minor');
  const [mood, setMood] = useState<Mood>('rock');
  const [bpm, setBpm] = useState(100);
  const [progression, setProgression] = useState<Progression | null>(null);
  const [running, setRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [drumsOn, setDrumsOn] = useState(true);
  const [bassOn, setBassOn] = useState(true);
  const [chordsOn, setChordsOn] = useState(true);

  // Transposed chords (when progression / key changes)
  const transposedChords: ProgressionChord[] = useMemo(() => {
    if (!progression) return [];
    return transposeProgression(progression, key);
  }, [progression, key]);

  // ─── Generate a fresh progression ─────────────────────────────
  const handleGenerate = () => {
    const pool = PROGRESSIONS.filter(
      (p) => p.refKey === mode && p.moods.includes(mood)
    );
    const fallback = PROGRESSIONS.filter((p) => p.refKey === mode);
    const picks = pool.length > 0 ? pool : fallback;
    const next = picks[Math.floor(Math.random() * picks.length)];
    setProgression(next);
  };

  // Auto-generate au premier mount + au changement de mood/mode
  useEffect(() => {
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood, mode]);

  // ─── Audio engine ─────────────────────────────────────────────
  const enginesRef = useRef<JamEngines | null>(null);

  useEffect(() => {
    if (!running) {
      enginesRef.current?.dispose();
      enginesRef.current = null;
      Tone.Transport.stop();
      Tone.Transport.cancel();
      setCurrentBeat(0);
      setCurrentMeasure(0);
      return;
    }

    let cancelled = false;

    (async () => {
      await Tone.start();
      if (cancelled) return;

      enginesRef.current?.dispose();
      enginesRef.current = buildEngines();
      Tone.Transport.bpm.value = bpm;
      Tone.Transport.timeSignature = 4;

      const eng = enginesRef.current!;
      const drumPattern = DRUM_PATTERNS[mood];

      let stepIdx = 0; // 16e step counter (0-15 dans la mesure)
      let beatIdx = 0;
      let measureIdx = 0;

      // Drums : tick à chaque 16e
      const drumLoop = new Tone.Loop((time) => {
        const step = stepIdx % 16;
        if (drumsOn) {
          if (drumPattern.kick.includes(step)) {
            eng.kick.triggerAttackRelease('C1', '16n', time, 0.9);
          }
          if (drumPattern.snare.includes(step)) {
            eng.snare.triggerAttackRelease('16n', time, 0.7);
          }
          if (drumPattern.hat.includes(step)) {
            eng.hat.triggerAttackRelease('32n', time, 0.4);
          }
        }
        stepIdx++;
      }, '16n').start(0);

      // Beats (4 par mesure) : bass note sur le 1er beat de chaque temps
      const beatLoop = new Tone.Loop((time) => {
        const localBeat = beatIdx % 4;
        setCurrentBeat(localBeat);
        const localMeasure = Math.floor(beatIdx / 4) % Math.max(1, transposedChords.length);
        const c = transposedChords[localMeasure];
        if (bassOn && c) {
          // Root note de l'accord en cours, octave 2
          const rootName = extractRootName(c.name);
          const rootHz = noteToFreq(rootName, 2);
          eng.bass.triggerAttackRelease(rootHz, '4n', time, 0.8);
        }
        beatIdx++;
      }, '4n').start(0);

      // Mesures : strum de l'accord au beat 1
      const measureLoop = new Tone.Loop((time) => {
        const idx = measureIdx % Math.max(1, transposedChords.length);
        setCurrentMeasure(idx);
        const c = transposedChords[idx];
        if (chordsOn && c) {
          Tone.Draw.schedule(() => {
            // Joué via le timbre user actif (useAudio.strum)
            void strum(c.name, 'down');
          }, time);
        }
        measureIdx++;
      }, '1m').start(0);

      eng.loops.push(drumLoop, beatLoop, measureLoop);

      Tone.Transport.start();
    })();

    return () => {
      cancelled = true;
      enginesRef.current?.dispose();
      enginesRef.current = null;
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, transposedChords, mood, drumsOn, bassOn, chordsOn]);

  // BPM update live
  useEffect(() => {
    if (running) Tone.Transport.bpm.rampTo(bpm, 0.1);
  }, [bpm, running]);

  // ─── Render ───────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="Mode jam"
        subtitle="Génère une progression, lance la boucle, improvise sur la gamme du bas."
      />

      {/* Controls : key / mode / mood */}
      <Card className="mb-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="label-small mb-2">Tonalité</div>
            <div className="grid grid-cols-6 gap-1">
              {NOTE_NAMES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setKey(n)}
                  aria-pressed={key === n}
                  className={clsx(
                    'inline-flex h-9 items-center justify-center rounded-lg border font-mono text-sm font-bold transition-colors',
                    key === n
                      ? 'border-gold bg-gold text-bg'
                      : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label-small mb-2">Mode</div>
            <div className="grid grid-cols-2 gap-2">
              {(['major', 'minor'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={clsx(
                    'inline-flex h-9 items-center justify-center rounded-lg border text-sm font-semibold transition-colors',
                    mode === m
                      ? 'border-gold bg-gold text-bg'
                      : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
                  )}
                >
                  {m === 'major' ? 'Majeur' : 'Mineur'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="label-small mb-2">Mood</div>
            <div className="grid grid-cols-4 gap-1">
              {ALL_MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  aria-pressed={mood === m}
                  className={clsx(
                    'inline-flex h-9 items-center justify-center rounded-lg border text-xs font-semibold transition-colors',
                    mood === m
                      ? 'border-gold bg-gold text-bg'
                      : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
                  )}
                >
                  {MOOD_LABELS[m]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border-gold bg-gold/5 text-sm font-semibold text-text hover:bg-gold/10"
        >
          <Wand2 size={16} /> Tirer une autre progression
        </button>
      </Card>

      {/* Progression display */}
      {progression && transposedChords.length > 0 && (
        <Card className="mb-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="eyebrow !text-gold-soft">{progression.name}</div>
              <div className="font-mono text-xs text-text-soft">
                {progression.degrees} · {progression.description}
              </div>
            </div>
            <Disc3 size={20} className="text-gold-soft" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {transposedChords.map((c, i) => {
              const isActive = running && currentMeasure === i;
              return (
                <div
                  key={i}
                  className={clsx(
                    'rounded-xl border p-3 text-center transition-all',
                    isActive
                      ? 'border-gold bg-gold/15 shadow-gold scale-105'
                      : 'border-border bg-surface'
                  )}
                >
                  <div className={clsx('font-mono text-lg font-bold', isActive ? 'text-gold-bright' : 'text-gold')}>
                    {c.name}
                  </div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider text-text-soft">
                    Mesure {i + 1}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Transport */}
      <Card className="mb-5">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          {/* BPM */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="label-small">Tempo</span>
              <span className="font-mono text-base font-bold text-gold">{bpm} BPM</span>
            </div>
            <input
              type="range"
              min={60}
              max={180}
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-full accent-gold"
            />
            <div className="mt-1 flex items-center justify-between text-[10px] text-text-soft">
              <span>60</span>
              <span>Mesure {running ? currentMeasure + 1 : '—'} · temps {running ? currentBeat + 1 : '—'}</span>
              <span>180</span>
            </div>
          </div>

          {/* Play */}
          <button
            type="button"
            onClick={() => setRunning(!running)}
            className={clsx(
              'inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-6 font-semibold transition-all',
              running
                ? 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25'
                : 'bg-gold text-bg shadow-gold hover:bg-gold-bright hover:-translate-y-px'
            )}
          >
            {running ? (
              <>
                <Pause size={20} fill="currentColor" /> Stop
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" /> Jam
              </>
            )}
          </button>
        </div>

        {/* Mute toggles */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <MuteToggle label="Drums" icon={<Drum size={14} />} on={drumsOn} onChange={setDrumsOn} />
          <MuteToggle label="Bass" icon={<Volume2 size={14} />} on={bassOn} onChange={setBassOn} />
          <MuteToggle label="Chords" icon={<Music2 size={14} />} on={chordsOn} onChange={setChordsOn} />
        </div>
      </Card>

      {/* Fretboard avec la gamme highlight pour improviser */}
      <Card className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="label-small">Gamme à improviser</div>
            <div className="display mt-0.5 text-display-sm">
              {key} {mode === 'minor' ? 'mineure' : 'majeure'} pentatonique
            </div>
          </div>
          <Sparkles size={18} className="text-gold-soft" />
        </div>
        <div className="relative -mx-2 overflow-x-auto pb-2">
          <Fretboard2D
            tuning={tuning}
            numFrets={15}
            scale={{ key, scaleId: mode === 'minor' ? 'penta_minor' : 'penta_major' }}
            showNoteNames={showNoteNames}
            skin={fretboardSkin}
            className="min-w-[640px]"
          />
        </div>
      </Card>

      {/* 3D ambient guitar — décoratif, opacity réduite pour ne pas voler
          l'attention aux accords + fretboard au-dessus. Caméra reculée
          (8 vs 5 défaut) pour que la guitare occupe ~30-40% du Canvas. */}
      <div className="relative h-[180px] overflow-hidden rounded-3xl border border-border bg-gradient-to-b from-bg via-surface to-bg opacity-70">
        <FloatingGuitar3DLazy
          model="classic"
          rotationSpeed={0.0025}
          cameraDistance={8}
          cameraY={0.4}
          intensity="subtle"
        />
      </div>
    </>
  );
}

// ─── Drum patterns par mood (16 steps = 1 mesure 4/4) ─────────────────

type DrumPattern = {
  kick: number[];
  snare: number[];
  hat: number[];
};

const DRUM_PATTERNS: Record<Mood, DrumPattern> = {
  rock: {
    kick: [0, 8],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  pop: {
    kick: [0, 6, 8],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  chill: {
    kick: [0],
    snare: [8],
    hat: [4, 12],
  },
  sad: {
    kick: [0],
    snare: [8],
    hat: [0, 4, 8, 12],
  },
  jazzy: {
    kick: [0, 10],
    snare: [4, 12],
    hat: [0, 4, 6, 8, 12, 14],
  },
  latin: {
    kick: [0, 6, 10],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  epic: {
    kick: [0, 4, 8, 12],
    snare: [4, 12],
    hat: [0, 2, 4, 6, 8, 10, 12, 14],
  },
  cinematic: {
    kick: [0, 8],
    snare: [4, 12],
    hat: [2, 6, 10, 14],
  },
};

// ─── Audio engines ────────────────────────────────────────────────────

type JamEngines = {
  kick: Tone.MembraneSynth;
  snare: Tone.NoiseSynth;
  hat: Tone.NoiseSynth;
  bass: Tone.MonoSynth;
  loops: Tone.Loop[];
  dispose: () => void;
};

function buildEngines(): JamEngines {
  const masterDrums = new Tone.Gain(0.5).toDestination();
  const masterBass = new Tone.Gain(0.5).toDestination();

  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 6,
    envelope: { attack: 0.001, decay: 0.4, sustain: 0, release: 0.4 },
  });
  kick.connect(masterDrums);

  // Snare = bruit blanc filtré + envelope rapide
  const snareFilter = new Tone.Filter({ type: 'highpass', frequency: 800, Q: 1 });
  const snare = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.13, sustain: 0, release: 0.1 },
  });
  snare.connect(snareFilter);
  snareFilter.connect(masterDrums);

  // Hi-hat = bruit blanc très filtré highpass + decay très court
  const hatFilter = new Tone.Filter({ type: 'highpass', frequency: 6000, Q: 2 });
  const hat = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
    volume: -8,
  });
  hat.connect(hatFilter);
  hatFilter.connect(masterDrums);

  // Bass = MonoSynth sawtooth filtré bas
  const bass = new Tone.MonoSynth({
    oscillator: { type: 'sawtooth' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.5 },
    filter: { Q: 1, type: 'lowpass', rolloff: -24 },
    filterEnvelope: {
      attack: 0.005,
      decay: 0.15,
      sustain: 0.2,
      release: 0.5,
      baseFrequency: 80,
      octaves: 3,
    },
  });
  bass.connect(masterBass);

  const loops: Tone.Loop[] = [];

  return {
    kick,
    snare,
    hat,
    bass,
    loops,
    dispose: () => {
      loops.forEach((l) => l.dispose());
      kick.dispose();
      snare.dispose();
      snareFilter.dispose();
      hat.dispose();
      hatFilter.dispose();
      bass.dispose();
      masterDrums.dispose();
      masterBass.dispose();
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────

const NOTE_TO_SEMITONES: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3,
  E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10, B: 11,
};

/** Renvoie la fréquence en Hz d'une note (sans suffixe d'accord) à l'octave donnée. */
function noteToFreq(rootName: string, octave: number): number {
  const semis = NOTE_TO_SEMITONES[rootName] ?? 0;
  const midi = octave * 12 + 12 + semis; // C4 = 60 → octave=4 + 12*4 + 12 = 60 ✓
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Extrait la note root depuis un nom d'accord ('Em' → 'E', 'C#m7' → 'C#'). */
function extractRootName(chordName: string): string {
  const m = chordName.match(/^([A-G][#b]?)/);
  return m ? m[1] : 'C';
}

// ─── Mute toggle UI ───────────────────────────────────────────────────

function MuteToggle({
  label,
  icon,
  on,
  onChange,
}: {
  label: string;
  icon: React.ReactNode;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={clsx(
        'inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors',
        on
          ? 'border-gold bg-gold/10 text-gold'
          : 'border-border bg-surface text-text-soft hover:border-gold-soft'
      )}
    >
      {icon} {label}
    </button>
  );
}
