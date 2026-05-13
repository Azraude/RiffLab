/**
 * Base de données de gammes avec metadata pour l'UI.
 * Les intervalles sont définis dans theory.ts (SCALE_INTERVALS).
 */
import type { ScaleId } from './theory';

export type ScaleInfo = {
  id: ScaleId;
  name: string;
  shortName: string;
  intervals: string;        // "1 2 ♭3 4 5 ♭6 ♭7"
  category: 'diatonic' | 'pentatonic' | 'modal' | 'altered';
  mood: string;             // courte description vibe
  example: string;          // morceau ou contexte
};

export const SCALES: ScaleInfo[] = [
  {
    id: 'major',
    name: 'Majeure',
    shortName: 'maj',
    intervals: '1 2 3 4 5 6 7',
    category: 'diatonic',
    mood: 'Joyeuse, lumineuse, résolue',
    example: 'Pop, folk, classique — Twinkle Twinkle Little Star',
  },
  {
    id: 'minor',
    name: 'Mineure naturelle',
    shortName: 'min',
    intervals: '1 2 ♭3 4 5 ♭6 ♭7',
    category: 'diatonic',
    mood: 'Mélancolique, profonde, naturelle',
    example: 'Rock, ballade — Stairway to Heaven (intro)',
  },
  {
    id: 'penta_minor',
    name: 'Pentatonique mineure',
    shortName: 'penta min',
    intervals: '1 ♭3 4 5 ♭7',
    category: 'pentatonic',
    mood: 'Bluesy, expressive, indispensable',
    example: 'Blues, rock — solos sur 90% des morceaux rock',
  },
  {
    id: 'penta_major',
    name: 'Pentatonique majeure',
    shortName: 'penta maj',
    intervals: '1 2 3 5 6',
    category: 'pentatonic',
    mood: 'Country, brillante, simple',
    example: 'Country, folk — My Girl (The Temptations)',
  },
  {
    id: 'blues',
    name: 'Blues',
    shortName: 'blues',
    intervals: '1 ♭3 4 ♭5 5 ♭7',
    category: 'pentatonic',
    mood: 'Sale, sentie, la couleur du blues',
    example: 'Blues, blues-rock — toute la discographie de B.B. King',
  },
  {
    id: 'dorian',
    name: 'Dorien',
    shortName: 'dorian',
    intervals: '1 2 ♭3 4 5 6 ♭7',
    category: 'modal',
    mood: 'Mineur jazzy, sophistiqué',
    example: 'Jazz, funk — So What (Miles Davis)',
  },
  {
    id: 'phrygian',
    name: 'Phrygien',
    shortName: 'phrygian',
    intervals: '1 ♭2 ♭3 4 5 ♭6 ♭7',
    category: 'modal',
    mood: 'Espagnol, sombre, oriental',
    example: 'Flamenco, metal — Wherever I May Roam (Metallica)',
  },
  {
    id: 'lydian',
    name: 'Lydien',
    shortName: 'lydian',
    intervals: '1 2 3 ♯4 5 6 7',
    category: 'modal',
    mood: 'Rêveur, flottant, cinématique',
    example: 'Soundtracks — Yoda Theme (Star Wars)',
  },
  {
    id: 'mixolydian',
    name: 'Mixolydien',
    shortName: 'mixo',
    intervals: '1 2 3 4 5 6 ♭7',
    category: 'modal',
    mood: 'Rock, irlandais, ouvert',
    example: 'Rock, folk celte — Sweet Child o\' Mine (verse)',
  },
  {
    id: 'harm_minor',
    name: 'Mineure harmonique',
    shortName: 'harm min',
    intervals: '1 2 ♭3 4 5 ♭6 7',
    category: 'altered',
    mood: 'Dramatique, néoclassique, métal',
    example: 'Métal néoclassique — Yngwie Malmsteen, Rising Force',
  },
  {
    id: 'mel_minor',
    name: 'Mineure mélodique',
    shortName: 'mel min',
    intervals: '1 2 ♭3 4 5 6 7',
    category: 'altered',
    mood: 'Jazzy, fluide, montante',
    example: 'Jazz fusion — Bill Evans, Pat Metheny',
  },
];

export function getScale(id: ScaleId): ScaleInfo | undefined {
  return SCALES.find((s) => s.id === id);
}
