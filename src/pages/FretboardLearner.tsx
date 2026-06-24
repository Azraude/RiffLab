/**
 * /tools/fretboard-learner — mini-jeu pour mémoriser les notes du manche.
 *
 * Game loop :
 *  1. App pick une note random + start timer
 *  2. Joue la note attendue en preview audio
 *  3. User clique une position sur le Fretboard cliquable
 *  4. Validation :
 *     - correct : pulse vert + score+1, streak+1, +800ms next
 *     - incorrect : pulse rouge + highlight bonne(s) pos en vert + 1500ms
 *     - timeout : highlight bonne pos + 1000ms next
 *  5. Après 20 questions OU stop manuel → modal récap + save Dexie
 *
 * Voir src/lib/fretboardLearner.ts pour la logique pure.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Breadcrumb } from '@/components/nav/Breadcrumb';
import { Fretboard2D, type FretboardPosition } from '@/components/fretboard/Fretboard2D';
import { useAudio } from '@/hooks/useAudio';
import { usePrefs } from '@/stores/prefsStore';
import {
  pickQuestion,
  validateAnswer,
  questionLabel,
  previewMidi,
  questionsPerSession,
  LEVEL_LABELS,
  LEVEL_DESCRIPTIONS,
  type FretboardQuestion,
} from '@/lib/fretboardLearner';
import { saveFretboardLearnerStats, type FretboardLearnerLevel } from '@/lib/db';
import { useToast } from '@/hooks/useToast';
import {
  Flame,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Target,
  Trophy,
} from 'lucide-react';
import clsx from 'clsx';

type Status = 'idle' | 'playing' | 'paused' | 'finished';
type Reveal = {
  /** Position cliquée par l'user */
  clicked: FretboardPosition;
  /** true si correct */
  correct: boolean;
  /** Si incorrect, positions correctes à highlight pour l'apprentissage */
  reveal?: FretboardPosition[];
};

const LEVELS: FretboardLearnerLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];

export function FretboardLearner() {
  const tuning = usePrefs((s) => s.tuning);
  const fretboardSkin = usePrefs((s) => s.fretboardSkin);
  const { playMidi } = useAudio();
  const toast = useToast();

  const [level, setLevel] = useState<FretboardLearnerLevel>('beginner');
  const [status, setStatus] = useState<Status>('idle');
  const [question, setQuestion] = useState<FretboardQuestion | null>(null);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [questionStartedAt, setQuestionStartedAt] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  // Stats session courante
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [fastestMs, setFastestMs] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState(0);

  const totalQuestions = questionsPerSession(level);
  const tickRef = useRef<number | null>(null);

  /** Cleanup interval timer au unmount ou change status */
  useEffect(() => {
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, []);

  /**
   * Pose une nouvelle question. Reset reveal, start timer, joue le preview.
   */
  const askNext = useCallback(
    (idx: number) => {
      const q = pickQuestion(level, tuning);
      setQuestion(q);
      setReveal(null);
      setQuestionIdx(idx);
      const now = performance.now();
      setQuestionStartedAt(now);
      setTimeLeftMs(q.timeBudgetMs);
      // Preview audio
      void playMidi(previewMidi(q));
    },
    [level, tuning, playMidi]
  );

  /**
   * Démarre une nouvelle session : reset stats + démarre 1ère question.
   */
  const startSession = useCallback(() => {
    setCorrect(0);
    setIncorrect(0);
    setSkipped(0);
    setStreak(0);
    setBestStreak(0);
    setFastestMs(0);
    setSessionStartedAt(performance.now());
    setStatus('playing');
    askNext(0);
  }, [askNext]);

  /**
   * Termine la session : save Dexie + show finished modal.
   */
  const endSession = useCallback(async () => {
    if (tickRef.current) window.clearInterval(tickRef.current);
    setStatus('finished');
    const totalTimeMs =
      sessionStartedAt > 0 ? performance.now() - sessionStartedAt : 0;
    try {
      await saveFretboardLearnerStats({
        date: new Date().toISOString(),
        level,
        correct,
        incorrect,
        skipped,
        bestStreak,
        fastestResponseMs: fastestMs,
        totalTimeMs,
      });
    } catch (err) {
      console.error('[fretboard-learner] save stats fail', err);
      toast.warning("Stats non sauvegardées (DB indisponible)");
    }
  }, [
    sessionStartedAt,
    level,
    correct,
    incorrect,
    skipped,
    bestStreak,
    fastestMs,
    toast,
  ]);

  /**
   * Validation d'un clic. Met à jour stats + reveal + schedule next.
   */
  const handlePositionClick = useCallback(
    (pos: FretboardPosition) => {
      if (!question || status !== 'playing' || reveal) return;
      const isCorrect = validateAnswer(question, pos.stringIdx, pos.fret, tuning);
      const responseMs = performance.now() - questionStartedAt;
      if (isCorrect) {
        setCorrect((c) => c + 1);
        setStreak((s) => {
          const ns = s + 1;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });
        if (fastestMs === 0 || responseMs < fastestMs) setFastestMs(responseMs);
        setReveal({ clicked: pos, correct: true });
      } else {
        setIncorrect((i) => i + 1);
        setStreak(0);
        setReveal({
          clicked: pos,
          correct: false,
          reveal: question.validPositions.map((p) => ({
            stringIdx: p.stringIdx,
            fret: p.fret,
          })),
        });
      }
      const nextDelay = isCorrect ? 700 : 1500;
      window.setTimeout(() => {
        const nextIdx = questionIdx + 1;
        if (nextIdx >= totalQuestions) {
          void endSession();
        } else {
          askNext(nextIdx);
        }
      }, nextDelay);
    },
    [
      question,
      status,
      reveal,
      tuning,
      questionStartedAt,
      fastestMs,
      questionIdx,
      totalQuestions,
      askNext,
      endSession,
    ]
  );

  /**
   * Timer ticker — décrémente timeLeftMs, déclenche timeout si 0.
   */
  useEffect(() => {
    if (status !== 'playing' || !question || reveal) {
      if (tickRef.current) {
        window.clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    tickRef.current = window.setInterval(() => {
      const elapsed = performance.now() - questionStartedAt;
      const left = Math.max(0, question.timeBudgetMs - elapsed);
      setTimeLeftMs(left);
      if (left <= 0) {
        // Timeout : score skipped + reveal + next
        if (tickRef.current) window.clearInterval(tickRef.current);
        setSkipped((s) => s + 1);
        setStreak(0);
        setReveal({
          clicked: { stringIdx: -1, fret: -1 }, // sentinel : pas de clic
          correct: false,
          reveal: question.validPositions.map((p) => ({
            stringIdx: p.stringIdx,
            fret: p.fret,
          })),
        });
        window.setTimeout(() => {
          const nextIdx = questionIdx + 1;
          if (nextIdx >= totalQuestions) {
            void endSession();
          } else {
            askNext(nextIdx);
          }
        }, 1200);
      }
    }, 100);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [status, question, reveal, questionStartedAt, questionIdx, totalQuestions, askNext, endSession]);

  const handleSkip = useCallback(() => {
    if (!question || reveal) return;
    setSkipped((s) => s + 1);
    setStreak(0);
    setReveal({
      clicked: { stringIdx: -1, fret: -1 },
      correct: false,
      reveal: question.validPositions.map((p) => ({
        stringIdx: p.stringIdx,
        fret: p.fret,
      })),
    });
    window.setTimeout(() => {
      const nextIdx = questionIdx + 1;
      if (nextIdx >= totalQuestions) {
        void endSession();
      } else {
        askNext(nextIdx);
      }
    }, 1000);
  }, [question, reveal, questionIdx, totalQuestions, askNext, endSession]);

  const handleStop = useCallback(() => {
    void endSession();
  }, [endSession]);

  // Préparation des labels et feedback overlay
  const labels = useMemo(() => (question ? questionLabel(question) : null), [question]);
  const feedback = useMemo(() => {
    if (!reveal) return undefined;
    if (reveal.correct) {
      return { correct: [reveal.clicked] };
    }
    const incorrect = reveal.clicked.stringIdx >= 0 ? [reveal.clicked] : [];
    return {
      incorrect,
      correct: reveal.reveal,
    };
  }, [reveal]);

  // Progress bar (timer)
  const timeProgress = question
    ? Math.max(0, Math.min(1, timeLeftMs / question.timeBudgetMs))
    : 0;

  return (
    <>
      <Breadcrumb to="/tools" label="Outils" />

      <PageHeader
        title="Fretboard Learner"
        subtitle="Apprends ton manche — mini-jeu avec 4 niveaux de difficulté."
      />

      {/* === IDLE / FINISHED : selector de niveau + récap === */}
      {(status === 'idle' || status === 'finished') && (
        <>
          {status === 'finished' && (
            <FinishedRecap
              correct={correct}
              incorrect={incorrect}
              skipped={skipped}
              bestStreak={bestStreak}
              totalTimeMs={performance.now() - sessionStartedAt}
              level={level}
              onReplay={startSession}
              onLevelUp={() => {
                const idx = LEVELS.indexOf(level);
                const nextLevel = LEVELS[Math.min(LEVELS.length - 1, idx + 1)];
                setLevel(nextLevel);
                window.setTimeout(() => startSession(), 100);
              }}
              onClose={() => setStatus('idle')}
            />
          )}

          <Card className="mt-5">
            <h3 className="display text-display-sm">Choisis ton niveau</h3>
            <p className="mt-1 text-sm text-text-muted">
              20 questions par session. Tu peux arrêter à tout moment.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {LEVELS.map((lvl) => {
                const active = lvl === level;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLevel(lvl)}
                    className={clsx(
                      'rounded-2xl border p-4 text-left transition-all',
                      active
                        ? 'border-gold bg-gold/10'
                        : 'border-border bg-surface-2 hover:border-gold-soft'
                    )}
                  >
                    <div
                      className={clsx(
                        'display text-lg',
                        active ? 'text-gold' : 'text-text'
                      )}
                    >
                      {LEVEL_LABELS[lvl]}
                    </div>
                    <p className="mt-1 text-xs text-text-muted">{LEVEL_DESCRIPTIONS[lvl]}</p>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={startSession}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px sm:w-auto sm:px-8"
            >
              <Play size={16} fill="currentColor" />
              Commencer · {LEVEL_LABELS[level]}
            </button>
          </Card>
        </>
      )}

      {/* === PLAYING : question + fretboard + stats live === */}
      {status === 'playing' && question && labels && (
        <>
          {/* Top bar : niveau / score / streak */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-mono uppercase tracking-wider text-gold">
                {LEVEL_LABELS[level]}
              </span>
              <span className="text-text-muted">
                Question{' '}
                <span className="font-mono text-text">
                  {questionIdx + 1}/{totalQuestions}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-text-muted">
                ✓{' '}
                <span className="font-mono text-success">{correct}</span>
                {'  '}
                ✗ <span className="font-mono text-danger">{incorrect}</span>
              </span>
              {streak > 0 && (
                <span className="inline-flex items-center gap-1 text-gold">
                  <Flame size={12} fill="currentColor" />
                  <span className="font-mono">{streak}</span>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleStop}
                className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs text-text-muted hover:border-danger/40 hover:text-danger"
              >
                <Pause size={12} /> Stop
              </button>
            </div>
          </div>

          {/* Question card */}
          <div className="mb-4 overflow-hidden rounded-2xl border border-border-gold bg-surface">
            {/* Timer progress bar */}
            <div className="h-1 bg-border">
              <div
                className={clsx(
                  'h-full transition-[width] duration-100',
                  timeProgress < 0.25
                    ? 'bg-danger'
                    : timeProgress < 0.5
                      ? 'bg-gold-bright'
                      : 'bg-gold'
                )}
                style={{ width: `${timeProgress * 100}%` }}
              />
            </div>
            <div className="px-5 py-6 text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`q-${questionIdx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="display text-display-lg text-gold">{labels.primary}</div>
                  {labels.hint && (
                    <p className="mt-1.5 text-sm text-text-muted">{labels.hint}</p>
                  )}
                  <p className="mt-3 font-mono text-xs uppercase tracking-wider text-text-soft">
                    {Math.ceil(timeLeftMs / 1000)}s restantes
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Fretboard cliquable */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface p-3">
            <div className="-mx-2 overflow-x-auto px-2 pb-2">
              <Fretboard2D
                tuning={tuning}
                numFrets={14}
                showNoteNames={false}
                skin={fretboardSkin}
                onPositionClick={handlePositionClick}
                feedback={feedback}
                className="min-w-[640px]"
              />
            </div>
          </div>

          {/* Skip button */}
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={handleSkip}
              disabled={!!reveal}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 text-sm text-text-muted hover:border-gold-soft hover:text-text disabled:opacity-50"
            >
              <SkipForward size={14} /> Passer cette note
            </button>
          </div>

          {/* Feedback message */}
          <AnimatePresence>
            {reveal && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={clsx(
                  'mt-3 rounded-xl border px-4 py-2.5 text-center text-sm',
                  reveal.correct
                    ? 'border-success/40 bg-success/10 text-success'
                    : 'border-danger/40 bg-danger/10 text-danger'
                )}
              >
                {reveal.correct
                  ? '✓ Bien joué !'
                  : reveal.clicked.stringIdx < 0
                    ? '⏰ Trop lent — la bonne position est en vert'
                    : `✗ Pas tout à fait — la bonne position est en vert`}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </>
  );
}

// ─── Finished recap modal-card ────────────────────────────────────────

function FinishedRecap({
  correct,
  incorrect,
  skipped,
  bestStreak,
  totalTimeMs,
  level,
  onReplay,
  onLevelUp,
  onClose,
}: {
  correct: number;
  incorrect: number;
  skipped: number;
  bestStreak: number;
  totalTimeMs: number;
  level: FretboardLearnerLevel;
  onReplay: () => void;
  onLevelUp: () => void;
  onClose: () => void;
}) {
  const total = correct + incorrect + skipped;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
  const minutes = Math.floor(totalTimeMs / 60000);
  const seconds = Math.floor((totalTimeMs % 60000) / 1000);
  const isLastLevel = level === LEVELS[LEVELS.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-gold/40 bg-gradient-to-br from-gold/10 to-transparent">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-gold/40 bg-gold/15 text-gold">
            <Trophy size={28} />
          </div>
          <h3 className="display mt-4 text-display-md">Session terminée</h3>
          <p className="mt-1 text-sm text-text-muted">
            {LEVEL_LABELS[level]} · {minutes > 0 ? `${minutes}min ` : ''}
            {seconds}s
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 text-center">
            <Stat label="Précision" value={`${accuracy}%`} highlight />
            <Stat label="Correct / Total" value={`${correct}/${total}`} />
            <Stat
              label="Best streak"
              value={bestStreak.toString()}
              icon={bestStreak >= 5 ? <Flame size={12} /> : null}
            />
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={onReplay}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright"
            >
              <RotateCcw size={14} /> Rejouer
            </button>
            {!isLastLevel && (
              <button
                type="button"
                onClick={onLevelUp}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-gold bg-surface px-5 text-sm font-semibold text-text hover:bg-gold/5"
              >
                <Target size={14} /> Niveau supérieur
              </button>
            )}
            <Link
              to="/tools"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-5 text-sm text-text-muted hover:bg-surface-2 hover:text-text"
            >
              Retour aux outils
            </Link>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border px-2 py-3',
        highlight ? 'border-gold/40 bg-gold/10' : 'border-border bg-surface-2'
      )}
    >
      <div className="label-small">{label}</div>
      <div
        className={clsx(
          'display mt-1 text-2xl',
          highlight ? 'text-gold' : 'text-text'
        )}
      >
        <span className="inline-flex items-center gap-1">
          {value}
          {icon}
        </span>
      </div>
    </div>
  );
}
