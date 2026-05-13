import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { usePitchDetector, midiToFreq } from '@/hooks/usePitchDetector';
import { usePrefs } from '@/stores/prefsStore';
import { TUNINGS, NOTE_NAMES, pitchClass } from '@/lib/theory';
import { Mic, MicOff, Play, X, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

const IN_TUNE_CENTS = 5;

// Tolérance large pour le snap auto-string (±300 cents = ±3 semitones)
const AUTO_SNAP_RANGE = 300;

export function Tuner() {
  const tuning = usePrefs((s) => s.tuning);
  const openMidis = TUNINGS[tuning];
  const { state, pitch, error, start, stop } = usePitchDetector();
  const [manualStringIdx, setManualStringIdx] = useState<number | null>(null);
  const lastInTuneRef = useRef(false);

  // Détermine la corde cible : manual pin > auto-detect par proximité
  const targetIdx = useMemo<number | null>(() => {
    if (manualStringIdx !== null) return manualStringIdx;
    if (pitch.smoothedFrequency === null) return null;
    // Trouve la corde la plus proche en cents
    const detectedExactMidi =
      69 + 12 * Math.log2(pitch.smoothedFrequency / 440);
    let bestIdx = -1;
    let bestDist = Infinity;
    openMidis.forEach((stringMidi, i) => {
      const distCents = Math.abs(detectedExactMidi - stringMidi) * 100;
      if (distCents < bestDist) {
        bestDist = distCents;
        bestIdx = i;
      }
    });
    return bestDist <= AUTO_SNAP_RANGE ? bestIdx : null;
  }, [pitch.smoothedFrequency, openMidis, manualStringIdx]);

  // Cents vs cible (signé : - = trop grave, + = trop aigu)
  const targetData = useMemo(() => {
    if (targetIdx === null || pitch.smoothedFrequency === null) return null;
    const targetMidi = openMidis[targetIdx];
    const targetFreq = midiToFreq(targetMidi);
    const cents = Math.round(1200 * Math.log2(pitch.smoothedFrequency / targetFreq));
    return { targetIdx, targetMidi, targetFreq, cents };
  }, [targetIdx, pitch.smoothedFrequency, openMidis]);

  // Vibration mobile une seule fois quand on entre dans la zone in-tune
  useEffect(() => {
    if (!targetData) {
      lastInTuneRef.current = false;
      return;
    }
    const isInTune = Math.abs(targetData.cents) <= IN_TUNE_CENTS;
    if (isInTune && !lastInTuneRef.current) {
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(50);
      }
    }
    lastInTuneRef.current = isInTune;
  }, [targetData]);

  // Référence tone — 2 sec sine wave au pitch cible
  const playReference = (midi: number) => {
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = midiToFreq(midi);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain).connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.setValueAtTime(0.25, now + 1.85);
      gain.gain.linearRampToValueAtTime(0, now + 2);
      osc.start(now);
      osc.stop(now + 2.05);
      // Auto-cleanup the context after the tone ends
      setTimeout(() => ctx.close().catch(() => undefined), 2300);
    } catch {
      // ignore
    }
  };

  // ─── Rendus selon état ──────────────────────────────────────────

  if (state === 'idle' || state === 'requesting') {
    return (
      <>
        <PageHeader
          title="Tuner"
          subtitle="Accordage au micro avec détection de pitch précise."
        />
        <Card className="mx-auto max-w-xl text-center py-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-border-gold bg-gold/5 text-gold">
            <Mic size={28} strokeWidth={1.5} />
          </div>
          <h2 className="display text-display-sm mb-2">Branche ton micro</h2>
          <p className="mx-auto mb-6 max-w-sm text-sm text-text-muted">
            RiffLab utilise le micro pour détecter la fréquence de chaque corde
            et te dire de combien tu es désaccordé.
          </p>
          <button
            type="button"
            onClick={start}
            disabled={state === 'requesting'}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gold px-6 text-sm font-semibold text-bg shadow-gold hover:bg-gold-bright hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0"
          >
            <Mic size={18} />
            {state === 'requesting' ? 'Demande au navigateur…' : 'Activer le micro'}
          </button>
        </Card>
      </>
    );
  }

  if (state === 'denied' || state === 'error') {
    return (
      <>
        <PageHeader title="Tuner" />
        <Card className="mx-auto max-w-xl text-center py-10">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-danger/40 bg-danger/10 text-danger">
            <MicOff size={28} strokeWidth={1.5} />
          </div>
          <h2 className="display text-display-sm mb-2">
            {state === 'denied' ? 'Micro refusé' : 'Erreur micro'}
          </h2>
          <p className="mx-auto mb-6 max-w-sm text-sm text-text-muted">
            {error ?? 'Une erreur est survenue.'}
          </p>
          <button
            type="button"
            onClick={start}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-gold px-5 text-sm hover:bg-gold/5"
          >
            <RefreshCw size={16} /> Réessayer
          </button>
        </Card>
      </>
    );
  }

  // ─── Granted : live tuner UI ─────────────────────────────────

  const noteName = targetData ? noteWithOctave(targetData.targetMidi) : null;
  const isInTune = targetData ? Math.abs(targetData.cents) <= IN_TUNE_CENTS : false;
  const isClose = targetData ? Math.abs(targetData.cents) <= 15 : false;
  // Clamp cents pour l'aiguille (visuel -50 à +50)
  const needleCents = targetData ? Math.max(-50, Math.min(50, targetData.cents)) : 0;
  const needlePct = ((needleCents + 50) / 100) * 100;

  return (
    <>
      <PageHeader title="Tuner">
        <button
          type="button"
          onClick={stop}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm text-text-muted hover:border-danger/40 hover:text-danger"
          aria-label="Arrêter le micro"
        >
          <X size={16} /> Stop
        </button>
      </PageHeader>

      <Card className="mx-auto max-w-xl">
        {/* Big note + cents */}
        <div className="text-center">
          <div className="label-small">
            {targetData ? `Cible : corde ${targetData.targetIdx + 1} · ${noteWithOctave(targetData.targetMidi)}` : 'En attente…'}
          </div>
          <div
            className={clsx(
              'display mt-3 leading-none transition-colors',
              'text-[72px] md:text-[112px]',
              isInTune ? 'text-success text-gold-glow' : 'text-gold'
            )}
          >
            {noteName ?? '—'}
          </div>
          <div className="mt-2 font-mono text-sm">
            {targetData ? (
              <span
                className={clsx(
                  'font-bold',
                  isInTune ? 'text-success' : isClose ? 'text-gold' : 'text-text-muted'
                )}
              >
                {targetData.cents > 0 ? '+' : ''}
                {targetData.cents} cents
              </span>
            ) : (
              <span className="text-text-soft">Joue une note</span>
            )}
            {targetData && (
              <span className="ml-3 text-text-soft">
                · {targetData.targetFreq.toFixed(2)} Hz cible
              </span>
            )}
          </div>
        </div>

        {/* Aiguille horizontale -50 → +50 cents */}
        <div className="mt-7">
          <div className="relative h-12 rounded-full border border-border bg-surface-2">
            {/* Gradations de fond */}
            <div className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-text-soft/30" />
            <div className="absolute inset-y-2 left-[5%] w-px bg-text-soft/15" />
            <div className="absolute inset-y-2 left-[25%] w-px bg-text-soft/15" />
            <div className="absolute inset-y-2 left-[75%] w-px bg-text-soft/15" />
            <div className="absolute inset-y-2 right-[5%] w-px bg-text-soft/15" />
            {/* Zone in-tune au centre (±5 cents) */}
            <div
              className={clsx(
                'absolute inset-y-1 left-[45%] right-[45%] rounded-full transition-colors',
                isInTune ? 'bg-success/30' : 'bg-gold/10'
              )}
            />
            {/* Aiguille */}
            {targetData && (
              <div
                className="absolute top-0 bottom-0 w-1 -translate-x-1/2 transition-[left] duration-100 ease-out"
                style={{ left: `${needlePct}%` }}
              >
                <div
                  className={clsx(
                    'h-full w-full rounded-full',
                    isInTune
                      ? 'bg-success shadow-[0_0_12px_rgba(76,175,133,0.7)]'
                      : 'bg-gold-bright shadow-gold'
                  )}
                />
              </div>
            )}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-text-soft">
            <span>−50</span>
            <span>−25</span>
            <span className="text-gold">0</span>
            <span>+25</span>
            <span>+50</span>
          </div>
        </div>

        {/* Indication tune up/down si très loin */}
        {targetData && Math.abs(targetData.cents) > 50 && (
          <div className="mt-3 text-center text-sm">
            <span className="rounded-md bg-gold/10 px-3 py-1 font-mono font-semibold text-gold">
              {targetData.cents < 0 ? '↑ Monter beaucoup' : '↓ Descendre beaucoup'}
            </span>
          </div>
        )}

        {/* Sélecteur de corde (auto / manuel) */}
        <div className="mt-7">
          <div className="mb-2 flex items-center justify-between">
            <span className="label-small">Cordes (accordage actif)</span>
            {manualStringIdx !== null && (
              <button
                type="button"
                onClick={() => setManualStringIdx(null)}
                className="text-[10px] uppercase tracking-wider text-gold hover:text-gold-bright"
              >
                Auto-détection
              </button>
            )}
          </div>
          <div className="grid grid-cols-6 gap-2">
            {openMidis.map((midi, i) => {
              const active = targetIdx === i;
              const pinned = manualStringIdx === i;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setManualStringIdx((cur) => (cur === i ? null : i))}
                  aria-pressed={pinned}
                  className={clsx(
                    'flex h-14 flex-col items-center justify-center rounded-lg border text-xs transition-all',
                    pinned
                      ? 'border-gold bg-gold text-bg'
                      : active
                        ? 'border-gold-soft bg-gold/10 text-gold'
                        : 'border-border bg-surface-2 text-text-muted hover:border-gold-soft hover:text-text'
                  )}
                >
                  <span className="font-mono text-base font-bold">
                    {NOTE_NAMES[pitchClass(midi)]}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider opacity-70">
                    {i + 1}
                  </span>
                </button>
              );
            })}
          </div>
          {manualStringIdx !== null && (
            <p className="mt-2 text-center text-[11px] text-text-soft">
              Corde {manualStringIdx + 1} épinglée — utile si YIN se trompe d'octave.
            </p>
          )}
        </div>

        {/* Référence audio */}
        {targetData && (
          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => playReference(targetData.targetMidi)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border-gold px-4 text-sm hover:bg-gold/5"
            >
              <Play size={14} />
              Référence ({noteWithOctave(targetData.targetMidi)})
            </button>
          </div>
        )}

        {/* Debug audio level (subtil) */}
        <div className="mt-5 border-t border-border pt-3 text-center text-[10px] text-text-soft">
          {pitch.rmsDb > -Infinity ? (
            <>Niveau micro : {pitch.rmsDb.toFixed(0)} dB</>
          ) : (
            <>Silence</>
          )}
        </div>
      </Card>
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

/** "E2", "A2", "D3", etc. — note + octave musical */
function noteWithOctave(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[pitchClass(midi)];
  return `${name}${octave}`;
}
