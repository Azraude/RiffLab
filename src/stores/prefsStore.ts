import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TuningId } from '@/lib/theory';
import type { FretboardSkinId } from '@/lib/fretboardSkins';
import type { PracticePlanData } from '@/lib/practicePlan';
import type { ThemeId } from '@/lib/themes';
import type { StrumSoundId } from '@/lib/strumSounds';

type PrefsState = {
  tuning: TuningId;
  capo: number;
  audioEnabled: boolean;
  volume: number;
  showNoteNames: boolean;
  fretboardSkin: FretboardSkinId;
  theme: ThemeId;
  strumSound: StrumSoundId;
  effects3D: boolean;
  practicePlan: PracticePlanData | null;
  setTuning: (t: TuningId) => void;
  setCapo: (n: number) => void;
  toggleAudio: () => void;
  setVolume: (v: number) => void;
  toggleNoteNames: () => void;
  setFretboardSkin: (id: FretboardSkinId) => void;
  setTheme: (id: ThemeId) => void;
  setStrumSound: (id: StrumSoundId) => void;
  toggleEffects3D: () => void;
  setPracticePlan: (plan: PracticePlanData | null) => void;
  toggleActivityDone: (dayNumber: number, templateId: string) => void;
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
      theme: 'dark-gold',
      strumSound: 'karplus',
      effects3D: true,
      practicePlan: null,
      setTuning: (tuning) => set({ tuning }),
      setCapo: (capo) => set({ capo }),
      toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
      setVolume: (volume) => set({ volume }),
      toggleNoteNames: () => set((s) => ({ showNoteNames: !s.showNoteNames })),
      setFretboardSkin: (fretboardSkin) => set({ fretboardSkin }),
      setTheme: (theme) => set({ theme }),
      setStrumSound: (strumSound) => set({ strumSound }),
      toggleEffects3D: () => set((s) => ({ effects3D: !s.effects3D })),
      setPracticePlan: (practicePlan) => set({ practicePlan }),
      toggleActivityDone: (dayNumber, templateId) =>
        set((s) => {
          if (!s.practicePlan) return s;
          const days = s.practicePlan.days.map((d) =>
            d.dayNumber !== dayNumber
              ? d
              : {
                  ...d,
                  activities: d.activities.map((a) =>
                    a.templateId === templateId ? { ...a, done: !a.done } : a
                  ),
                }
          );
          return { practicePlan: { ...s.practicePlan, days } };
        }),
    }),
    {
      name: 'rifflab-prefs',
      version: 6,
      /**
       * Migration permissive : on garde tous les champs reconnus et on
       * remplit les nouveaux avec les valeurs par défaut. Comme ça,
       * bumper la version ne reset PAS les préférences existantes du user.
       */
      migrate: (persisted, _version) => {
        const p = (persisted ?? {}) as Partial<PrefsState>;
        return {
          tuning: p.tuning ?? 'standard',
          capo: p.capo ?? 0,
          audioEnabled: p.audioEnabled ?? true,
          volume: p.volume ?? 0.65,
          showNoteNames: p.showNoteNames ?? true,
          fretboardSkin: p.fretboardSkin ?? 'noir-mat',
          theme: p.theme ?? 'dark-gold',
          strumSound: p.strumSound ?? 'karplus',
          effects3D: p.effects3D ?? true,
          practicePlan: p.practicePlan ?? null,
        } as PrefsState;
      },
    }
  )
);
