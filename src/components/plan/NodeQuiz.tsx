/**
 * NodeQuiz — mini-quiz 3 questions QCM affiché en Sheet après complétion
 * d'un PathLevel.
 *
 * Workflow :
 * 1. Génération : `generateQuiz(node)` au mount (3 questions QCM
 *    randomisées sur chord / scale / technique du node)
 * 2. UX : question par question, click sur option → reveal good/bad
 *    + explication, bouton "Suivant"
 * 3. Fin : screen résultat avec score, message, bouton "Fermer"
 * 4. Persiste dans Dexie `quizResults` (1 essai par node, upsert)
 * 5. Score ≥ 2/3 → badge ⭐ sur le node dans PracticePlan
 *
 * Skippable : le node reste validé même si l'user ne fait pas le quiz.
 * Le quiz est un bonus de progression, pas une condition.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet } from '@/components/ui/Sheet';
import { Confetti } from '@/components/ui/Confetti';
import { Check, X, Award, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { generateQuiz, type Quiz, type QuizQuestion } from '@/lib/nodeQuiz';
import { saveQuizResult } from '@/lib/db';
import type { PathLevel } from '@/lib/practicePath';

interface NodeQuizProps {
  node: PathLevel | null;
  onClose: () => void;
}

export function NodeQuiz({ node, onClose }: NodeQuizProps) {
  // Génère un nouveau quiz à chaque ouverture (re-randomisation)
  const quiz = useMemo<Quiz | null>(() => (node ? generateQuiz(node) : null), [node]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [confettiTick, setConfettiTick] = useState(0);

  // Reset state à chaque nouveau quiz
  useEffect(() => {
    setCurrentIdx(0);
    setSelectedIdx(null);
    setAnswers([]);
    setFinished(false);
  }, [quiz]);

  if (!node || !quiz) return null;

  const currentQ: QuizQuestion | undefined = quiz.questions[currentIdx];
  const score = answers.filter(Boolean).length;
  const total = quiz.questions.length;
  const passed = score >= 2;

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return; // déjà répondu
    if (!currentQ) return;
    const correct = idx === currentQ.answerIdx;
    setSelectedIdx(idx);
    setAnswers((a) => [...a, correct]);
  };

  const handleNext = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx((i) => i + 1);
      setSelectedIdx(null);
    } else {
      // Fin → persist
      void saveQuizResult({
        nodeId: node.id,
        score,
        total,
        passed,
        takenAt: Date.now(),
      });
      if (passed) setConfettiTick((t) => t + 1);
      setFinished(true);
    }
  };

  return (
    <Sheet
      open={node !== null}
      onOpenChange={(o) => !o && onClose()}
      title={`🎓 Petit test — ${node.title}`}
      description={
        finished
          ? `Résultat : ${score}/${total}`
          : `Question ${currentIdx + 1} sur ${total}`
      }
    >
      <Confetti trigger={confettiTick} count={40} duration={2} />

      <AnimatePresence mode="wait">
        {finished ? (
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="text-center"
          >
            <div
              className={clsx(
                'mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2',
                passed
                  ? 'border-success bg-success/15 text-success'
                  : 'border-gold-soft bg-gold/15 text-gold-soft',
              )}
            >
              {passed ? <Award size={36} /> : <span className="display text-3xl">{score}</span>}
            </div>
            <h3 className="display mt-4 text-display-md">
              {passed ? 'Validé 🎉' : 'Pas mal !'}
            </h3>
            <p className="mt-2 text-sm text-text-muted">
              {passed ? (
                <>
                  Tu as eu <strong className="text-success">{score}/{total}</strong>.
                  Tu débloques le badge <span className="text-gold-bright">⭐</span> sur ce niveau.
                </>
              ) : (
                <>
                  Tu as eu <strong className="text-gold">{score}/{total}</strong>.
                  Le niveau reste validé, tu peux retenter le quiz quand tu veux.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright"
            >
              Fermer
            </button>
          </motion.div>
        ) : currentQ ? (
          <motion.div
            key={`q-${currentIdx}`}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            {/* Progress bar */}
            <div className="mb-4 flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <div
                  key={i}
                  className={clsx(
                    'h-1 flex-1 rounded-full transition-colors',
                    i < currentIdx
                      ? answers[i]
                        ? 'bg-success'
                        : 'bg-danger/60'
                      : i === currentIdx
                      ? 'bg-gold'
                      : 'bg-surface-2',
                  )}
                />
              ))}
            </div>

            <h3 className="display text-display-sm leading-snug">
              {currentQ.question}
            </h3>

            <div className="mt-4 space-y-2">
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedIdx === i;
                const isCorrect = i === currentQ.answerIdx;
                const revealed = selectedIdx !== null;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelect(i)}
                    disabled={revealed}
                    aria-pressed={isSelected}
                    className={clsx(
                      'flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors',
                      revealed && isCorrect && 'border-success bg-success/15 text-success',
                      revealed && isSelected && !isCorrect && 'border-danger bg-danger/15 text-danger',
                      !revealed && 'border-border bg-surface-2 text-text hover:border-gold-soft hover:bg-gold/5',
                      revealed && !isSelected && !isCorrect && 'border-border bg-surface-2 text-text-soft opacity-60',
                    )}
                  >
                    <span>{opt}</span>
                    {revealed && isCorrect && <Check size={16} strokeWidth={3} />}
                    {revealed && isSelected && !isCorrect && <X size={16} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>

            {selectedIdx !== null && currentQ.explain && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-lg border border-border-gold bg-gold/5 px-3 py-2 text-xs text-text-muted"
              >
                💡 {currentQ.explain}
              </motion.div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-text-soft hover:text-text"
              >
                Passer le quiz
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={selectedIdx === null}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-bg hover:bg-gold-bright disabled:opacity-50"
              >
                {currentIdx < total - 1 ? 'Suivant' : 'Voir le résultat'}
                <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Sheet>
  );
}
