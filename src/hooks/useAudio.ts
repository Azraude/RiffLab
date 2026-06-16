import { useCallback, useEffect, useRef, useState } from 'react';
import {
  initAudio,
  isAudioReady,
  playChordVoicing,
  strumChord,
  playNote,
  setMasterVolume,
  setAudioStatusReporter,
  clearAudioStatusReporter,
  type AudioStatus,
} from '@/lib/audio';
import { getDefaultVoicing } from '@/lib/chordDatabase';
import { usePrefs } from '@/stores/prefsStore';
import { useToast } from '@/hooks/useToast';

/**
 * Hook qui expose l'API audio. Garantit l'init au premier appel.
 */
export function useAudio() {
  const tuning = usePrefs((s) => s.tuning);
  const capo = usePrefs((s) => s.capo);
  const audioEnabled = usePrefs((s) => s.audioEnabled);
  const volume = usePrefs((s) => s.volume);
  const strumSound = usePrefs((s) => s.strumSound);
  const audioQuality = usePrefs((s) => s.audioQuality);

  const [ready, setReady] = useState(isAudioReady());

  // Toast reporter : le moteur audio (non-React) signale le chargement des
  // samples / le fallback synth → on les affiche en toast. Identity-guarded
  // côté audio.ts pour survivre aux multiples montages de useAudio.
  const toast = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  useEffect(() => {
    const reporter = (status: AudioStatus, label: string) => {
      if (status === 'loading') {
        toastRef.current.info(`Chargement du son « ${label} »…`);
      } else if (status === 'fallback') {
        toastRef.current.warning('Mode synthèse activé (samples indisponibles)');
      }
    };
    setAudioStatusReporter(reporter);
    return () => clearAudioStatusReporter(reporter);
  }, []);

  useEffect(() => {
    setMasterVolume(volume);
  }, [volume]);

  const ensureInit = useCallback(async () => {
    if (!ready) {
      await initAudio(strumSound, audioQuality);
      setReady(true);
    }
  }, [ready, strumSound, audioQuality]);

  const playChordByName = useCallback(
    async (name: string) => {
      if (!audioEnabled) return;
      await ensureInit();
      const v = getDefaultVoicing(name);
      if (!v) return;
      await strumChord(v.frets, tuning, capo, 'down');
    },
    [audioEnabled, capo, tuning, ensureInit]
  );

  const strumByName = useCallback(
    async (name: string, direction: 'down' | 'up' = 'down') => {
      if (!audioEnabled) return;
      await ensureInit();
      const v = getDefaultVoicing(name);
      if (!v) return;
      await strumChord(v.frets, tuning, capo, direction);
    },
    [audioEnabled, capo, tuning, ensureInit]
  );

  const playMidi = useCallback(
    async (midi: number) => {
      if (!audioEnabled) return;
      await ensureInit();
      await playNote(midi);
    },
    [audioEnabled, ensureInit]
  );

  return {
    ready,
    playChord: playChordByName,
    strum: strumByName,
    playMidi,
    playChordVoicing: useCallback(
      async (frets: Array<number | null>) => {
        if (!audioEnabled) return;
        await ensureInit();
        await playChordVoicing(frets, tuning, capo);
      },
      [audioEnabled, capo, tuning, ensureInit]
    ),
  };
}
