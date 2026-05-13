/**
 * Métronome global — Zustand store.
 *
 * Le `stopFn` retourné par `startMetronome()` est non-serializable
 * (référence à des objets Tone.js). On le garde en module-scope ref pour
 * pouvoir l'invoquer depuis n'importe où sans le mettre dans le state.
 *
 * Le BPM et l'état `running` sont dans Zustand → l'UI rerend, et la
 * persistance pendant la navigation est gratuite (le store survit aux
 * démontages des pages).
 */
import { create } from 'zustand';
import { setMetronomeBpm, startMetronome } from '@/lib/audio';

let stopFn: (() => void) | null = null;

type MetronomeState = {
  bpm: number;
  running: boolean;
  currentBeat: number;       // 0..(beatsPerMeasure-1)
  beatsPerMeasure: number;   // 4 pour l'instant — 3/4 et 6/8 viendront en Phase 3
  vibrateOnDownbeat: boolean;
  setBpm: (bpm: number) => void;
  start: () => Promise<void>;
  stop: () => void;
  toggle: () => Promise<void>;
  toggleVibrate: () => void;
};

export const useMetronome = create<MetronomeState>((set, get) => ({
  bpm: 100,
  running: false,
  currentBeat: 0,
  beatsPerMeasure: 4,
  vibrateOnDownbeat: true,

  setBpm: (bpm) => {
    const clamped = Math.max(40, Math.min(220, Math.round(bpm)));
    set({ bpm: clamped });
    if (get().running) setMetronomeBpm(clamped);
  },

  start: async () => {
    if (get().running) return;
    stopFn = await startMetronome(get().bpm, (beat) => {
      const { beatsPerMeasure, vibrateOnDownbeat } = get();
      const beatInMeasure = beat % beatsPerMeasure;
      set({ currentBeat: beatInMeasure });
      if (
        beatInMeasure === 0 &&
        vibrateOnDownbeat &&
        typeof navigator !== 'undefined' &&
        typeof navigator.vibrate === 'function'
      ) {
        navigator.vibrate(50);
      }
    });
    set({ running: true, currentBeat: 0 });
  },

  stop: () => {
    stopFn?.();
    stopFn = null;
    set({ running: false, currentBeat: 0 });
  },

  toggle: async () => {
    const { running, start, stop } = get();
    if (running) stop();
    else await start();
  },

  toggleVibrate: () => set((s) => ({ vibrateOnDownbeat: !s.vibrateOnDownbeat })),
}));
