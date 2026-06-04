/**
 * Progression theory — génération + évaluation de progressions d'accords.
 *
 * Approche :
 * - Templates de progressions par style (pop / rock / jazz / blues / sad / epic)
 *   exprimés en chiffres romains (I, ii, iii, IV, V, vi, vii°...)
 * - `romanToChord(roman, key, mode)` convertit un degré roman en nom d'accord
 *   réel (ex "vi" en La mineur → "F#m")
 * - `evaluateChordFit(chord, key, mode)` classe un accord en 4 niveaux :
 *   `great` (diatonique naturel) / `good` (emprunt courant) /
 *   `risky` (hors-cadre mais possible) / `weird` (parse fail)
 *
 * Utilisé par la page /composer pour générer des progressions cohérentes
 * et valider en live les remplacements d'accords.
 */
import { NOTE_NAMES, parseChordName, type NoteName, type ChordQuality } from './theory';

// ─── Degrés diatoniques ────────────────────────────────────────────

type DegreeQuality = 'maj' | 'min' | 'dim';
type Degree = { quality: DegreeQuality; offset: number };

/** Modes majeur — degrés naturels (I, ii, iii, IV, V, vi, vii°). */
export const DIATONIC_MAJOR: Record<string, Degree> = {
  I: { quality: 'maj', offset: 0 },
  ii: { quality: 'min', offset: 2 },
  iii: { quality: 'min', offset: 4 },
  IV: { quality: 'maj', offset: 5 },
  V: { quality: 'maj', offset: 7 },
  vi: { quality: 'min', offset: 9 },
  'vii°': { quality: 'dim', offset: 11 },
};

/**
 * Mode mineur naturel + dominante harmonique optionnelle (V majeur).
 * Convention : la 5e peut être 'v' (mineur naturel) ou 'V' (harmonique).
 * On retient les deux pour permettre les deux écritures dans les templates.
 */
export const DIATONIC_MINOR: Record<string, Degree> = {
  i: { quality: 'min', offset: 0 },
  'ii°': { quality: 'dim', offset: 2 },
  bIII: { quality: 'maj', offset: 3 },
  iv: { quality: 'min', offset: 5 },
  v: { quality: 'min', offset: 7 },
  V: { quality: 'maj', offset: 7 }, // dominante harmonique
  bVI: { quality: 'maj', offset: 8 },
  bVII: { quality: 'maj', offset: 10 },
};

// ─── Templates par style ──────────────────────────────────────────

export type ProgressionStyle =
  | 'pop'
  | 'rock'
  | 'jazz'
  | 'blues'
  | 'sad'
  | 'epic';

export type StyleMeta = {
  id: ProgressionStyle;
  label: string;
  description: string;
  /** Mode défavorisé — sad et epic préfèrent mineur, le reste tolère les deux */
  preferredMode?: 'major' | 'minor';
};

export const STYLE_META: StyleMeta[] = [
  { id: 'pop', label: 'Pop', description: 'Axe pop universel, 50s, emo' },
  { id: 'rock', label: 'Rock', description: 'Power chords + bVII modal' },
  { id: 'jazz', label: 'Jazz', description: 'ii-V-I et cycles de quintes' },
  { id: 'blues', label: 'Blues', description: '12-bar simplifié, swing' },
  { id: 'sad', label: 'Mélancolique', description: 'Mineur + emprunts bVI bVII', preferredMode: 'minor' },
  { id: 'epic', label: 'Épique', description: 'Mineur cinematic, vi-IV-I-V' },
];

/**
 * Templates de 4 accords par style. Mix de modes — la fonction generate
 * choisit le bon template selon le mode demandé.
 */
export const PROGRESSION_TEMPLATES: Record<
  ProgressionStyle,
  { major?: string[][]; minor?: string[][] }
> = {
  pop: {
    major: [
      ['I', 'V', 'vi', 'IV'], // axe pop universel
      ['vi', 'IV', 'I', 'V'], // emo
      ['I', 'vi', 'IV', 'V'], // 50s doo-wop
      ['IV', 'I', 'V', 'vi'],
    ],
    minor: [
      ['i', 'bVI', 'bIII', 'bVII'],
      ['i', 'V', 'bVI', 'iv'],
    ],
  },
  rock: {
    major: [
      ['I', 'bVII', 'IV', 'I'],
      ['I', 'IV', 'V', 'IV'],
      ['I', 'V', 'IV', 'I'],
    ],
    minor: [
      ['i', 'bVII', 'bVI', 'V'],
      ['i', 'bIII', 'bVII', 'IV'],
    ],
  },
  jazz: {
    major: [
      ['ii', 'V', 'I', 'vi'],
      ['I', 'vi', 'ii', 'V'],
      ['iii', 'vi', 'ii', 'V'],
    ],
    minor: [
      ['ii°', 'V', 'i', 'i'],
      ['i', 'iv', 'V', 'i'],
    ],
  },
  blues: {
    major: [
      ['I', 'IV', 'V', 'I'], // 12-bar simplifié
      ['I', 'IV', 'I', 'V'],
      ['I', 'I', 'IV', 'V'],
    ],
    minor: [
      ['i', 'iv', 'V', 'i'],
      ['i', 'iv', 'i', 'V'],
    ],
  },
  sad: {
    major: [
      ['vi', 'iii', 'IV', 'I'],
      ['IV', 'I', 'vi', 'V'],
    ],
    minor: [
      ['i', 'bVI', 'bIII', 'bVII'],
      ['i', 'iv', 'bVII', 'bIII'],
      ['i', 'V', 'bVI', 'iv'],
    ],
  },
  epic: {
    major: [
      ['vi', 'IV', 'I', 'V'],
      ['I', 'V', 'vi', 'IV'],
    ],
    minor: [
      ['i', 'bVI', 'bIII', 'V'],
      ['i', 'V', 'bVI', 'bIII'],
      ['i', 'bVII', 'bVI', 'V'],
    ],
  },
};

// ─── Generators ───────────────────────────────────────────────────

/**
 * Convert "vi" en La majeur → "F#m", "IV" en Sol → "C", etc.
 * Retourne le tonic + suffixe ('' pour maj, 'm' pour min, 'dim' pour dim).
 */
export function romanToChord(
  roman: string,
  key: NoteName,
  mode: 'major' | 'minor',
): string {
  const table = mode === 'major' ? DIATONIC_MAJOR : DIATONIC_MINOR;
  const deg = table[roman];
  if (!deg) return key + (mode === 'minor' ? 'm' : '');
  const keyIdx = NOTE_NAMES.indexOf(key);
  const rootIdx = (keyIdx + deg.offset) % 12;
  const root = NOTE_NAMES[rootIdx];
  const suffix = deg.quality === 'maj' ? '' : deg.quality === 'min' ? 'm' : 'dim';
  return root + suffix;
}

/**
 * Génère une progression aléatoire de 4 accords selon key/mode/style.
 * Si le style n'a pas de template pour le mode demandé, fallback à l'autre mode.
 */
export function generateProgression(
  key: NoteName,
  mode: 'major' | 'minor',
  style: ProgressionStyle,
): { romans: string[]; chords: string[] } {
  const templatesForMode = PROGRESSION_TEMPLATES[style];
  const pool = templatesForMode[mode] ?? templatesForMode[mode === 'major' ? 'minor' : 'major'] ?? [];
  if (pool.length === 0) {
    // Fallback ultra-safe
    return { romans: ['I', 'IV', 'V', 'I'], chords: [romanToChord('I', key, 'major'), romanToChord('IV', key, 'major'), romanToChord('V', key, 'major'), romanToChord('I', key, 'major')] };
  }
  const romans = pool[Math.floor(Math.random() * pool.length)];
  const chords = romans.map((r) => romanToChord(r, key, mode));
  return { romans, chords };
}

// ─── Évaluation théorique ─────────────────────────────────────────

export type ChordRating = 'great' | 'good' | 'risky' | 'weird';

export type ChordEvaluation = {
  rating: ChordRating;
  /** Phrase courte affichable en badge sous l'accord */
  reason: string;
  /** Si rating !== 'great', suggère le degré roman le plus proche */
  romanHint?: string;
};

/** Conversion ChordQuality → DegreeQuality simplifiée pour le matching diatonique. */
function reduceQuality(q: ChordQuality): DegreeQuality | '7' | 'other' {
  // 7e dominantes sont matchées séparément (secondary dominants)
  if (q === '7') return '7';
  if (q === 'maj' || q === 'maj7' || q === 'maj9' || q === '6' || q === 'add9' || q === 'sus2' || q === 'sus4' || q === 'aug')
    return 'maj';
  if (q === 'min' || q === 'm7' || q === 'm9' || q === 'm6')
    return 'min';
  if (q === 'dim' || q === 'dim7' || q === 'm7b5')
    return 'dim';
  return 'other';
}

/**
 * Évalue si un accord donné "sonne dans la tonalité" key/mode.
 * Renvoie :
 * - `great` : degré diatonique naturel (vi, IV, V, etc.)
 * - `good` : emprunt classique (bVI, bVII en majeur ; V harmonique en mineur ;
 *   secondary dominant V/V = II7 en majeur)
 * - `risky` : hors-cadre, peut surprendre (color tone, modulation potentielle)
 * - `weird` : parse fail
 */
export function evaluateChordFit(
  chord: string,
  key: NoteName,
  mode: 'major' | 'minor',
): ChordEvaluation {
  const parsed = parseChordName(chord);
  if (!parsed) return { rating: 'weird', reason: 'Accord non reconnu' };
  const keyIdx = NOTE_NAMES.indexOf(key);
  const rootIdx = NOTE_NAMES.indexOf(parsed.root);
  const interval = ((rootIdx - keyIdx) % 12 + 12) % 12;
  const reduced = reduceQuality(parsed.quality);

  // 1) Match diatonique naturel
  const diatonic = mode === 'major' ? DIATONIC_MAJOR : DIATONIC_MINOR;
  for (const [roman, deg] of Object.entries(diatonic)) {
    if (deg.offset === interval && deg.quality === reduced) {
      return { rating: 'great', reason: `Degré ${roman} naturel`, romanHint: roman };
    }
  }

  // 2) Emprunts modaux & dominantes secondaires
  type Borrowing = {
    interval: number;
    quality: DegreeQuality | '7';
    mode: 'major' | 'minor';
    label: string;
    roman?: string;
  };
  const borrowings: Borrowing[] = [
    // Modal mixture majeur → emprunts au mineur parallèle
    { interval: 3, quality: 'maj', mode: 'major', label: 'bIII emprunté au mineur', roman: 'bIII' },
    { interval: 8, quality: 'maj', mode: 'major', label: 'bVI emprunté au mineur', roman: 'bVI' },
    { interval: 10, quality: 'maj', mode: 'major', label: 'bVII modal (rock)', roman: 'bVII' },
    { interval: 5, quality: 'min', mode: 'major', label: 'iv emprunté (couleur sad)', roman: 'iv' },
    // Modal mixture mineur → V majeur harmonique déjà dans DIATONIC_MINOR
    { interval: 9, quality: 'maj', mode: 'minor', label: 'VI emprunté au majeur', roman: 'VI' },
    { interval: 2, quality: 'min', mode: 'minor', label: 'ii emprunté (Dorien)', roman: 'ii' },
    // Secondary dominants — un accord 7 sur un degré non-V
    { interval: 2, quality: '7', mode: 'major', label: 'V/V (secondary dom)', roman: 'V/V' },
    { interval: 9, quality: '7', mode: 'major', label: 'V/ii', roman: 'V/ii' },
    { interval: 4, quality: '7', mode: 'major', label: 'V/vi', roman: 'V/vi' },
    { interval: 7, quality: '7', mode: 'major', label: 'V7 dominante', roman: 'V7' },
    { interval: 7, quality: '7', mode: 'minor', label: 'V7 dominante', roman: 'V7' },
  ];
  for (const b of borrowings) {
    if (b.interval === interval && b.quality === reduced && b.mode === mode) {
      return { rating: 'good', reason: b.label, romanHint: b.roman };
    }
  }

  // 3) Sinon, hors-cadre — risqué mais pas interdit
  const intervalName = SEMITONE_LABELS[interval];
  return {
    rating: 'risky',
    reason: `Hors tonalité (${intervalName} ${reduced === 'other' ? parsed.quality : reduced})`,
  };
}

const SEMITONE_LABELS: Record<number, string> = {
  0: 'tonique',
  1: 'b2',
  2: '2',
  3: 'b3',
  4: '3',
  5: '4',
  6: 'tritone',
  7: '5',
  8: 'b6',
  9: '6',
  10: 'b7',
  11: '7',
};

/**
 * Liste des accords candidats pour un ChordPicker, groupés par rating.
 * Pour chaque combinaison root × quality (parmi un set restreint), évalue
 * et trie. Pour limiter le poids, on ne génère que les qualités les plus
 * communes (maj, min, dim, 7, maj7, m7).
 */
export function suggestChordCandidates(
  key: NoteName,
  mode: 'major' | 'minor',
): { rating: ChordRating; chord: string; reason: string }[] {
  const QUALITIES_WITH_SUFFIX: { q: ChordQuality; suffix: string }[] = [
    { q: 'maj', suffix: '' },
    { q: 'min', suffix: 'm' },
    { q: '7', suffix: '7' },
    { q: 'maj7', suffix: 'maj7' },
    { q: 'm7', suffix: 'm7' },
    { q: 'dim', suffix: 'dim' },
  ];
  const out: { rating: ChordRating; chord: string; reason: string }[] = [];
  for (const note of NOTE_NAMES) {
    for (const { suffix } of QUALITIES_WITH_SUFFIX) {
      const chord = note + suffix;
      const evalRes = evaluateChordFit(chord, key, mode);
      if (evalRes.rating === 'weird') continue;
      out.push({ rating: evalRes.rating, chord, reason: evalRes.reason });
    }
  }
  // Trie : great → good → risky, et alphabétique à l'intérieur
  const order: Record<ChordRating, number> = { great: 0, good: 1, risky: 2, weird: 3 };
  out.sort((a, b) => {
    const r = order[a.rating] - order[b.rating];
    return r !== 0 ? r : a.chord.localeCompare(b.chord);
  });
  return out;
}
