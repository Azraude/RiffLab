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

// ─── Studio : suggestion lock-progressive ──────────────────────────

export type SuggestionFit = 'natural' | 'colorful' | 'surprising';

export type ChordSuggestion = {
  /** Nom de l'accord candidat (ex: "Cmaj7", "Am") */
  chord: string;
  /** Score brut 0-100 */
  score: number;
  /** Catégorie d'usage */
  fit: SuggestionFit;
  /** Phrase pédagogique courte expliquant le choix */
  reason: string;
  /** Degré roman si applicable (ex: "V", "vi", "bVI") */
  roman?: string;
};

/** Convertit un nom d'accord → degré roman dans le contexte key/mode. */
function chordToRoman(chord: string, key: NoteName, mode: 'major' | 'minor'): string | undefined {
  const parsed = parseChordName(chord);
  if (!parsed) return undefined;
  const keyIdx = NOTE_NAMES.indexOf(key);
  const rootIdx = NOTE_NAMES.indexOf(parsed.root);
  const interval = ((rootIdx - keyIdx) % 12 + 12) % 12;
  const reduced = reduceQuality(parsed.quality);
  const diatonic = mode === 'major' ? DIATONIC_MAJOR : DIATONIC_MINOR;
  for (const [roman, deg] of Object.entries(diatonic)) {
    if (deg.offset === interval && deg.quality === reduced) return roman;
  }
  return undefined;
}

/**
 * Suggère les meilleurs accords pour remplir le prochain slot d'une
 * progression en cours de construction. Approche scoring multi-critères :
 *
 *  1. Diatonic match           (+40) — l'accord est dans la tonalité
 *  2. Cadence harmonique       (+10 à +30) — V→I, IV→V, ii→V, vi→IV, etc.
 *  3. Style match              (+15) — l'accord est typique d'un PROGRESSION_TEMPLATES style
 *  4. Variety bonus            (+10) — pas le même que les 2 précédents
 *  5. Surprise factor          (+5 à +20) — emprunts, dominantes secondaires
 *
 *  Catégorisation `fit` :
 *   - score ≥ 70 : 'natural' (💚)
 *   - score 50-69 : 'colorful' (💛)
 *   - score < 50 : 'surprising' (💜)
 *
 * Retourne le top `count` candidats avec reason pédagogique.
 */
export function suggestNextChord(
  locked: string[],
  key: NoteName,
  mode: 'major' | 'minor',
  styles: string[] = [],
  count: number = 5,
): ChordSuggestion[] {
  const prev = locked[locked.length - 1];
  const prevPrev = locked[locked.length - 2];
  const prevRoman = prev ? chordToRoman(prev, key, mode) : undefined;

  // Candidates : génère via suggestChordCandidates (large set) + scoring custom
  const candidates = suggestChordCandidates(key, mode);

  const stylePool = new Set<string>();
  for (const s of styles) {
    const templates = PROGRESSION_TEMPLATES[s as ProgressionStyle];
    if (!templates) continue;
    for (const romanArr of [...(templates.major ?? []), ...(templates.minor ?? [])]) {
      for (const roman of romanArr) {
        const chord = romanToChord(roman, key, mode);
        stylePool.add(chord);
      }
    }
  }

  const scored: ChordSuggestion[] = candidates.map(({ chord, rating, reason: baseReason }) => {
    let score = 0;
    let reasonParts: string[] = [];

    // 1. Diatonic
    if (rating === 'great') {
      score += 40;
    } else if (rating === 'good') {
      score += 20;
    } else if (rating === 'risky') {
      score += 5;
    }

    // 2. Cadence (need prev roman)
    const candidateRoman = chordToRoman(chord, key, mode);
    if (prevRoman && candidateRoman) {
      const c = cadenceBonus(prevRoman, candidateRoman, mode);
      if (c.score > 0) {
        score += c.score;
        reasonParts.push(c.label);
      }
    }

    // 3. Style match
    if (stylePool.has(chord)) {
      score += 15;
      if (styles.length > 0) reasonParts.push(`typique ${styles[0]}`);
    }

    // 4. Variety (pas répété)
    if (chord === prev || chord === prevPrev) {
      score -= 10;
    } else {
      score += 5;
    }

    // 5. Surprise factor pour rating 'good' (emprunts)
    if (rating === 'good' && !prev) {
      score += 5; // léger boost si début de prog
    } else if (rating === 'good') {
      // baseReason contient déjà "bVI emprunté", "V/V", etc.
      reasonParts.push(baseReason.split('—')[0].trim());
    }

    // Build final reason — prends la 1ère explication forte
    const reason =
      reasonParts.length > 0
        ? reasonParts[0]
        : rating === 'great' && candidateRoman
          ? `Degré ${candidateRoman} naturel`
          : baseReason;

    // Fit categorization
    const fit: SuggestionFit =
      score >= 70 ? 'natural' : score >= 50 ? 'colorful' : 'surprising';

    return {
      chord,
      score: Math.max(0, Math.min(100, score)),
      fit,
      reason,
      roman: candidateRoman,
    };
  });

  // Sort by score desc, take top count
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count);
}

/** Bonus de cadence basé sur la transition prevRoman → nextRoman. */
function cadenceBonus(
  prev: string,
  next: string,
  _mode: 'major' | 'minor',
): { score: number; label: string } {
  // Normalize for matching
  const p = prev.replace('°', '').replace(/[bs]/g, '');
  const n = next.replace('°', '').replace(/[bs]/g, '');
  const key = `${p}→${n}`;

  const CADENCES: Record<string, { score: number; label: string }> = {
    'V→I': { score: 30, label: 'Cadence parfaite (V→I) : résolution puissante' },
    'V→i': { score: 30, label: 'Cadence parfaite mineure (V→i)' },
    'V7→I': { score: 30, label: 'Cadence parfaite dom7→I' },
    'IV→V': { score: 25, label: 'Cadence imparfaite (IV→V), prépare la résolution' },
    'ii→V': { score: 25, label: 'Cadence ii→V (jazz), tension préparée' },
    'vi→IV': { score: 20, label: 'Cadence deceptive (vi→IV)' },
    'IV→I': { score: 18, label: 'Cadence plagale (IV→I), amen' },
    'I→IV': { score: 15, label: 'Sous-dominante (I→IV), ouvre l\'espace' },
    'I→V': { score: 15, label: 'I→V, départ vers la tension' },
    'I→vi': { score: 15, label: 'I→vi, relative mineure' },
    'vi→V': { score: 12, label: 'vi→V, montée chromatique potentielle' },
    'vi→ii': { score: 12, label: 'vi→ii, descente en quintes' },
    'iii→vi': { score: 15, label: 'iii→vi, cycle des quintes' },
    'i→iv': { score: 18, label: 'i→iv, sous-dominante mineure' },
    'i→V': { score: 20, label: 'i→V, dominante harmonique (mode mineur)' },
    'iv→V': { score: 22, label: 'iv→V, montée vers la tension' },
    'iv→i': { score: 18, label: 'iv→i, plagale mineure' },
    'i→VII': { score: 18, label: 'i→bVII, modal mineur (rock)' },
    'i→VI': { score: 15, label: 'i→bVI, emprunt sombre' },
  };

  return CADENCES[key] ?? { score: 0, label: '' };
}

/**
 * Génère une progression complète en remplissant les slots vides.
 * Garde les slots déjà lockés, calcule la meilleure suite via
 * suggestNextChord en cascade.
 */
export function generateFullProgression(
  locked: (string | null)[],
  key: NoteName,
  mode: 'major' | 'minor',
  styles: string[] = [],
): string[] {
  const result: string[] = [];
  for (let i = 0; i < locked.length; i++) {
    const slot = locked[i];
    if (slot) {
      result.push(slot);
    } else {
      const suggestions = suggestNextChord(result, key, mode, styles, 1);
      result.push(suggestions[0]?.chord ?? romanToChord('I', key, mode));
    }
  }
  return result;
}

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
