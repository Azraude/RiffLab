/**
 * Tabs database — riffs guitare classiques en notation tablature.
 *
 * Convention de chaîne (suit le brief session 16) :
 *   string 0 = high E (treble, ligne du haut en notation)
 *   string 1 = B
 *   string 2 = G
 *   string 3 = D
 *   string 4 = A
 *   string 5 = low E (bass, ligne du bas en notation)
 *
 * À ne pas confondre avec la convention audio.ts (voice 0 = low E). La
 * conversion se fait dans TabPlayer via `audioVoice = 5 - tab.string`.
 *
 * Durée : 1 = double-croche (16e), 2 = croche (8e), 4 = noire, 8 = blanche.
 * StartBeat : position dans la mesure exprimée en double-croches (0-15
 *  pour une mesure 4/4).
 */

export type TabString = 0 | 1 | 2 | 3 | 4 | 5;

export type TabNote = {
  string: TabString;
  fret: number;
  /** Durée en 16e (1=16e, 2=8e, 4=noire) */
  duration: number;
  /** Position dans la mesure en 16e (0-15) */
  startBeat: number;
};

export type Tab = {
  id: string;
  name: string;
  artist?: string;
  tempo: number;
  key: string;
  /** Chaque mesure = liste de TabNote. Une mesure 4/4 = 16 subdivisions max. */
  measures: TabNote[][];
};

// ─── Tabs précodés ─────────────────────────────────────────────────────

/**
 * Smoke on the Water — Deep Purple. Intro mono-cordée sur la corde D
 * (string=3). Riff iconique 4 mesures.
 *
 * Convention : startBeat en 16e (0, 4, 6, 8, 10, 12, 14)
 */
const smokeOnTheWater: Tab = {
  id: 'smoke-on-the-water',
  name: 'Smoke on the Water',
  artist: 'Deep Purple',
  tempo: 112,
  key: 'G minor',
  measures: [
    [
      { string: 3, fret: 0, duration: 4, startBeat: 0 },
      { string: 3, fret: 3, duration: 4, startBeat: 4 },
      { string: 3, fret: 5, duration: 8, startBeat: 8 },
    ],
    [
      { string: 3, fret: 0, duration: 4, startBeat: 0 },
      { string: 3, fret: 3, duration: 4, startBeat: 4 },
      { string: 3, fret: 6, duration: 2, startBeat: 8 },
      { string: 3, fret: 5, duration: 8, startBeat: 10 },
    ],
    [
      { string: 3, fret: 0, duration: 4, startBeat: 0 },
      { string: 3, fret: 3, duration: 4, startBeat: 4 },
      { string: 3, fret: 5, duration: 8, startBeat: 8 },
    ],
    [
      { string: 3, fret: 3, duration: 4, startBeat: 0 },
      { string: 3, fret: 0, duration: 8, startBeat: 4 },
    ],
  ],
};

/**
 * Iron Man — Black Sabbath. Riff doom-laden sur cordes graves.
 */
const ironMan: Tab = {
  id: 'iron-man',
  name: 'Iron Man',
  artist: 'Black Sabbath',
  tempo: 70,
  key: 'B minor',
  measures: [
    [
      { string: 4, fret: 2, duration: 4, startBeat: 0 },
      { string: 4, fret: 2, duration: 4, startBeat: 4 },
      { string: 4, fret: 5, duration: 2, startBeat: 8 },
      { string: 3, fret: 0, duration: 2, startBeat: 10 },
      { string: 3, fret: 2, duration: 4, startBeat: 12 },
    ],
    [
      { string: 3, fret: 2, duration: 4, startBeat: 0 },
      { string: 3, fret: 5, duration: 4, startBeat: 4 },
      { string: 3, fret: 4, duration: 4, startBeat: 8 },
      { string: 3, fret: 2, duration: 4, startBeat: 12 },
    ],
  ],
};

/**
 * Seven Nation Army — White Stripes. Riff basse iconique, 7 notes.
 */
const sevenNationArmy: Tab = {
  id: 'seven-nation-army',
  name: 'Seven Nation Army',
  artist: 'The White Stripes',
  tempo: 124,
  key: 'E minor',
  measures: [
    [
      { string: 5, fret: 7, duration: 4, startBeat: 0 },
      { string: 5, fret: 7, duration: 2, startBeat: 4 },
      { string: 5, fret: 10, duration: 2, startBeat: 6 },
      { string: 5, fret: 7, duration: 4, startBeat: 8 },
      { string: 5, fret: 5, duration: 2, startBeat: 12 },
      { string: 5, fret: 3, duration: 2, startBeat: 14 },
    ],
    [
      { string: 5, fret: 2, duration: 16, startBeat: 0 },
    ],
  ],
};

/**
 * Sunshine of Your Love — Cream. Riff blues-rock signature.
 */
const sunshineOfYourLove: Tab = {
  id: 'sunshine-of-your-love',
  name: 'Sunshine of Your Love',
  artist: 'Cream',
  tempo: 116,
  key: 'D major',
  measures: [
    [
      { string: 3, fret: 12, duration: 2, startBeat: 0 },
      { string: 3, fret: 10, duration: 2, startBeat: 2 },
      { string: 4, fret: 12, duration: 2, startBeat: 4 },
      { string: 5, fret: 12, duration: 4, startBeat: 6 },
      { string: 4, fret: 14, duration: 2, startBeat: 10 },
      { string: 4, fret: 12, duration: 4, startBeat: 12 },
    ],
  ],
};

/**
 * Stairway to Heaven — Led Zeppelin. Arpège intro classique
 * (Am simplifié + dorien).
 */
const stairwayIntro: Tab = {
  id: 'stairway-intro',
  name: 'Stairway to Heaven (intro)',
  artist: 'Led Zeppelin',
  tempo: 72,
  key: 'A minor',
  measures: [
    [
      { string: 4, fret: 0, duration: 2, startBeat: 0 },
      { string: 3, fret: 2, duration: 2, startBeat: 2 },
      { string: 2, fret: 2, duration: 2, startBeat: 4 },
      { string: 1, fret: 0, duration: 2, startBeat: 6 },
      { string: 0, fret: 1, duration: 2, startBeat: 8 },
      { string: 1, fret: 0, duration: 2, startBeat: 10 },
      { string: 2, fret: 2, duration: 2, startBeat: 12 },
      { string: 3, fret: 2, duration: 2, startBeat: 14 },
    ],
  ],
};

export const TABS: Tab[] = [
  smokeOnTheWater,
  ironMan,
  sevenNationArmy,
  sunshineOfYourLove,
  stairwayIntro,
];

export function getTab(id: string): Tab | undefined {
  return TABS.find((t) => t.id === id);
}

/**
 * Convertit toutes les notes d'une tab en une liste plate ordonnée
 * (par mesure, puis startBeat). Utile pour itération séquentielle dans
 * le player et pour calculer la position absolue d'une note.
 */
export type FlatNote = TabNote & {
  measureIdx: number;
  /** Position absolue en 16e depuis le début */
  absoluteBeat: number;
};

export function flattenTab(tab: Tab): FlatNote[] {
  const out: FlatNote[] = [];
  tab.measures.forEach((measure, measureIdx) => {
    const sorted = [...measure].sort((a, b) => a.startBeat - b.startBeat);
    sorted.forEach((n) => {
      out.push({
        ...n,
        measureIdx,
        absoluteBeat: measureIdx * 16 + n.startBeat,
      });
    });
  });
  return out;
}

// ─── Tuning constants for tab → MIDI conversion ────────────────────────
// Convention TAB (0=high E, 5=low E) → MIDI open notes
// On utilise standard tuning : E2 A2 D3 G3 B3 E4
export const TAB_OPEN_MIDI: Record<TabString, number> = {
  0: 64, // E4 (high)
  1: 59, // B3
  2: 55, // G3
  3: 50, // D3
  4: 45, // A2
  5: 40, // E2 (low / bass)
};

export function tabNoteToMidi(note: TabNote, capo = 0): number {
  return TAB_OPEN_MIDI[note.string] + note.fret + capo;
}
