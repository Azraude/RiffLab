import { useCallback, useEffect, useState } from 'react';
import {
  initAudio,
  isAudioReady,
  playChordVoicing,
  strumChord,
  playNote,
  setMasterVolume,
} from '@/lib/audio';
import { getDefaultVoicing } from '@/lib/chordDatabase';
import { usePrefs } from '@/stores/prefsStore';

/**
 * Hook qui expose l'API audio. Garantit l'init au premier appel.
 */
export function useAudio() {
  const tuning = usePrefs((s) => s.tuning);
  const capo = usePrefs((s) => s.capo);
  const audioEnabled = usePrefs((s) => s.audioEnabled);
  const volume = usePrefs((s) => s.volume);

  const [ready, setReady] = useState(isAudioReady());

  useEffect(() => {
    setMasterVolume(volume);
  }, [volume]);

  const ensureInit = useCallback(async () => {
    if (!ready) {
      await initAudio();
      setReady(true);
    }
  }, [ready]);

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
