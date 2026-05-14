import { useCallback, useEffect, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'denied' | 'error';

const PEAK_BUFFER_SIZE = 256;
const LEVELS_HISTORY = 64; // dernières 64 valeurs RMS pour la waveform "live"

/**
 * Hook qui gère MediaRecorder + visualisation niveau audio.
 *
 *   const { state, start, stop, levels, durationMs, blob } = useRecorder();
 *
 * - start() : demande permission micro, démarre l'enregistrement et la
 *   capture du niveau RMS via AnalyserNode (60Hz).
 * - stop() : finalise le blob, le retourne via la prop `blob`.
 * - levels : array glissant des derniers niveaux RMS (0-1), affichable
 *   en waveform "live".
 * - durationMs : durée en ms depuis le start.
 */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>('idle');
  const [levels, setLevels] = useState<number[]>(new Array(LEVELS_HISTORY).fill(0));
  const [durationMs, setDurationMs] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufferRef = useRef<Float32Array | null>(null);
  const rafRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startTimeRef = useRef<number>(0);
  const levelsRef = useRef<number[]>(new Array(LEVELS_HISTORY).fill(0));

  const cleanup = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
    analyserRef.current = null;
    bufferRef.current = null;
    recorderRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (state === 'recording' || state === 'requesting') return;
    setError(null);
    setBlob(null);
    setDurationMs(0);
    levelsRef.current = new Array(LEVELS_HISTORY).fill(0);
    setLevels([...levelsRef.current]);
    setState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Choisir un mimeType supporté
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ];
      const chosenMime =
        candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
      const recorder = new MediaRecorder(stream, chosenMime ? { mimeType: chosenMime } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      setMimeType(chosenMime || recorder.mimeType || 'audio/webm');

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, {
          type: chosenMime || recorder.mimeType || 'audio/webm',
        });
        setBlob(finalBlob);
        setDurationMs(performance.now() - startTimeRef.current);
        cleanup();
        setState('idle');
      };

      // Setup AudioContext pour les niveaux (visualisation)
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = PEAK_BUFFER_SIZE * 2;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;
      source.connect(analyser);
      bufferRef.current = new Float32Array(analyser.fftSize);

      startTimeRef.current = performance.now();
      recorder.start(100);
      setState('recording');

      const tick = () => {
        const a = analyserRef.current;
        const buf = bufferRef.current;
        if (!a || !buf) return;
        a.getFloatTimeDomainData(buf as Float32Array<ArrayBuffer>);
        let sumSq = 0;
        for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
        const rms = Math.sqrt(sumSq / buf.length);
        // Bump level (perceptual sqrt + scale)
        const level = Math.min(1, Math.sqrt(rms) * 2.5);

        // Slide history
        levelsRef.current = [...levelsRef.current.slice(1), level];
        setLevels([...levelsRef.current]);
        setDurationMs(performance.now() - startTimeRef.current);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (e) {
      const err = e as { name?: string; message?: string };
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setState('denied');
        setError('Permission micro refusée. Autorise-la dans les réglages du navigateur.');
      } else {
        setState('error');
        setError(err.message ?? 'Erreur enregistrement.');
      }
      cleanup();
    }
  }, [cleanup, state]);

  const stop = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    } else {
      cleanup();
      setState('idle');
    }
  }, [cleanup]);

  useEffect(() => {
    return () => cleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, levels, durationMs, blob, mimeType, error, start, stop };
}
