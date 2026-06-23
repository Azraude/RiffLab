/**
 * Couche "note name" pour le Fretboard Learner audio (sess fretboard-audio).
 *
 * ⚠️ On NE réimplémente PAS le pipeline micro/pitch. RiffLab a déjà un
 * détecteur YIN robuste (`src/lib/pitchDetect.ts`) exposé via le hook
 * `usePitchDetector` (mic → HPF anti-hum 70 Hz → AnalyserNode → YIN →
 * noise-gate → EMA smoothing → MIDI/cents + gestion permissions/cleanup).
 *
 * Le brief proposait d'installer `pitchy` (MPM) et de recréer un
 * GuitarPitchDetector avec son propre AudioContext. Ça aurait été un
 * DOWNGRADE : pitchy n'a ni HPF ni noise-gate, et on aurait dupliqué la
 * gestion micro/permissions déjà testée. Conformément à la Phase 0 du brief
 * ("si tuner existe → réutilise sa pipeline"), on réutilise l'existant et
 * ce module n'ajoute QUE l'extraction du nom de note (pitch class + octave
 * + comparaison) au-dessus du MIDI fourni par le hook.
 */
import { NOTE_NAMES, pitchClass } from '@/lib/theory';
import { freqToMidiAndCents } from '@/lib/pitchDetect';

export interface NoteDetection {
  frequency: number;
  /** Nom de note (pitch class), ex 'A', 'C#'. Cf NOTE_NAMES de theory.ts. */
  noteName: string;
  octave: number;
  midiNumber: number;
  cents: number;
  /** Fiabilité 0-1 (proxy : proximité au centre de la note). */
  clarity: number;
}

/** MIDI entier → { nom de note, octave musical }. */
export function midiToNoteName(midi: number): { noteName: string; octave: number } {
  return {
    noteName: NOTE_NAMES[pitchClass(midi)],
    octave: Math.floor(midi / 12) - 1,
  };
}

/** Nom de note (pitch class) d'une fréquence Hz. */
export function frequencyToNoteName(freq: number): string {
  const { midi } = freqToMidiAndCents(freq);
  return NOTE_NAMES[pitchClass(midi)];
}

/**
 * True si la note jouée (midi détecté) correspond à la note cible, toutes
 * octaves confondues. En mode challenge on demande "6ème corde, La" → on
 * valide n'importe quel La, peu importe l'octave réellement jouée.
 */
export function noteNameMatches(target: string, midi: number): boolean {
  return NOTE_NAMES[pitchClass(midi)] === target;
}

/** Construit une NoteDetection complète depuis une fréquence brute. */
export function detectionFromFrequency(freq: number): NoteDetection {
  const { midi, cents } = freqToMidiAndCents(freq);
  const { noteName, octave } = midiToNoteName(midi);
  const clarity = Math.max(0, 1 - Math.abs(cents) / 50);
  return { frequency: freq, noteName, octave, midiNumber: midi, cents, clarity };
}

export { NOTE_NAMES };
