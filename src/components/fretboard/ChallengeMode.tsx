/**
 * ChallengeMode — ear-training audio du Fretboard Learner.
 *
 * Boucle : la voix FR annonce "Nième corde, Note" → l'user joue la note sur
 * sa guitare → le micro détecte le pitch (via usePitchDetector, pipeline YIN
 * existant) → validation par pitch class (toutes octaves) → note suivante.
 *
 * On compare uniquement le NOM de note (pas la corde) : une note donnée
 * existe sur plusieurs cordes, donc impossible de deviner la corde jouée —
 * c'est l'énoncé pédagogique, pas une contrainte vérifiable.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Check, SkipForward, RefreshCw, Flame } from 'lucide-react';
import clsx from 'clsx';
import { usePitchDetector } from '@/hooks/usePitchDetector';
import { speakChallenge, cancelSpeech, initVoices } from '@/lib/audio/speakNote';
import { noteNameMatches, midiToNoteName } from '@/lib/audio/pitchDetector';

/** Notes naturelles atteignables par corde (0-7e case env.) — challenge simple. */
const STRING_NOTES_CYCLE = [
  { string: 6, notes: ['E', 'F', 'G', 'A', 'B', 'C', 'D'] },
  { string: 5, notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'] },
  { string: 4, notes: ['D', 'E', 'F', 'G', 'A', 'B', 'C'] },
  { string: 3, notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F'] },
  { string: 2, notes: ['B', 'C', 'D', 'E', 'F', 'G', 'A'] },
  { string: 1, notes: ['E', 'F', 'G', 'A', 'B', 'C', 'D'] },
];

function pickRandomChallenge(): { string: number; note: string } {
  const str = STRING_NOTES_CYCLE[Math.floor(Math.random() * STRING_NOTES_CYCLE.length)];
  const note = str.notes[Math.floor(Math.random() * str.notes.length)];
  return { string: str.string, note };
}

export function ChallengeMode() {
  const { state, pitch, error, start, stop } = usePitchDetector();
  const [current, setCurrent] = useState<{ string: number; note: string } | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | null>(null);

  // Lock pendant l'annonce vocale + après un match (évite de re-valider la
  // même note tant qu'elle résonne encore).
  const lockRef = useRef(false);

  useEffect(() => {
    initVoices();
  }, []);

  const nextChallenge = useCallback(async () => {
    lockRef.current = true;
    const next = pickRandomChallenge();
    setCurrent(next);
    setFeedback(null);
    await new Promise((r) => setTimeout(r, 350));
    await speakChallenge(next.string, next.note);
    lockRef.current = false;
  }, []);

  const handleStart = useCallback(async () => {
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    await start();
    await nextChallenge();
  }, [start, nextChallenge]);

  const handleStop = useCallback(() => {
    stop();
    cancelSpeech();
    setCurrent(null);
    setFeedback(null);
    lockRef.current = false;
  }, [stop]);

  const handleSkip = useCallback(() => {
    setScore((s) => ({ ...s, total: s.total + 1 }));
    setStreak(0);
    void nextChallenge();
  }, [nextChallenge]);

  // Détection : on valide dès que la note jouée matche la cible.
  useEffect(() => {
    if (state !== 'granted' || !current || feedback === 'correct') return;
    if (lockRef.current || pitch.midi == null) return;
    if (noteNameMatches(current.note, pitch.midi)) {
      lockRef.current = true;
      setScore((s) => ({ correct: s.correct + 1, total: s.total + 1 }));
      setStreak((s) => s + 1);
      setFeedback('correct');
      window.setTimeout(() => void nextChallenge(), 900);
    }
  }, [pitch.midi, state, current, feedback, nextChallenge]);

  // Cleanup à l'unmount (le hook stoppe déjà le micro, on coupe la voix).
  useEffect(() => () => cancelSpeech(), []);

  const detected = pitch.midi != null ? midiToNoteName(pitch.midi) : null;

  // ─── États micro non actifs ───────────────────────────────────────
  if (state === 'idle' || state === 'requesting') {
    return (
      <div className="rounded-2xl border border-border-gold bg-surface p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border-gold bg-gold/5 text-gold">
          <Mic size={26} strokeWidth={1.5} />
        </div>
        <h3 className="display text-display-sm mb-2">🎧 Mode Challenge</h3>
        <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
          La voix t'annonce une note, tu la joues sur ta guitare, l'app écoute
          et valide. Entraîne ton oreille et ta connaissance du manche.
        </p>
        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={state === 'requesting'}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-6 text-sm font-semibold text-bg shadow-gold hover:-translate-y-px disabled:opacity-60"
        >
          <Mic size={18} />
          {state === 'requesting' ? 'Demande au navigateur…' : 'Démarrer le challenge'}
        </button>
      </div>
    );
  }

  if (state === 'denied' || state === 'error') {
    return (
      <div className="rounded-2xl border border-danger/40 bg-surface p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-danger/40 bg-danger/10 text-danger">
          <MicOff size={26} strokeWidth={1.5} />
        </div>
        <h3 className="display text-display-sm mb-2">
          {state === 'denied' ? 'Micro refusé' : 'Erreur micro'}
        </h3>
        <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
          {error ?? 'Autorise le micro dans les réglages du navigateur.'}
        </p>
        <button
          type="button"
          onClick={() => void handleStart()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-gold px-5 text-sm hover:bg-gold/5"
        >
          <RefreshCw size={16} /> Réessayer
        </button>
      </div>
    );
  }

  // ─── Micro actif : challenge live ─────────────────────────────────
  return (
    <div className="rounded-2xl border border-border-gold bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="display text-display-sm text-gold">🎧 Mode Challenge</h3>
        <div className="flex items-center gap-3 text-sm text-text-muted">
          <span>
            Score <span className="font-mono text-gold">{score.correct}</span>/{score.total}
          </span>
          {streak > 2 && (
            <span className="inline-flex items-center gap-1 text-gold">
              <Flame size={13} fill="currentColor" />
              <span className="font-mono">{streak}</span>
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 text-center">
        <div className="label-small">Joue</div>
        <div className="display mt-1 text-3xl text-gold">
          {current ? `Corde ${current.string} · ${current.note}` : '…'}
        </div>
      </div>

      <div
        className={clsx(
          'mb-4 min-h-[72px] rounded-xl border bg-surface-2 p-3 text-center transition-colors',
          feedback === 'correct' ? 'border-success/50 bg-success/10' : 'border-border',
        )}
      >
        {feedback === 'correct' ? (
          <div className="flex h-full items-center justify-center gap-2 pt-3 text-success">
            <Check size={22} /> <span className="display text-xl">Bien joué !</span>
          </div>
        ) : detected ? (
          <>
            <div className="display text-3xl text-text">
              {detected.noteName}
              <span className="text-base text-text-muted">{detected.octave}</span>
            </div>
            <div className="mt-0.5 font-mono text-xs text-text-soft">
              {pitch.smoothedFrequency ? `${Math.round(pitch.smoothedFrequency)} Hz` : ''}
              {pitch.cents ? ` · ${pitch.cents > 0 ? '+' : ''}${pitch.cents}¢` : ''}
            </div>
          </>
        ) : (
          <div className="pt-4 text-sm text-text-soft">Joue une note…</div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSkip}
          className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border-gold text-sm text-text-muted hover:text-gold"
        >
          <SkipForward size={15} /> Passer
        </button>
        <button
          type="button"
          onClick={handleStop}
          className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-danger/40 px-4 text-sm text-danger hover:bg-danger/5"
        >
          <MicOff size={15} /> Stop
        </button>
      </div>
    </div>
  );
}
