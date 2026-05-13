/**
 * Capo intelligent — propose la position de capo qui maximise le nombre
 * d'accords joués en open shape (au lieu de barrés).
 *
 * Convention RiffLab : le nom d'accord stocké dans un Song est ce que
 * le joueur joue (after capo). Donc :
 *   sounding_pitch = played_shape + currentCapo (en demi-tons)
 *
 * Pour suggérer un nouveau capo, on :
 *  1. Calcule le sounding pitch de chaque accord (played + currentCapo)
 *  2. Pour chaque capo candidat (0-7), calcule le played shape = sounding − capo
 *  3. Compte combien de ces played shapes sont dans la whitelist d'open chords
 *  4. Retourne le capo qui maximise ce score (ties = capo le plus bas)
 */
import { NOTE_NAMES, type NoteName } from './theory';

/**
 * Whitelist des accords ouverts canoniques sur guitare standard.
 * Source : doigtés CAGED + variantes 7e / sus / add9 jouables sans barré.
 * Pas de F (barré ou partial), Bm (barré), F#m (barré), etc.
 */
export const OPEN_CHORD_SHAPES = new Set<string>([
  // Open majors (CAGED)
  'C', 'A', 'G', 'E', 'D',
  // Open minors
  'Am', 'Em', 'Dm',
  // Dominant 7
  'A7', 'B7', 'C7', 'D7', 'E7', 'G7',
  // Major 7 (jouables ouverts)
  'Cmaj7', 'Amaj7', 'Dmaj7',
  // Minor 7
  'Am7', 'Dm7', 'Em7',
  // Sus
  'Asus2', 'Asus4', 'Dsus2', 'Dsus4', 'Esus4',
  // Add9
  'Cadd9', 'Dadd9', 'Eadd9',
  // 7sus4 / m7b5 communs en open
  'A7sus4', 'D7sus4', 'E7sus4',
]);

const FLAT_TO_SHARP: Record<string, NoteName> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
};

/**
 * Sépare un nom d'accord en root + suffixe (préserve la casse du suffixe
 * tel que tapé par l'utilisateur, ex : "F#m7" → root "F#", suffix "m7").
 */
function splitChordName(name: string): { root: NoteName; suffix: string } | null {
  const m = name.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return null;
  let root = m[1];
  if (FLAT_TO_SHARP[root]) root = FLAT_TO_SHARP[root];
  if (!NOTE_NAMES.includes(root as NoteName)) return null;
  return { root: root as NoteName, suffix: m[2] };
}

/**
 * Transpose un nom d'accord de N demi-tons (positif = monter, négatif = descendre).
 * Préserve le suffixe ("Em7" reste "Xm7", "F#" reste "X#" si applicable).
 * Retourne null si le nom n'est pas parsable.
 */
export function transposeChord(name: string, semitones: number): string | null {
  const split = splitChordName(name);
  if (!split) return null;
  const idx = NOTE_NAMES.indexOf(split.root);
  const newIdx = ((idx + semitones) % 12 + 12) % 12;
  return NOTE_NAMES[newIdx] + split.suffix;
}

export type CapoSuggestion = {
  currentCapo: number;
  currentOpenCount: number;
  bestCapo: number;
  bestOpenCount: number;
  totalChords: number;
  /** played name → new played name (à appliquer dans les sections du song) */
  mapping: Record<string, string>;
  /** true si le meilleur capo est strictement meilleur que l'actuel */
  improvable: boolean;
};

/**
 * Cherche le meilleur capo (0-7) pour un morceau donné.
 *
 * @param playedChords - les noms d'accords tels qu'écrits dans le song (= played shapes)
 * @param currentCapo - la position de capo actuelle du song
 */
export function suggestCapo(
  playedChords: string[],
  currentCapo: number
): CapoSuggestion {
  const unique = Array.from(new Set(playedChords.filter((c) => c && c.trim())));
  const total = unique.length;

  // Sounding pitch pour chaque accord joué actuellement
  const soundingByPlayed: Record<string, string | null> = {};
  for (const p of unique) {
    soundingByPlayed[p] = transposeChord(p, currentCapo);
  }

  function playedAtCapo(capo: number): Record<string, string | null> {
    const result: Record<string, string | null> = {};
    for (const p of unique) {
      const s = soundingByPlayed[p];
      result[p] = s === null ? null : transposeChord(s, -capo);
    }
    return result;
  }

  function scoreCapo(capo: number): number {
    const map = playedAtCapo(capo);
    let count = 0;
    for (const p of unique) {
      const np = map[p];
      if (np && OPEN_CHORD_SHAPES.has(np)) count++;
    }
    return count;
  }

  let bestCapo = 0;
  let bestOpenCount = -1;
  // Itère 0 → 7 ; sur égalité, garde le capo le plus bas (premier rencontré).
  for (let c = 0; c <= 7; c++) {
    const score = scoreCapo(c);
    if (score > bestOpenCount) {
      bestCapo = c;
      bestOpenCount = score;
    }
  }

  const currentOpenCount = scoreCapo(currentCapo);
  const bestMap = playedAtCapo(bestCapo);
  const mapping: Record<string, string> = {};
  for (const p of unique) {
    const np = bestMap[p];
    if (np) mapping[p] = np;
  }

  return {
    currentCapo,
    currentOpenCount,
    bestCapo,
    bestOpenCount,
    totalChords: total,
    mapping,
    improvable: bestOpenCount > currentOpenCount,
  };
}
