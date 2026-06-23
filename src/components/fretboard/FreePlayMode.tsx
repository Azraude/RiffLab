/**
 * FreePlayMode — détection live libre (bonus). Pas de challenge : on joue
 * n'importe quelle note, l'app affiche le nom en gros + toutes les positions
 * où cette note (pitch class) se trouve sur le manche (cordes × frettes 0-12),
 * d'après l'accordage actif.
 */
import { useEffect, useMemo } from 'react';
import { Mic, MicOff, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { usePitchDetector } from '@/hooks/usePitchDetector';
import { usePrefs } from '@/stores/prefsStore';
import { TUNINGS, NOTE_NAMES, pitchClass } from '@/lib/theory';
import { midiToNoteName } from '@/lib/audio/pitchDetector';

const MAX_FRET = 12;

export function FreePlayMode() {
  const tuning = usePrefs((s) => s.tuning);
  const openMidis = TUNINGS[tuning];
  const { state, pitch, error, start, stop } = usePitchDetector();

  // Toutes les positions (corde, frette) du pitch class détecté.
  const positions = useMemo(() => {
    if (pitch.midi == null) return [];
    const targetPc = pitchClass(pitch.midi);
    const out: { string: number; fret: number }[] = [];
    openMidis.forEach((open, i) => {
      for (let fret = 0; fret <= MAX_FRET; fret++) {
        if (pitchClass(open + fret) === targetPc) out.push({ string: i + 1, fret });
      }
    });
    return out;
  }, [pitch.midi, openMidis]);

  useEffect(() => () => stop(), [stop]);

  const detected = pitch.midi != null ? midiToNoteName(pitch.midi) : null;

  if (state === 'idle' || state === 'requesting') {
    return (
      <div className="rounded-2xl border border-border-gold bg-surface p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border-gold bg-gold/5 text-gold">
          <Mic size={26} strokeWidth={1.5} />
        </div>
        <h3 className="display text-display-sm mb-2">🎸 Free Play</h3>
        <p className="mx-auto mb-5 max-w-sm text-sm text-text-muted">
          Joue n'importe quelle note : l'app te dit laquelle c'est et où la
          trouver sur le manche.
        </p>
        <button
          type="button"
          onClick={() => void start()}
          disabled={state === 'requesting'}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-6 text-sm font-semibold text-bg shadow-gold hover:-translate-y-px disabled:opacity-60"
        >
          <Mic size={18} />
          {state === 'requesting' ? 'Demande au navigateur…' : 'Activer le micro'}
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
          onClick={() => void start()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-gold px-5 text-sm hover:bg-gold/5"
        >
          <RefreshCw size={16} /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border-gold bg-surface p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="display text-display-sm text-gold">🎸 Free Play</h3>
        <button
          type="button"
          onClick={stop}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs text-text-muted hover:border-danger/40 hover:text-danger"
        >
          <MicOff size={13} /> Stop
        </button>
      </div>

      <div className="mb-5 text-center">
        {detected ? (
          <>
            <div className="display leading-none text-[72px] text-gold md:text-[96px]">
              {detected.noteName}
              <span className="text-3xl text-text-muted">{detected.octave}</span>
            </div>
            <div className="mt-2 font-mono text-sm text-text-soft">
              {pitch.smoothedFrequency ? `${Math.round(pitch.smoothedFrequency)} Hz` : ''}
              {pitch.cents ? ` · ${pitch.cents > 0 ? '+' : ''}${pitch.cents}¢` : ''}
            </div>
          </>
        ) : (
          <div className="py-10 text-sm text-text-soft">Joue une note…</div>
        )}
      </div>

      {positions.length > 0 && (
        <div>
          <div className="label-small mb-2">Où jouer ce {detected?.noteName} (frettes 0-{MAX_FRET})</div>
          <div className="flex flex-wrap gap-1.5">
            {positions.map((p, i) => (
              <span
                key={i}
                className={clsx(
                  'inline-flex items-center gap-1 rounded-md border border-border bg-surface-2 px-2 py-1 font-mono text-xs',
                  p.fret === 0 ? 'text-gold-bright' : 'text-text',
                )}
              >
                C{p.string}
                <span className="text-text-soft">·</span>
                {p.fret === 0 ? 'à vide' : `case ${p.fret}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
