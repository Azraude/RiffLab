/**
 * Lyrics parser pour le Mode Lecture / teleprompter.
 *
 * Format inspiré Ultimate Guitar :
 *   "[Am]Today is gonna be the [G]day"
 *
 * Sortie : liste de tokens { chord?: string; text: string } qu'on peut
 * rendre avec le chord au-dessus de la syllabe.
 *
 * Si la lyric ne contient pas de chord inline (juste du texte), on
 * retourne un seul token text-only — utile pour les sections instrumentales.
 */

export type LyricToken = {
  /** Si présent, accord à afficher au-dessus du début du `text`. */
  chord?: string;
  text: string;
};

export type LyricLine = LyricToken[];

const CHORD_RE = /\[([^\]]+)\]/g;

/**
 * Parse une string multiligne en lignes de tokens.
 * Préserve les retours à la ligne (chaque ligne = un LyricLine).
 */
export function parseLyrics(raw: string | undefined): LyricLine[] {
  if (!raw) return [];
  return raw.split('\n').map(parseLine);
}

function parseLine(line: string): LyricLine {
  if (!line.includes('[')) {
    return line ? [{ text: line }] : [];
  }
  const tokens: LyricToken[] = [];
  let lastIdx = 0;
  let pendingChord: string | undefined;
  // Reset regex state — global flags maintain lastIndex
  CHORD_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = CHORD_RE.exec(line)) !== null) {
    const [full, chordName] = match;
    const before = line.slice(lastIdx, match.index);
    if (before.length > 0) {
      tokens.push({ chord: pendingChord, text: before });
      pendingChord = undefined;
    } else if (pendingChord !== undefined) {
      // Deux chords successifs sans texte entre → on push un token vide
      tokens.push({ chord: pendingChord, text: '' });
    }
    pendingChord = chordName;
    lastIdx = match.index + full.length;
  }
  // Tail après le dernier chord
  const tail = line.slice(lastIdx);
  if (tail.length > 0 || pendingChord !== undefined) {
    tokens.push({ chord: pendingChord, text: tail });
  }
  return tokens;
}

/** Extrait juste les chord names présents inline dans toutes les lignes. */
export function extractChordsFromLyrics(raw: string | undefined): string[] {
  if (!raw) return [];
  const set = new Set<string>();
  raw.split('\n').forEach((line) => {
    CHORD_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CHORD_RE.exec(line)) !== null) {
      set.add(m[1]);
    }
  });
  return Array.from(set);
}
