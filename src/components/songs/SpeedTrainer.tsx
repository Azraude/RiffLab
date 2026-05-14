import { useEffect, useRef, useState } from 'react';
import type { ChordRef, Section } from '@/lib/db';
import { useAudio } from '@/hooks/useAudio';
import { Pause, Play, Check } from 'lucide-react';
import clsx from 'clsx';

const FACTORS = [0.6, 0.7, 0.8, 0.9, 1.0] as const;
type Factor = (typeof FACTORS)[number];

interface SpeedTrainerProps {
  section: Section;
  originalTempo: number;
}

/**
 * Speed Trainer — joue une section en boucle au tempo réduit (60% → 100%
 * du tempo cible) pour s'entraîner à monter en vitesse progressivement.
 *
 * - 5 paliers : 60 / 70 / 80 / 90 / 100 % du tempo original.
 * - User clique "C'était propre" pour valider et auto-monter au palier
 *   suivant. Sinon il peut rester sur place et retry.
 * - Validation locale (pas persistée pour l'instant — itération future
 *   pourra ajouter `section.speedTrainerProgress?: number[]`).
 */
export function SpeedTrainer({ section, originalTempo }: SpeedTrainerProps) {
  const { strum } = useAudio();
  const [factor, setFactor] = useState<Factor>(0.6);
  const [validated, setValidated] = useState<Set<Factor>>(new Set());
  const [playing, setPlaying] = useState(false);
  const [activeChordIdx, setActiveChordIdx] = useState<number | null>(null);
  const cancelRef = useRef(false);

  const targetBpm = Math.round(originalTempo * factor);
  const chords: ChordRef[] = section.chords;

  // Loop player — joue la section en continu tant que `playing` est true.
  useEffect(() => {
    if (!playing) {
      cancelRef.current = true;
      setActiveChordIdx(null);
      return;
    }
    if (chords.length === 0) {
      setPlaying(false);
      return;
    }
    cancelRef.current = false;
    const beatMs = 60000 / targetBpm;
    let idx = 0;

    (async () => {
      while (!cancelRef.current) {
        const c = chords[idx % chords.length];
        setActiveChordIdx(idx % chords.length);
        void strum(c.name, 'down');
        await new Promise((r) => setTimeout(r, c.beats * beatMs));
        idx++;
        // Safety stop après 64 boucles (le user a oublié)
        if (idx > chords.length * 64) {
          setPlaying(false);
          break;
        }
      }
      setActiveChordIdx(null);
    })();

    return () => {
      cancelRef.current = true;
    };
  }, [playing, targetBpm, chords, strum]);

  // Quand le palier change pendant la lecture, on relance la boucle
  // (cancel auto via le cleanup de l'effect ci-dessus, puis relance).

  const handleValidate = () => {
    const next = new Set(validated);
    next.add(factor);
    setValidated(next);
    // Auto-bump au palier suivant
    const i = FACTORS.indexOf(factor);
    if (i < FACTORS.length - 1) {
      setFactor(FACTORS[i + 1]);
    }
  };

  const isMaxReached = validated.has(1.0);

  return (
    <div className="grid gap-5">
      {/* Tempo big display */}
      <div className="rounded-2xl border border-border bg-surface-2 p-5 text-center">
        <div className="label-small">Tempo cible</div>
        <div className="display mt-1 text-[64px] leading-none text-gold text-gold-glow">
          {targetBpm}
        </div>
        <div className="label-small mt-1">
          BPM · {Math.round(factor * 100)}% du tempo original ({originalTempo})
        </div>
      </div>

      {/* Palier picker */}
      <div>
        <div className="label-small mb-2">Choisis ton palier</div>
        <div className="grid grid-cols-5 gap-2">
          {FACTORS.map((f) => {
            const isCurrent = f === factor;
            const isValid = validated.has(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFactor(f)}
                aria-pressed={isCurrent}
                className={clsx(
                  'flex flex-col items-center justify-center rounded-xl border py-3 transition-all',
                  isCurrent
                    ? 'border-gold bg-gold/10 text-gold shadow-gold'
                    : isValid
                      ? 'border-success/50 bg-success/10 text-success'
                      : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
                )}
              >
                <span className="font-mono text-base font-bold">
                  {Math.round(f * 100)}%
                </span>
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {Math.round(originalTempo * f)} bpm
                </span>
                {isValid && (
                  <Check
                    size={12}
                    className="mt-1 text-success"
                    strokeWidth={3}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progression curve : barres représentant les paliers validés */}
      <div className="rounded-xl border border-border bg-surface-2 p-4">
        <div className="label-small mb-2">Progression sur cette section</div>
        <div className="flex items-end gap-1.5 h-12">
          {FACTORS.map((f) => {
            const isValid = validated.has(f);
            const isCurrent = f === factor;
            const baseHeight = (FACTORS.indexOf(f) + 1) * 18; // 18, 36, 54, 72, 90 %
            return (
              <div
                key={f}
                className={clsx(
                  'flex-1 rounded-t transition-all',
                  isValid
                    ? 'bg-gold'
                    : isCurrent
                      ? 'bg-gold/40'
                      : 'bg-border'
                )}
                style={{ height: `${baseHeight}%` }}
                title={`${Math.round(f * 100)}%`}
              />
            );
          })}
        </div>
        {isMaxReached && (
          <p className="mt-3 text-center text-sm text-success">
            ✓ Tu maîtrises cette section à 100 % du tempo. Bien joué.
          </p>
        )}
      </div>

      {/* Liste des chords avec highlight live */}
      <div>
        <div className="label-small mb-2">Suite à jouer</div>
        <div className="flex flex-wrap gap-2">
          {chords.length === 0 ? (
            <p className="text-sm text-text-soft">Cette section n'a pas d'accord.</p>
          ) : (
            chords.map((c, i) => (
              <div
                key={i}
                className={clsx(
                  'flex h-10 items-center gap-2 rounded-lg border px-3 transition-all',
                  activeChordIdx === i
                    ? 'border-gold bg-gold/15 text-gold-bright shadow-gold scale-105'
                    : 'border-border bg-surface text-gold'
                )}
              >
                <span className="font-mono text-sm font-bold">{c.name}</span>
                <span className="text-[10px] text-text-soft">{c.beats}t</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPlaying(!playing)}
          disabled={chords.length === 0}
          className={clsx(
            'inline-flex h-12 items-center justify-center gap-2 rounded-2xl font-semibold transition-all',
            playing
              ? 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25'
              : 'bg-gold text-bg shadow-gold hover:bg-gold-bright hover:-translate-y-px',
            chords.length === 0 && 'opacity-50 hover:translate-y-0'
          )}
        >
          {playing ? (
            <>
              <Pause size={18} fill="currentColor" /> Stop
            </>
          ) : (
            <>
              <Play size={18} fill="currentColor" /> Lancer la boucle
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleValidate}
          disabled={validated.has(factor)}
          className={clsx(
            'inline-flex h-12 items-center justify-center gap-2 rounded-2xl border font-semibold transition-all',
            validated.has(factor)
              ? 'border-success/40 bg-success/10 text-success'
              : 'border-border-gold text-text hover:bg-gold/5'
          )}
        >
          <Check size={18} />
          {validated.has(factor) ? 'Palier validé' : "C'était propre — valider"}
        </button>
      </div>

      <p className="text-center text-xs text-text-soft">
        Astuce : commence à 60 %, valide quand tu joues sans accroc, monte d'un cran.
      </p>
    </div>
  );
}
