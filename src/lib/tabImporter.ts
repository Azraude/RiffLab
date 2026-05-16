/**
 * Tab importer — parser texte plain de chord charts style Ultimate Guitar /
 * Songsterr. Détecte automatiquement le titre, l'artiste, les sections
 * (Intro/Verse/Chorus/Bridge/Solo) et les accords.
 *
 * Format reconnu typique :
 *   [Verse 1]
 *   C            G             Am          F
 *   When I find myself in times of trouble
 *   C            G             F
 *   Mother Mary comes to me...
 *
 * Heuristiques :
 *   - Une ligne d'accords = ligne où >50% des "mots" matchent regex chord
 *   - Section header = ligne entre [crochets] ou commençant par "Verse"/
 *     "Chorus"/"Intro"/"Bridge"/"Solo"/"Outro"/"Pre-chorus"
 *   - Titre/Artiste sur les 2-3 premières lignes si pas crochets/accords
 */
import type { Section, ChordRef } from './db';
import { newSectionId } from './db';

/** Regex chord : root (A-G + optional #/b) + suffix optionnel jouable. */
const CHORD_REGEX = /^([A-G][#b]?)(m|maj|min|dim|aug|sus|add)?(\d+)?(\/([A-G][#b]?))?$/;

/** Regex section header : [Verse 1], [Chorus], etc. */
const SECTION_HEADER_REGEX = /^\[([^\]]+)\]\s*$/;

/** Mots-clés section sans crochets (Verse 1, Chorus, etc.) */
const SECTION_KEYWORDS = [
  'intro',
  'verse',
  'pre-chorus',
  'pre chorus',
  'prechorus',
  'chorus',
  'bridge',
  'solo',
  'outro',
  'interlude',
  'coda',
  'breakdown',
  'refrain',
  'couplet',
  'pont',
];

/** Test si un token est un nom d'accord plausible. */
function isChordToken(token: string): boolean {
  if (!token || token.length === 0 || token.length > 8) return false;
  return CHORD_REGEX.test(token);
}

/** Test si une ligne est principalement constituée d'accords (>= 50%). */
function isChordLine(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  const chordCount = tokens.filter(isChordToken).length;
  return chordCount / tokens.length >= 0.5 && chordCount >= 1;
}

/** Détecte si une ligne est un section header. */
function detectSectionHeader(line: string): string | null {
  const bracketMatch = line.match(SECTION_HEADER_REGEX);
  if (bracketMatch) return bracketMatch[1].trim();
  const lower = line.trim().toLowerCase();
  for (const kw of SECTION_KEYWORDS) {
    if (
      lower === kw ||
      lower.startsWith(kw + ' ') ||
      lower.startsWith(kw + ':')
    ) {
      return line.trim().replace(/:$/, '');
    }
  }
  return null;
}

export type TabImportResult = {
  title?: string;
  artist?: string;
  sections: Section[];
  /** Toutes les chord names rencontrées (dédupliquées) */
  allChords: string[];
  /** Lignes ignorées (lyrics, vide, etc.) — pour debug user */
  ignoredLineCount: number;
};

/**
 * Parse un chord chart texte plain. Best-effort, ne plante jamais sur input
 * malformé — retourne au pire un sections vide.
 */
export function parseTabText(raw: string): TabImportResult {
  const lines = raw.split('\n');
  const sections: Section[] = [];
  let currentSectionName = 'Intro';
  let currentChords: ChordRef[] = [];
  let title: string | undefined;
  let artist: string | undefined;
  let titleSearchDone = false;
  let ignoredLineCount = 0;
  const allChordsSet = new Set<string>();

  function flushSection() {
    if (currentChords.length > 0) {
      sections.push({
        id: newSectionId(),
        name: currentSectionName,
        chords: currentChords,
      });
      currentChords = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      ignoredLineCount++;
      continue;
    }

    // Section header ?
    const sectionName = detectSectionHeader(line);
    if (sectionName) {
      flushSection();
      currentSectionName = sectionName;
      continue;
    }

    // Chord line ?
    if (isChordLine(line)) {
      const tokens = line.split(/\s+/).filter(Boolean);
      for (const tok of tokens) {
        if (isChordToken(tok)) {
          // Durée par défaut : 4 temps par accord (1 mesure 4/4)
          currentChords.push({ name: tok, beats: 4 });
          allChordsSet.add(tok);
        }
      }
      continue;
    }

    // Titre/artiste : les premières lignes non-section non-chord qui ne
    // sont pas trop longues (< 80 chars)
    if (!titleSearchDone && line.length < 80 && i < 6) {
      if (!title) {
        title = line;
      } else if (!artist) {
        artist = line;
        titleSearchDone = true;
      }
      continue;
    }

    // Ligne ignorée (lyrics, commentaire, etc.)
    ignoredLineCount++;
  }

  // Flush la dernière section
  flushSection();

  return {
    title,
    artist,
    sections: sections.length > 0
      ? sections
      : [{ id: newSectionId(), name: 'Section 1', chords: [] }],
    allChords: Array.from(allChordsSet),
    ignoredLineCount,
  };
}
