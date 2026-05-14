import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAudio } from '@/hooks/useAudio';
import { NOTE_NAMES, type NoteName } from '@/lib/theory';
import {
  Check,
  Ear,
  Flame,
  Music,
  Play,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Types & data ─────────────────────────────────────────────────────

type Mode = 'intervals' | 'chords' | 'progressions';
type Difficulty = 'beginner' | 'intermediate' | 'expert';

type Interval = { semitones: number; name: string; label: string };

const INTERVALS: Interval[] = [
  { semitones: 1, name: 'm2', label: 'Seconde mineure' },
  { semitones: 2, name: 'M2', label: 'Seconde majeure' },
  { semitones: 3, name: 'm3', label: 'Tierce mineure' },
  { semitones: 4, name: 'M3', label: 'Tierce majeure' },
  { semitones: 5, name: 'P4', label: 'Quarte juste' },
  { semitones: 6, name: 'TT', label: 'Triton (quarte aug.)' },
  { semitones: 7, name: 'P5', label: 'Quinte juste' },
  { semitones: 8, name: 'm6', label: 'Sixte mineure' },
  { semitones: 9, name: 'M6', label: 'Sixte majeure' },
  { semitones: 10, name: 'm7', label: 'Septième mineure' },
  { semitones: 11, name: 'M7', label: 'Septième majeure' },
  { semitones: 12, name: 'P8', label: 'Octave juste' },
];

const INTERVAL_POOL: Record<Difficulty, string[]> = {
  beginner: ['P4', 'P5', 'P8', 'M3'],
  intermediate: ['P4', 'P5', 'P8', 'M3', 'm3', 'M2', 'M6', 'm6'],
  expert: INTERVALS.map((i) => i.name),
};

type ChordQuality = { suffix: string; label: string };

const CHORD_QUALITIES: ChordQuality[] = [
  { suffix: '', label: 'Majeur' },
  { suffix: 'm', label: 'Mineur' },
  { suffix: '7', label: 'Dominante 7' },
  { suffix: 'maj7', label: 'Majeur 7' },
  { suffix: 'm7', label: 'Mineur 7' },
  { suffix: 'sus2', label: 'Sus2' },
  { suffix: 'sus4', label: 'Sus4' },
  { suffix: 'dim', label: 'Diminué' },
  { suffix: 'aug', label: 'Augmenté' },
];

const CHORD_POOL: Record<Difficulty, string[]> = {
  beginner: ['', 'm'],
  intermediate: ['', 'm', '7', 'maj7', 'm7'],
  expert: CHORD_QUALITIES.map((q) => q.suffix),
};

type ProgressionDef = { id: string; label: string; degrees: string[] };

const PROGRESSIONS: ProgressionDef[] = [
  { id: 'I-V-vi-IV', label: 'I–V–vi–IV', degrees: ['I', 'V', 'vi', 'IV'] },
  { id: 'vi-IV-I-V', label: 'vi–IV–I–V', degrees: ['vi', 'IV', 'I', 'V'] },
  { id: 'I-IV-V', label: 'I–IV–V', degrees: ['I', 'IV', 'V', 'I'] },
  { id: 'I-vi-IV-V', label: 'I–vi–IV–V (50s)', degrees: ['I', 'vi', 'IV', 'V'] },
  { id: 'ii-V-I', label: 'ii–V–I (jazz)', degrees: ['ii', 'V', 'I', 'I'] },
  { id: 'I-bVII-IV', label: 'I–♭VII–IV', degrees: ['I', 'bVII', 'IV', 'I'] },
];

const PROG_POOL: Record<Difficulty, string[]> = {
  beginner: ['I-V-vi-IV', 'vi-IV-I-V', 'I-IV-V'],
  intermediate: ['I-V-vi-IV', 'vi-IV-I-V', 'I-IV-V', 'I-vi-IV-V', 'ii-V-I'],
  expert: PROGRESSIONS.map((p) => p.id),
};

// Map degrés → offset semitones depuis la tonique (en major)
const DEGREE_OFFSETS: Record<string, { semis: number; quality: '' | 'm' }> = {
  I: { semis: 0, quality: '' },
  ii: { semis: 2, quality: 'm' },
  iii: { semis: 4, quality: 'm' },
  IV: { semis: 5, quality: '' },
  V: { semis: 7, quality: '' },
  vi: { semis: 9, quality: 'm' },
  bVII: { semis: 10, quality: '' },
};

// ─── Page ─────────────────────────────────────────────────────────────

export function EarTraining() {
  const [mode, setMode] = useState<Mode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');

  return (
    <>
      <PageHeader
        title="Ear Training"
        subtitle={
          mode
            ? "Écoute, devine, valide. La meilleure manière de muscler l'oreille."
            : 'Petits exercices d\'oreille pour reconnaître intervalles, accords et progressions.'
        }
      >
        {mode && (
          <button
            type="button"
            onClick={() => setMode(null)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-sm text-text-muted hover:text-text"
          >
            ← Modes
          </button>
        )}
      </PageHeader>

      {!mode ? (
        <ModePicker onPick={setMode} />
      ) : (
        <Game
          mode={mode}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          onExit={() => setMode(null)}
        />
      )}
    </>
  );
}

// ─── Mode picker ──────────────────────────────────────────────────────

function ModePicker({ onPick }: { onPick: (mode: Mode) => void }) {
  const modes: Array<{ id: Mode; label: string; description: string; icon: React.ReactNode }> = [
    {
      id: 'intervals',
      label: 'Intervalles',
      description: 'Deux notes jouées en séquence. Devine la distance entre elles.',
      icon: <Sparkles size={28} strokeWidth={1.5} className="text-gold" />,
    },
    {
      id: 'chords',
      label: 'Qualités d\'accord',
      description: 'Un accord est strummé. Devine si c\'est majeur, mineur, 7, etc.',
      icon: <Music size={28} strokeWidth={1.5} className="text-gold" />,
    },
    {
      id: 'progressions',
      label: 'Progressions',
      description: 'Quatre accords joués en séquence. Devine la progression.',
      icon: <Ear size={28} strokeWidth={1.5} className="text-gold" />,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onPick(m.id)}
          className="rounded-2xl border border-border bg-surface p-6 text-left transition-all hover:-translate-y-0.5 hover:border-gold-soft"
        >
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-border-gold bg-gold/5">
            {m.icon}
          </div>
          <h3 className="display text-display-sm">{m.label}</h3>
          <p className="mt-2 text-sm text-text-muted">{m.description}</p>
        </button>
      ))}
    </div>
  );
}

// ─── Game ─────────────────────────────────────────────────────────────

type Question = {
  correct: string; // identifier of the correct answer
  options: string[]; // including correct, shuffled
  play: () => Promise<void>;
};

function Game({
  mode,
  difficulty,
  onDifficultyChange,
  onExit,
}: {
  mode: Mode;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  onExit: () => void;
}) {
  const { strum, playMidi } = useAudio();
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  // Génère une nouvelle question selon le mode et la difficulté
  const generate = useCallback((): Question => {
    if (mode === 'intervals') {
      const pool = INTERVAL_POOL[difficulty];
      const correct = pool[Math.floor(Math.random() * pool.length)];
      const opts = sampleOthers(pool, correct, 3);
      const intv = INTERVALS.find((i) => i.name === correct)!;
      const root = 48 + Math.floor(Math.random() * 12); // C3..B3
      const play = async () => {
        await playMidi(root);
        await new Promise((r) => setTimeout(r, 600));
        await playMidi(root + intv.semitones);
      };
      return { correct, options: shuffle([correct, ...opts]), play };
    }

    if (mode === 'chords') {
      const pool = CHORD_POOL[difficulty];
      const correct = pool[Math.floor(Math.random() * pool.length)];
      const opts = sampleOthers(pool, correct, 3);
      const root = NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)] as NoteName;
      const chordName = root + correct;
      const play = async () => {
        await strum(chordName, 'down');
      };
      return { correct, options: shuffle([correct, ...opts]), play };
    }

    // mode === 'progressions'
    const pool = PROG_POOL[difficulty];
    const correctId = pool[Math.floor(Math.random() * pool.length)];
    const opts = sampleOthers(pool, correctId, 3);
    const prog = PROGRESSIONS.find((p) => p.id === correctId)!;
    const rootIdx = Math.floor(Math.random() * NOTE_NAMES.length);
    const play = async () => {
      const tempo = 100;
      const beatMs = 60000 / tempo;
      for (const deg of prog.degrees) {
        const off = DEGREE_OFFSETS[deg];
        if (!off) continue;
        const noteIdx = (rootIdx + off.semis) % 12;
        const chordName = NOTE_NAMES[noteIdx] + off.quality;
        void strum(chordName, 'down');
        await new Promise((r) => setTimeout(r, 4 * beatMs)); // 1 mesure 4/4
      }
    };
    return { correct: correctId, options: shuffle([correctId, ...opts]), play };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, difficulty]);

  // Nouvelle question au load + sur changement mode/difficulté
  const next = useCallback(() => {
    const q = generate();
    setQuestion(q);
    setPicked(null);
    // Auto-play immédiatement
    setTimeout(() => void q.play(), 100);
  }, [generate]);

  useEffect(() => {
    next();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, difficulty]);

  if (!question) return null;

  const handlePick = (opt: string) => {
    if (picked) return; // already answered
    setPicked(opt);
    const ok = opt === question.correct;
    if (ok) {
      setScore((s) => ({ ...s, right: s.right + 1 }));
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
    } else {
      setScore((s) => ({ ...s, wrong: s.wrong + 1 }));
      setStreak(0);
    }
    // Auto-next après 1.2s
    setTimeout(next, 1300);
  };

  const renderLabel = (id: string): string => {
    if (mode === 'intervals') return INTERVALS.find((i) => i.name === id)?.label ?? id;
    if (mode === 'chords') {
      const q = CHORD_QUALITIES.find((q) => q.suffix === id);
      return q?.label ?? (id || 'Majeur');
    }
    return PROGRESSIONS.find((p) => p.id === id)?.label ?? id;
  };

  const total = score.right + score.wrong;
  const accuracy = total > 0 ? Math.round((score.right / total) * 100) : 0;

  return (
    <>
      {/* Score header */}
      <Card className="mb-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="label-small">Score</div>
            <div className="display mt-1 text-display-sm text-gold">
              {score.right}
              <span className="text-display-sm text-text-soft">/{total}</span>
            </div>
            <div className="mt-0.5 text-xs text-text-soft">{accuracy}% de réussite</div>
          </div>
          <div>
            <div className="label-small">Série</div>
            <div className="mt-1 flex items-baseline justify-center gap-1">
              <span className="display text-display-sm text-gold">{streak}</span>
              {streak > 0 && <Flame size={16} className="text-gold-bright" />}
            </div>
            <div className="mt-0.5 text-xs text-text-soft">d'affilée</div>
          </div>
          <div>
            <div className="label-small">Record</div>
            <div className="display mt-1 text-display-sm text-gold-soft">{bestStreak}</div>
            <div className="mt-0.5 text-xs text-text-soft">session</div>
          </div>
        </div>
      </Card>

      {/* Difficulty picker */}
      <div className="mb-5">
        <div className="label-small mb-2">Niveau</div>
        <div className="flex gap-2">
          {(['beginner', 'intermediate', 'expert'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => onDifficultyChange(d)}
              aria-pressed={difficulty === d}
              className={clsx(
                'flex-1 inline-flex h-10 items-center justify-center rounded-full border text-xs font-medium uppercase tracking-wider transition-colors',
                difficulty === d
                  ? 'border-gold bg-gold text-bg'
                  : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
              )}
            >
              {d === 'beginner' ? 'Débutant' : d === 'intermediate' ? 'Inter.' : 'Expert'}
            </button>
          ))}
        </div>
      </div>

      {/* Play / Replay */}
      <Card className="mb-5 text-center">
        <button
          type="button"
          onClick={() => void question.play()}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gold text-bg shadow-gold-strong transition-transform hover:scale-105"
          aria-label="Réécouter"
        >
          <Play size={28} fill="currentColor" />
        </button>
        <div className="mt-3 text-sm text-text-muted">
          Tape pour réécouter — réponds en dessous
        </div>
      </Card>

      {/* Options */}
      <div className="grid gap-3 sm:grid-cols-2">
        {question.options.map((opt) => {
          const isCorrect = opt === question.correct;
          const isPicked = picked === opt;
          const showResult = picked !== null;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => handlePick(opt)}
              disabled={picked !== null}
              className={clsx(
                'flex items-center justify-between gap-3 rounded-xl border px-4 py-4 text-left transition-all',
                !showResult && 'border-border bg-surface hover:border-gold-soft hover:bg-gold/5',
                showResult && isCorrect && 'border-success bg-success/15 text-success',
                showResult && isPicked && !isCorrect && 'border-danger bg-danger/15 text-danger',
                showResult && !isCorrect && !isPicked && 'opacity-50'
              )}
            >
              <span className="text-base font-semibold">{renderLabel(opt)}</span>
              {showResult && isCorrect && <Check size={18} strokeWidth={3} />}
              {showResult && isPicked && !isCorrect && <X size={18} strokeWidth={3} />}
            </button>
          );
        })}
      </div>

      {/* Skip / Reset */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={next}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm text-text-muted hover:text-text"
        >
          <RotateCcw size={14} /> Question suivante
        </button>
        <button
          type="button"
          onClick={() => {
            setScore({ right: 0, wrong: 0 });
            setStreak(0);
            setBestStreak(0);
            next();
          }}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-xs text-text-soft hover:text-text"
        >
          Reset score
        </button>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-3 text-xs text-text-soft hover:text-text"
        >
          Quitter
        </button>
      </div>
    </>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function sampleOthers<T>(pool: T[], exclude: T, count: number): T[] {
  const candidates = pool.filter((p) => p !== exclude);
  const shuffled = shuffle(candidates);
  return shuffled.slice(0, count);
}
