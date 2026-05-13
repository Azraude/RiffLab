import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PitchDetector,
  freqToMidiAndCents,
  midiToFreq,
} from '@/lib/pitchDetect';

export type PitchState = 'idle' | 'requesting' | 'granted' | 'denied' | 'error';

export type PitchInfo = {
  /** Fréquence brute YIN (Hz), null si pas détecté. */
  frequency: number | null;
  /** Fréquence après EMA smoothing — utilisée pour l'UI (moins jitter). */
  smoothedFrequency: number | null;
  /** Numéro MIDI entier le plus proche, ou null. */
  midi: number | null;
  /** Écart en cents vs midi (-50 à +50). */
  cents: number;
  /** RMS du buffer en dB (-Infinity à 0). Utile pour gating noise floor. */
  rmsDb: number;
};

const BUFFER_SIZE = 2048;
const HPF_FREQ = 70; // kill hum 50/60Hz
const NOISE_FLOOR_DB = -50;
const EMA_ALPHA = 0.3; // 0.7 * last + 0.3 * new

const INITIAL_PITCH: PitchInfo = {
  frequency: null,
  smoothedFrequency: null,
  midi: null,
  cents: 0,
  rmsDb: -Infinity,
};

/**
 * Hook qui gère le pipeline micro → HPF → analyser → YIN → smoothing.
 *
 * Lifecycle :
 *   - state = 'idle' au mount
 *   - start() lance le pipeline (demande permission micro). state passe à
 *     'requesting' puis 'granted' / 'denied' / 'error'.
 *   - tant que granted, `pitch` est mis à jour ~30 fois/sec via RAF.
 *   - stop() arrête tout proprement (RAF, AudioContext, MediaStream).
 *   - unmount = stop automatique.
 */
export function usePitchDetector() {
  const [state, setState] = useState<PitchState>('idle');
  const [pitch, setPitch] = useState<PitchInfo>(INITIAL_PITCH);
  const [error, setError] = useState<string | null>(null);

  // Refs pour les nodes audio (non-serializable, on ne les met pas dans state)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const detectorRef = useRef<PitchDetector | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedRef = useRef<number | null>(null);
  // Throttle : detect 1 frame sur 2 pour viser ~30Hz et économiser CPU
  const frameToggleRef = useRef(false);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    analyserRef.current = null;
    detectorRef.current = null;
    bufferRef.current = null;
    smoothedRef.current = null;
    setPitch(INITIAL_PITCH);
    setState((prev) => (prev === 'granted' ? 'idle' : prev));
  }, []);

  const start = useCallback(async () => {
    if (state === 'granted' || state === 'requesting') return;
    setError(null);
    setState('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      // HPF 70Hz pour killer hum électrique 50/60Hz
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = HPF_FREQ;
      hpf.Q.value = 0.7;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = BUFFER_SIZE;
      analyser.smoothingTimeConstant = 0; // on smooth nous-mêmes
      analyserRef.current = analyser;

      source.connect(hpf);
      hpf.connect(analyser);
      // Pas de connexion à ctx.destination : pas de larsen.

      const detector = new PitchDetector(BUFFER_SIZE, ctx.sampleRate);
      detectorRef.current = detector;
      bufferRef.current = new Float32Array(BUFFER_SIZE);

      setState('granted');
      frameToggleRef.current = false;
      tick();
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setState('denied');
        setError('Permission micro refusée. Autorise dans les réglages du navigateur.');
      } else {
        setState('error');
        setError(err.message ?? 'Erreur micro inconnue.');
      }
      stop();
    }
  }, [state, stop]);

  // RAF loop — read analyser, run YIN, smooth, update state.
  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const buffer = bufferRef.current;
    const detector = detectorRef.current;
    if (!analyser || !buffer || !detector) return;

    // Throttle à ~30Hz (1 frame sur 2)
    frameToggleRef.current = !frameToggleRef.current;
    if (!frameToggleRef.current) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // Cast : avec TS 5.7+, getFloatTimeDomainData attend explicitement
    // Float32Array<ArrayBuffer> et non Float32Array<ArrayBufferLike>.
    analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>);

    // RMS → dB
    let sumSq = 0;
    for (let i = 0; i < buffer.length; i++) {
      sumSq += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sumSq / buffer.length);
    const rmsDb = 20 * Math.log10(rms || 1e-10);

    let frequency: number | null = null;
    if (rmsDb >= NOISE_FLOOR_DB) {
      const result = detector.detect(buffer);
      // Filtrer les fréquences hors plage utile guitare (E1=41Hz → C7=2093Hz)
      if (result.frequency !== null && result.frequency >= 40 && result.frequency <= 2100) {
        frequency = result.frequency;
      }
    }

    // EMA smoothing
    if (frequency !== null) {
      smoothedRef.current =
        smoothedRef.current !== null
          ? (1 - EMA_ALPHA) * smoothedRef.current + EMA_ALPHA * frequency
          : frequency;
    } else {
      smoothedRef.current = null;
    }

    const smoothed = smoothedRef.current;
    let midi: number | null = null;
    let cents = 0;
    if (smoothed !== null) {
      const conv = freqToMidiAndCents(smoothed);
      midi = conv.midi;
      cents = conv.cents;
    }

    setPitch({
      frequency,
      smoothedFrequency: smoothed,
      midi,
      cents,
      rmsDb,
    });

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, pitch, error, start, stop };
}

// Re-export utility
export { midiToFreq };
