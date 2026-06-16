import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TuningId } from '@/lib/theory';
import type { FretboardSkinId } from '@/lib/fretboardSkins';
import type { PracticePlanData } from '@/lib/practicePlan';
import type { ThemeId } from '@/lib/themes';
import { migrateLegacyStrumId, type StrumSoundId } from '@/lib/strumSounds';
import type { AudioQuality } from '@/lib/audio';

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
  audioQuality: AudioQuality;
  effects3D: boolean;
  onboardingCompleted: boolean;
  tutorialCompleted: boolean;
  planTutorialSeen: boolean;
  composerTutorialSeen: boolean;
  unlockedSecretTheme: boolean;
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
  setAudioQuality: (q: AudioQuality) => void;
  toggleEffects3D: () => void;
  setOnboardingCompleted: (done: boolean) => void;
  setTutorialCompleted: (done: boolean) => void;
  setPlanTutorialSeen: (seen: boolean) => void;
  setComposerTutorialSeen: (seen: boolean) => void;
  unlockSecretTheme: () => void;
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
      strumSound: 'electric-clean',
      audioQuality: 'studio',
      effects3D: true,
      onboardingCompleted: false,
      tutorialCompleted: false,
      planTutorialSeen: false,
      composerTutorialSeen: false,
      unlockedSecretTheme: false,
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
      setAudioQuality: (audioQuality) => set({ audioQuality }),
      toggleEffects3D: () => set((s) => ({ effects3D: !s.effects3D })),
      setOnboardingCompleted: (onboardingCompleted) => set({ onboardingCompleted }),
      setTutorialCompleted: (tutorialCompleted) => set({ tutorialCompleted }),
      setPlanTutorialSeen: (planTutorialSeen) => set({ planTutorialSeen }),
      setComposerTutorialSeen: (composerTutorialSeen) => set({ composerTutorialSeen }),
      unlockSecretTheme: () => set({ unlockedSecretTheme: true }),
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
      version: 10,
      /**
       * Migration v9 (session 21) : passage à WebAudioFont GM presets — les
       * anciens IDs strum sont mappés via `migrateLegacyStrumId`.
       * Migration v10 (session D) : ajout de `audioQuality` (default 'studio').
       * Les IDs strum restent valides (mêmes 6 presets, moteur Tone.Sampler).
       * Tout autre champ est préservé.
       */
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Partial<PrefsState> & { strumSound?: string };
        const rawStrum = p.strumSound ?? 'electric-clean';
        const strumSound: StrumSoundId =
          version < 9 ? migrateLegacyStrumId(rawStrum) : (rawStrum as StrumSoundId);
        return {
          tuning: p.tuning ?? 'standard',
          capo: p.capo ?? 0,
          audioEnabled: p.audioEnabled ?? true,
          volume: p.volume ?? 0.65,
          showNoteNames: p.showNoteNames ?? true,
          fretboardSkin: p.fretboardSkin ?? 'noir-mat',
          theme: p.theme ?? 'dark-gold',
          strumSound,
          audioQuality: p.audioQuality ?? 'studio',
          effects3D: p.effects3D ?? true,
          onboardingCompleted: p.onboardingCompleted ?? true,
          tutorialCompleted: p.tutorialCompleted ?? true,
          planTutorialSeen: p.planTutorialSeen ?? true, // users existants : skip
          composerTutorialSeen: p.composerTutorialSeen ?? true, // idem
          unlockedSecretTheme: p.unlockedSecretTheme ?? false,
          level: p.level ?? 'beginner',
          practicePlan: p.practicePlan ?? null,
        } as PrefsState;
      },
    }
  )
);
