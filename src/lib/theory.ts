/**
 * Théorie musicale : notes, MIDI, intervalles, transposition, accordages.
 * Tout est en MIDI internement (0-127). Octave 4 = octave centrale.
 *  - C4  = 60, A4 = 69 (440Hz)
 *  - Open E (low) = E2 = 40
 *  - Open E (high) = E4 = 64
 */

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
export const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export type NoteName = (typeof NOTE_NAMES)[number];
export type NoteClass = number; // 0-11
export type Midi = number;      // 0-127

export function pitchClass(midi: Midi): NoteClass {
  return ((midi % 12) + 12) % 12;
}

export function noteName(midi: Midi, useFlats = false): NoteName {
  const pc = pitchClass(midi);
  return (useFlats ? NOTE_NAMES_FLAT[pc] : NOTE_NAMES[pc]) as NoteName;
}

export function noteToMidi(name: NoteName, octave = 4): Midi {
  const i = NOTE_NAMES.indexOf(name);
  if (i === -1) throw new Error(`Unknown note: ${name}`);
  return (octave + 1) * 12 + i;
}

export function midiToFreq(midi: Midi): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function transpose(midi: Midi, semitones: number): Midi {
  return midi + semitones;
}

export function midiToNoteWithOctave(midi: Midi): string {
  const octave = Math.floor(midi / 12) - 1;
  return `${noteName(midi)}${octave}`;
}

/**
 * Accordages standards : 6 cordes, du grave (low E) à l'aigu (high E).
 * Chaque valeur est le MIDI de la corde à vide.
 */
export const TUNINGS = {
  standard: [40, 45, 50, 55, 59, 64],          // E2 A2 D3 G3 B3 E4
  dropd:    [38, 45, 50, 55, 59, 64],          // D2 ...
  halfdown: [39, 44, 49, 54, 58, 63],          // Eb tuning
  dadgad:   [38, 45, 50, 55, 57, 62],
  openg:    [38, 43, 50, 55, 59, 62],
  opend:    [38, 45, 50, 54, 57, 62],
} as const;

export type TuningId = keyof typeof TUNINGS;

export const TUNING_LABELS: Record<TuningId, string> = {
  standard: 'Standard (E A D G B E)',
  dropd: 'Drop D (D A D G B E)',
  halfdown: '1/2 ton bas (E♭)',
  dadgad: 'DADGAD',
  openg: 'Open G (D G D G B D)',
  opend: 'Open D (D A D F♯ A D)',
};

/**
 * Convertit une position de frette sur une corde en MIDI.
 *   stringNoteAt(0, 0, 'standard') === 40   // Low E open
 *   stringNoteAt(0, 3, 'standard') === 43   // Low E, fret 3 = G
 */
export function stringNoteAt(stringIdx: number, fret: number, tuning: TuningId = 'standard'): Midi {
  return TUNINGS[tuning][stringIdx] + fret;
}

/**
 * Modèles d'intervalles d'accords (en demi-tons depuis la fondamentale).
 */
export const CHORD_QUALITIES = {
  maj:    [0, 4, 7],
  min:    [0, 3, 7],
  dim:    [0, 3, 6],
  aug:    [0, 4, 8],
  sus2:   [0, 2, 7],
  sus4:   [0, 5, 7],
  '7':    [0, 4, 7, 10],
  maj7:   [0, 4, 7, 11],
  m7:     [0, 3, 7, 10],
  m7b5:   [0, 3, 6, 10],
  dim7:   [0, 3, 6, 9],
  add9:   [0, 4, 7, 14],
  '7sus4':[0, 5, 7, 10],
  '6':    [0, 4, 7, 9],
  m6:     [0, 3, 7, 9],
  '9':    [0, 4, 7, 10, 14],
  maj9:   [0, 4, 7, 11, 14],
  m9:     [0, 3, 7, 10, 14],
} as const;

export type ChordQuality = keyof typeof CHORD_QUALITIES;

/**
 * Modèles d'intervalles de gammes.
 */
export const SCALE_INTERVALS = {
  major:        [0, 2, 4, 5, 7, 9, 11],
  minor:        [0, 2, 3, 5, 7, 8, 10],
  penta_minor:  [0, 3, 5, 7, 10],
  penta_major:  [0, 2, 4, 7, 9],
  blues:        [0, 3, 5, 6, 7, 10],
  dorian:       [0, 2, 3, 5, 7, 9, 10],
  phrygian:     [0, 1, 3, 5, 7, 8, 10],
  lydian:       [0, 2, 4, 6, 7, 9, 11],
  mixolydian:   [0, 2, 4, 5, 7, 9, 10],
  harm_minor:   [0, 2, 3, 5, 7, 8, 11],
  mel_minor:    [0, 2, 3, 5, 7, 9, 11],
} as const;

export type ScaleId = keyof typeof SCALE_INTERVALS;

/**
 * Retourne les pitch classes (0-11) d'une gamme dans une tonalité.
 *   scaleNotes('A', 'penta_minor') === [9, 0, 2, 4, 7]
 */
export function scaleNotes(key: NoteName, scale: ScaleId): NoteClass[] {
  const tonic = NOTE_NAMES.indexOf(key);
  return SCALE_INTERVALS[scale].map((iv) => (tonic + iv) % 12);
}

/**
 * Retourne les pitch classes d'un accord.
 *   chordNotes('C', 'maj') === [0, 4, 7]
 */
export function chordNotes(root: NoteName, quality: ChordQuality): NoteClass[] {
  const r = NOTE_NAMES.indexOf(root);
  return CHORD_QUALITIES[quality].map((iv) => (r + iv) % 12);
}

/**
 * Parse un nom d'accord type 'F#m7' en { root, quality }.
 * Retourne null si non reconnu.
 */
export function parseChordName(name: string): { root: NoteName; quality: ChordQuality } | null {
  const m = name.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return null;
  let root = m[1] as string;
  // normalize flats
  const flatMap: Record<string, NoteName> = {
    Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#',
  };
  if (flatMap[root]) root = flatMap[root];
  const qualityRaw = m[2].trim();

  // Map suffixes to ChordQuality
  const qualityMap: Record<string, ChordQuality> = {
    '': 'maj',
    'm': 'min',
    'min': 'min',
    'dim': 'dim',
    'aug': 'aug',
    'sus2': 'sus2',
    'sus4': 'sus4',
    'sus': 'sus4',
    '7': '7',
    'maj7': 'maj7',
    'M7': 'maj7',
    'm7': 'm7',
    'm7b5': 'm7b5',
    'dim7': 'dim7',
    'add9': 'add9',
    '7sus4': '7sus4',
    '6': '6',
    'm6': 'm6',
    '9': '9',
    'maj9': 'maj9',
    'm9': 'm9',
  };
  const quality = qualityMap[qualityRaw];
  if (!quality) return null;
  return { root: root as NoteName, quality };
}

/**
 * Génère une fréquence MIDI pour le voicing d'un accord (pour audio).
 * On joue les notes dans le registre du milieu.
 */
export function chordVoicing(root: NoteName, quality: ChordQuality, baseOctave = 3): Midi[] {
  const rootMidi = noteToMidi(root, baseOctave);
  return CHORD_QUALITIES[quality].map((iv) => rootMidi + iv);
}

/**
 * Calcule la note enharmonique préférée pour l'affichage selon la tonalité.
 * (simplifié : utilise des dièses pour les tonalités dièse, bémols pour les bémol)
 */
const FLAT_KEYS: NoteName[] = ['F', 'A#', 'D#', 'G#', 'C#']; // technically F, Bb, Eb, Ab, Db
export function displayNote(pc: NoteClass, key?: NoteName): string {
  const useFlats = key ? FLAT_KEYS.includes(key) : false;
  return useFlats ? NOTE_NAMES_FLAT[pc] : NOTE_NAMES[pc];
}
