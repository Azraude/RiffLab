import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TuningId } from '@/lib/theory';
import type { FretboardSkinId } from '@/lib/fretboardSkins';

type PrefsState = {
  tuning: TuningId;
  capo: number;
  audioEnabled: boolean;
  volume: number;
  showNoteNames: boolean;
  fretboardSkin: FretboardSkinId;
  setTuning: (t: TuningId) => void;
  setCapo: (n: number) => void;
  toggleAudio: () => void;
  setVolume: (v: number) => void;
  toggleNoteNames: () => void;
  setFretboardSkin: (id: FretboardSkinId) => void;
};

export const usePrefs = create<PrefsState>()(
  persist(
    (set) => ({
      tuning: 'standard',
      capo: 0,
      audioEnabled: true,
      volume: 0.65,
      showNoteNames: true,
      fretboardSkin: 'noir-mat',
      setTuning: (tuning) => set({ tuning }),
      setCapo: (capo) => set({ capo }),
      toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
      setVolume: (volume) => set({ volume }),
      toggleNoteNames: () => set((s) => ({ showNoteNames: !s.showNoteNames })),
      setFretboardSkin: (fretboardSkin) => set({ fretboardSkin }),
    }),
    {
      name: 'rifflab-prefs',
      version: 2,
    }
  )
);
