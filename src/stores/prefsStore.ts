import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TuningId } from '@/lib/theory';
import type { FretboardSkinId } from '@/lib/fretboardSkins';
import type { PracticePlanData } from '@/lib/practicePlan';
import type { ThemeId } from '@/lib/themes';
import type { StrumSoundId } from '@/lib/strumSounds';

export type PlayerLevel = 'beginner' | 'intermediate' | 'advanced';

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
  onboardingCompleted: boolean;
  level: PlayerLevel;
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
  setOnboardingCompleted: (done: boolean) => void;
  setLevel: (level: PlayerLevel) => void;
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
      strumSound: 'electric-real-sampled',
      effects3D: true,
      onboardingCompleted: false,
      level: 'beginner',
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
      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),
      setLevel: (level) => set({ level }),
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
      version: 8,
      /**
       * Migration permissive sur la plupart des champs (préserve les
       * choix du user). EXCEPTION : `strumSound` est force-resettée à
       * 'electric-real-sampled' pour toute version < 8 — c'est le
       * nouveau default audio (sampler réel CDN session 18). On force
       * le reset car les recettes synthétiques pre-v8 sonnaient
       * synthétique et les users méritent d'expérimenter la vraie
       * guitare par défaut.
       */
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<PrefsState>;
        const audioReset = version < 8;
        return {
          tuning: p.tuning ?? 'standard',
          capo: p.capo ?? 0,
          audioEnabled: p.audioEnabled ?? true,
          volume: p.volume ?? 0.65,
          showNoteNames: p.showNoteNames ?? true,
          fretboardSkin: p.fretboardSkin ?? 'noir-mat',
          theme: p.theme ?? 'dark-gold',
          strumSound: audioReset
            ? 'electric-real-sampled'
            : p.strumSound ?? 'electric-real-sampled',
          effects3D: p.effects3D ?? true,
          onboardingCompleted: p.onboardingCompleted ?? true, // users existants : skip onboarding
          level: p.level ?? 'beginner',
          practicePlan: p.practicePlan ?? null,
        } as PrefsState;
      },
    }
  )
);
