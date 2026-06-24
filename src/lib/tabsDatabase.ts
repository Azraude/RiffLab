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

/** Technique de jeu sur une note — rendue en glyphe doré sur la tab.
 *  h = hammer-on · p = pull-off · s-up/s-down = slide · b = bend · v = vibrato. */
export type Technique = 'h' | 'p' | 's-up' | 's-down' | 'b' | 'v';

export type TabNote = {
  string: TabString;
  fret: number;
  /** Durée en 16e (1=16e, 2=8e, 4=noire) */
  duration: number;
  /** Position dans la mesure en 16e (0-15) */
  startBeat: number;
  /** Technique de jeu optionnelle (affichée en glyphe or sur la tab). */
  technique?: Technique;
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
      { string: 5, fret: 10, duration: 2, startBeat: 6, technique: 's-down' },
      { string: 5, fret: 7, duration: 4, startBeat: 8 },
      { string: 5, fret: 5, duration: 2, startBeat: 12, technique: 'h' },
      { string: 5, fret: 3, duration: 2, startBeat: 14, technique: 'p' },
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

/** Sweet Child O' Mine — intro arpège GnR (simplifié corde par corde). */
const sweetChildIntro: Tab = {
  id: 'sweet-child-intro',
  name: "Sweet Child O' Mine (intro)",
  artist: "Guns N' Roses",
  tempo: 125,
  key: 'D major',
  measures: [
    [
      { string: 3, fret: 12, duration: 2, startBeat: 0 },
      { string: 2, fret: 15, duration: 2, startBeat: 2 },
      { string: 3, fret: 14, duration: 2, startBeat: 4 },
      { string: 2, fret: 14, duration: 2, startBeat: 6 },
      { string: 3, fret: 12, duration: 2, startBeat: 8 },
      { string: 2, fret: 15, duration: 2, startBeat: 10 },
      { string: 3, fret: 14, duration: 2, startBeat: 12 },
      { string: 2, fret: 14, duration: 2, startBeat: 14 },
    ],
  ],
};

/** Back in Black — riff AC/DC ouvert sur E. */
const backInBlack: Tab = {
  id: 'back-in-black',
  name: 'Back in Black',
  artist: 'AC/DC',
  tempo: 96,
  key: 'E major',
  measures: [
    [
      { string: 5, fret: 0, duration: 2, startBeat: 0 },
      { string: 5, fret: 3, duration: 2, startBeat: 2 },
      { string: 5, fret: 0, duration: 4, startBeat: 4 },
      { string: 5, fret: 0, duration: 2, startBeat: 8 },
      { string: 5, fret: 5, duration: 2, startBeat: 10 },
      { string: 5, fret: 3, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Day Tripper — riff Beatles, signature blues/rock pop. */
const dayTripper: Tab = {
  id: 'day-tripper',
  name: 'Day Tripper',
  artist: 'The Beatles',
  tempo: 138,
  key: 'E major',
  measures: [
    [
      { string: 4, fret: 7, duration: 2, startBeat: 0 },
      { string: 4, fret: 9, duration: 2, startBeat: 2 },
      { string: 3, fret: 6, duration: 2, startBeat: 4 },
      { string: 4, fret: 7, duration: 4, startBeat: 6 },
      { string: 5, fret: 0, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Crazy Train — riff Ozzy iconique. */
const crazyTrain: Tab = {
  id: 'crazy-train',
  name: 'Crazy Train',
  artist: 'Ozzy Osbourne',
  tempo: 138,
  key: 'F# minor',
  measures: [
    [
      { string: 4, fret: 4, duration: 2, startBeat: 0 },
      { string: 4, fret: 4, duration: 2, startBeat: 2 },
      { string: 3, fret: 2, duration: 2, startBeat: 4 },
      { string: 3, fret: 4, duration: 2, startBeat: 6 },
      { string: 4, fret: 4, duration: 2, startBeat: 8 },
      { string: 3, fret: 0, duration: 2, startBeat: 10 },
      { string: 4, fret: 4, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Money for Nothing — riff Dire Straits / Mark Knopfler. */
const moneyForNothing: Tab = {
  id: 'money-for-nothing',
  name: 'Money for Nothing',
  artist: 'Dire Straits',
  tempo: 132,
  key: 'G minor',
  measures: [
    [
      { string: 3, fret: 5, duration: 4, startBeat: 0 },
      { string: 3, fret: 5, duration: 2, startBeat: 4 },
      { string: 3, fret: 8, duration: 2, startBeat: 6 },
      { string: 3, fret: 7, duration: 4, startBeat: 8 },
      { string: 3, fret: 5, duration: 4, startBeat: 12 },
    ],
  ],
};

// ─── Session data riffs (2026-06-17) — 22 nouveaux riffs curés ─────────

/** Come As You Are — Nirvana. Riff chorus-laden cordes graves, débutant. */
const comeAsYouAre: Tab = {
  id: 'come-as-you-are',
  name: 'Come As You Are',
  artist: 'Nirvana',
  tempo: 120,
  key: 'E minor',
  measures: [
    [
      { string: 5, fret: 0, duration: 2, startBeat: 0 },
      { string: 5, fret: 0, duration: 2, startBeat: 2 },
      { string: 4, fret: 0, duration: 2, startBeat: 4 },
      { string: 4, fret: 1, duration: 2, startBeat: 6 },
      { string: 4, fret: 2, duration: 2, startBeat: 8 },
      { string: 4, fret: 2, duration: 2, startBeat: 10 },
      { string: 4, fret: 1, duration: 2, startBeat: 12 },
      { string: 4, fret: 0, duration: 2, startBeat: 14 },
    ],
  ],
};

/** Wish You Were Here (intro) — Pink Floyd. Lick Em7/G fingerpické. */
const wishYouWereHere: Tab = {
  id: 'wish-you-were-here',
  name: 'Wish You Were Here (intro)',
  artist: 'Pink Floyd',
  tempo: 60,
  key: 'G major',
  measures: [
    [
      { string: 4, fret: 3, duration: 2, startBeat: 0 },
      { string: 3, fret: 0, duration: 2, startBeat: 2 },
      { string: 3, fret: 2, duration: 2, startBeat: 4 },
      { string: 2, fret: 0, duration: 2, startBeat: 6 },
      { string: 2, fret: 0, duration: 2, startBeat: 8 },
      { string: 3, fret: 2, duration: 2, startBeat: 10 },
      { string: 3, fret: 0, duration: 2, startBeat: 12 },
      { string: 4, fret: 3, duration: 2, startBeat: 14 },
    ],
  ],
};

/** Smells Like Teen Spirit — Nirvana. Roots des power chords F-Bb-Ab-Db. */
const smellsLikeTeenSpirit: Tab = {
  id: 'smells-like-teen-spirit',
  name: 'Smells Like Teen Spirit',
  artist: 'Nirvana',
  tempo: 117,
  key: 'F major',
  measures: [
    [
      { string: 5, fret: 1, duration: 4, startBeat: 0 },
      { string: 4, fret: 1, duration: 4, startBeat: 4 },
      { string: 5, fret: 4, duration: 4, startBeat: 8 },
      { string: 4, fret: 4, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Whole Lotta Love (riff) — Led Zeppelin. Figure E-D iconique de Page. */
const wholeLottaLove: Tab = {
  id: 'whole-lotta-love',
  name: 'Whole Lotta Love',
  artist: 'Led Zeppelin',
  tempo: 90,
  key: 'E major',
  measures: [
    [
      { string: 5, fret: 0, duration: 2, startBeat: 0 },
      { string: 5, fret: 0, duration: 2, startBeat: 2 },
      { string: 4, fret: 2, duration: 2, startBeat: 4 },
      { string: 5, fret: 3, duration: 2, startBeat: 6 },
      { string: 5, fret: 0, duration: 2, startBeat: 8 },
      { string: 4, fret: 2, duration: 2, startBeat: 10 },
      { string: 4, fret: 0, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Pumped Up Kicks — Foster the People. Bassline pop iconique. */
const pumpedUpKicks: Tab = {
  id: 'pumped-up-kicks',
  name: 'Pumped Up Kicks',
  artist: 'Foster the People',
  tempo: 128,
  key: 'F minor',
  measures: [
    [
      { string: 5, fret: 1, duration: 4, startBeat: 0 },
      { string: 5, fret: 1, duration: 2, startBeat: 4 },
      { string: 5, fret: 4, duration: 2, startBeat: 6 },
      { string: 4, fret: 1, duration: 4, startBeat: 8 },
      { string: 4, fret: 3, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Wonderwall — Oasis. Arpège Em7 (capo 2). */
const wonderwall: Tab = {
  id: 'wonderwall',
  name: 'Wonderwall',
  artist: 'Oasis',
  tempo: 87,
  key: 'E minor',
  measures: [
    [
      { string: 4, fret: 2, duration: 2, startBeat: 0 },
      { string: 3, fret: 2, duration: 2, startBeat: 2 },
      { string: 2, fret: 0, duration: 2, startBeat: 4 },
      { string: 1, fret: 3, duration: 2, startBeat: 6 },
      { string: 0, fret: 3, duration: 2, startBeat: 8 },
      { string: 1, fret: 3, duration: 2, startBeat: 10 },
      { string: 2, fret: 0, duration: 2, startBeat: 12 },
      { string: 3, fret: 2, duration: 2, startBeat: 14 },
    ],
  ],
};

/** Hotel California (arp) — Eagles. Arpège Bm de l'intro. */
const hotelCalifornia: Tab = {
  id: 'hotel-california',
  name: 'Hotel California (arpège)',
  artist: 'Eagles',
  tempo: 74,
  key: 'B minor',
  measures: [
    [
      { string: 4, fret: 2, duration: 2, startBeat: 0 },
      { string: 3, fret: 4, duration: 2, startBeat: 2 },
      { string: 2, fret: 4, duration: 2, startBeat: 4 },
      { string: 1, fret: 3, duration: 2, startBeat: 6 },
      { string: 2, fret: 4, duration: 2, startBeat: 8 },
      { string: 3, fret: 4, duration: 2, startBeat: 10 },
      { string: 4, fret: 2, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Sweet Caroline — Neil Diamond. Montée signature "bah bah bah". */
const sweetCaroline: Tab = {
  id: 'sweet-caroline',
  name: 'Sweet Caroline',
  artist: 'Neil Diamond',
  tempo: 128,
  key: 'A major',
  measures: [
    [
      { string: 4, fret: 0, duration: 4, startBeat: 0 },
      { string: 3, fret: 2, duration: 4, startBeat: 4 },
      { string: 2, fret: 2, duration: 4, startBeat: 8 },
      { string: 1, fret: 2, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Black Magic Woman — Santana. Lick latin-blues avec bends. */
const blackMagicWoman: Tab = {
  id: 'black-magic-woman',
  name: 'Black Magic Woman',
  artist: 'Santana',
  tempo: 115,
  key: 'D minor',
  measures: [
    [
      { string: 3, fret: 7, duration: 2, startBeat: 0 },
      { string: 3, fret: 5, duration: 2, startBeat: 2 },
      { string: 2, fret: 7, duration: 2, startBeat: 4 },
      { string: 3, fret: 7, duration: 2, startBeat: 6 },
      { string: 4, fret: 5, duration: 4, startBeat: 8 },
      { string: 3, fret: 7, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Nothing Else Matters — Metallica. Arpège Em main droite. */
const nothingElseMatters: Tab = {
  id: 'nothing-else-matters',
  name: 'Nothing Else Matters',
  artist: 'Metallica',
  tempo: 70,
  key: 'E minor',
  measures: [
    [
      { string: 5, fret: 0, duration: 4, startBeat: 0 },
      { string: 2, fret: 0, duration: 2, startBeat: 4 },
      { string: 1, fret: 0, duration: 2, startBeat: 6 },
      { string: 0, fret: 0, duration: 2, startBeat: 8 },
      { string: 1, fret: 0, duration: 2, startBeat: 10 },
      { string: 2, fret: 0, duration: 2, startBeat: 12 },
      { string: 4, fret: 2, duration: 2, startBeat: 14 },
    ],
  ],
};

/** Hey Joe — Jimi Hendrix. Walk-up C-G-D-A-E de l'intro. */
const heyJoe: Tab = {
  id: 'hey-joe',
  name: 'Hey Joe',
  artist: 'Jimi Hendrix',
  tempo: 80,
  key: 'E major',
  measures: [
    [
      { string: 4, fret: 3, duration: 4, startBeat: 0 },
      { string: 5, fret: 3, duration: 4, startBeat: 4 },
      { string: 4, fret: 5, duration: 4, startBeat: 8 },
      { string: 4, fret: 0, duration: 2, startBeat: 12 },
      { string: 5, fret: 0, duration: 2, startBeat: 14 },
    ],
  ],
};

/** Layla — Derek & the Dominos / Clapton. Riff unisson descendant. */
const layla: Tab = {
  id: 'layla',
  name: 'Layla',
  artist: 'Eric Clapton',
  tempo: 116,
  key: 'D minor',
  measures: [
    [
      { string: 4, fret: 5, duration: 2, startBeat: 0 },
      { string: 4, fret: 8, duration: 2, startBeat: 2 },
      { string: 3, fret: 5, duration: 2, startBeat: 4 },
      { string: 3, fret: 7, duration: 2, startBeat: 6 },
      { string: 3, fret: 5, duration: 2, startBeat: 8 },
      { string: 2, fret: 5, duration: 2, startBeat: 10 },
      { string: 2, fret: 7, duration: 4, startBeat: 12 },
    ],
  ],
};

/** For the Love of God (simplifié) — Steve Vai. Phrase à bends longs. */
const forTheLoveOfGod: Tab = {
  id: 'for-the-love-of-god',
  name: 'For the Love of God (simplifié)',
  artist: 'Steve Vai',
  tempo: 90,
  key: 'E minor',
  measures: [
    [
      { string: 0, fret: 15, duration: 4, startBeat: 0 },
      { string: 0, fret: 17, duration: 2, startBeat: 4 },
      { string: 0, fret: 15, duration: 2, startBeat: 6 },
      { string: 1, fret: 15, duration: 4, startBeat: 8 },
      { string: 0, fret: 12, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Tornado of Souls — Megadeth. Riff thrash palm-muté. */
const tornadoOfSouls: Tab = {
  id: 'tornado-of-souls',
  name: 'Tornado of Souls',
  artist: 'Megadeth',
  tempo: 165,
  key: 'E minor',
  measures: [
    [
      { string: 5, fret: 0, duration: 2, startBeat: 0 },
      { string: 5, fret: 0, duration: 2, startBeat: 2 },
      { string: 5, fret: 3, duration: 2, startBeat: 4 },
      { string: 5, fret: 2, duration: 2, startBeat: 6 },
      { string: 5, fret: 0, duration: 2, startBeat: 8 },
      { string: 5, fret: 5, duration: 2, startBeat: 10 },
      { string: 5, fret: 3, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Cliffs of Dover — Eric Johnson. Lick d'intro legato. */
const cliffsOfDover: Tab = {
  id: 'cliffs-of-dover',
  name: 'Cliffs of Dover',
  artist: 'Eric Johnson',
  tempo: 150,
  key: 'G major',
  measures: [
    [
      { string: 2, fret: 5, duration: 2, startBeat: 0 },
      { string: 1, fret: 5, duration: 2, startBeat: 2 },
      { string: 1, fret: 8, duration: 2, startBeat: 4 },
      { string: 0, fret: 5, duration: 2, startBeat: 6 },
      { string: 0, fret: 8, duration: 2, startBeat: 8 },
      { string: 1, fret: 8, duration: 2, startBeat: 10 },
      { string: 2, fret: 7, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Cassidy — Grateful Dead. Arpège A jam-rock. */
const cassidy: Tab = {
  id: 'cassidy',
  name: 'Cassidy',
  artist: 'Grateful Dead',
  tempo: 120,
  key: 'A major',
  measures: [
    [
      { string: 4, fret: 0, duration: 2, startBeat: 0 },
      { string: 3, fret: 2, duration: 2, startBeat: 2 },
      { string: 2, fret: 2, duration: 2, startBeat: 4 },
      { string: 1, fret: 2, duration: 2, startBeat: 6 },
      { string: 2, fret: 2, duration: 2, startBeat: 8 },
      { string: 3, fret: 2, duration: 2, startBeat: 10 },
      { string: 4, fret: 0, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Master of Puppets (riff) — Metallica. Pédale E down-pickée. */
const masterOfPuppets: Tab = {
  id: 'master-of-puppets',
  name: 'Master of Puppets',
  artist: 'Metallica',
  tempo: 212,
  key: 'E minor',
  measures: [
    [
      { string: 5, fret: 0, duration: 1, startBeat: 0 },
      { string: 5, fret: 0, duration: 1, startBeat: 2 },
      { string: 5, fret: 0, duration: 1, startBeat: 4 },
      { string: 5, fret: 1, duration: 1, startBeat: 6 },
      { string: 5, fret: 0, duration: 1, startBeat: 8 },
      { string: 4, fret: 3, duration: 1, startBeat: 10 },
      { string: 4, fret: 2, duration: 1, startBeat: 12 },
      { string: 4, fret: 1, duration: 1, startBeat: 14 },
    ],
  ],
};

/** Eruption (tap simplifié) — Van Halen. Tapping A minor. */
const eruption: Tab = {
  id: 'eruption',
  name: 'Eruption (tap simplifié)',
  artist: 'Van Halen',
  tempo: 150,
  key: 'A minor',
  measures: [
    [
      { string: 1, fret: 5, duration: 1, startBeat: 0 },
      { string: 1, fret: 8, duration: 1, startBeat: 2 },
      { string: 1, fret: 12, duration: 1, startBeat: 4 },
      { string: 1, fret: 8, duration: 1, startBeat: 6 },
      { string: 1, fret: 5, duration: 1, startBeat: 8 },
      { string: 1, fret: 12, duration: 1, startBeat: 10 },
      { string: 1, fret: 8, duration: 1, startBeat: 12 },
      { string: 1, fret: 5, duration: 1, startBeat: 14 },
    ],
  ],
};

/** Caprice n°24 (adapt.) — Paganini. Thème néoclassique A minor. */
const caprice24: Tab = {
  id: 'caprice-24',
  name: 'Caprice n°24 (adaptation)',
  artist: 'Paganini',
  tempo: 130,
  key: 'A minor',
  measures: [
    [
      { string: 1, fret: 1, duration: 2, startBeat: 0 },
      { string: 1, fret: 0, duration: 2, startBeat: 2 },
      { string: 0, fret: 0, duration: 2, startBeat: 4 },
      { string: 1, fret: 1, duration: 2, startBeat: 6 },
      { string: 1, fret: 3, duration: 2, startBeat: 8 },
      { string: 1, fret: 1, duration: 2, startBeat: 10 },
      { string: 1, fret: 0, duration: 4, startBeat: 12 },
    ],
  ],
};

/** Hammer Smashed Face — Cannibal Corpse. Gallop death metal (drop D). */
const hammerSmashedFace: Tab = {
  id: 'hammer-smashed-face',
  name: 'Hammer Smashed Face',
  artist: 'Cannibal Corpse',
  tempo: 200,
  key: 'D minor',
  measures: [
    [
      { string: 5, fret: 0, duration: 1, startBeat: 0 },
      { string: 5, fret: 0, duration: 1, startBeat: 2 },
      { string: 5, fret: 1, duration: 1, startBeat: 4 },
      { string: 5, fret: 0, duration: 1, startBeat: 6 },
      { string: 5, fret: 3, duration: 1, startBeat: 8 },
      { string: 5, fret: 1, duration: 1, startBeat: 10 },
      { string: 5, fret: 0, duration: 1, startBeat: 12 },
      { string: 5, fret: 5, duration: 1, startBeat: 14 },
    ],
  ],
};

/** Far Beyond the Sun (sweep) — Yngwie Malmsteen. Balayage A minor. */
const farBeyondTheSun: Tab = {
  id: 'far-beyond-the-sun',
  name: 'Far Beyond the Sun (sweep)',
  artist: 'Yngwie Malmsteen',
  tempo: 180,
  key: 'A minor',
  measures: [
    [
      { string: 5, fret: 5, duration: 1, startBeat: 0 },
      { string: 4, fret: 7, duration: 1, startBeat: 2 },
      { string: 3, fret: 7, duration: 1, startBeat: 4 },
      { string: 2, fret: 5, duration: 1, startBeat: 6 },
      { string: 1, fret: 5, duration: 1, startBeat: 8 },
      { string: 0, fret: 8, duration: 1, startBeat: 10 },
      { string: 1, fret: 5, duration: 1, startBeat: 12 },
      { string: 2, fret: 7, duration: 1, startBeat: 14 },
    ],
  ],
};

/** Through the Fire and Flames — DragonForce. Lick power metal ultra-rapide. */
const throughTheFireAndFlames: Tab = {
  id: 'through-the-fire-and-flames',
  name: 'Through the Fire and Flames',
  artist: 'DragonForce',
  tempo: 200,
  key: 'E minor',
  measures: [
    [
      { string: 0, fret: 7, duration: 1, startBeat: 0 },
      { string: 0, fret: 9, duration: 1, startBeat: 2 },
      { string: 0, fret: 10, duration: 1, startBeat: 4 },
      { string: 0, fret: 12, duration: 1, startBeat: 6 },
      { string: 1, fret: 10, duration: 1, startBeat: 8 },
      { string: 1, fret: 12, duration: 1, startBeat: 10 },
      { string: 0, fret: 9, duration: 1, startBeat: 12 },
      { string: 0, fret: 7, duration: 1, startBeat: 14 },
    ],
  ],
};

export const TABS: Tab[] = [
  smokeOnTheWater,
  ironMan,
  sevenNationArmy,
  sunshineOfYourLove,
  stairwayIntro,
  sweetChildIntro,
  backInBlack,
  dayTripper,
  crazyTrain,
  moneyForNothing,
  // Session data 2026-06-17 — 22 nouveaux
  comeAsYouAre,
  wishYouWereHere,
  smellsLikeTeenSpirit,
  wholeLottaLove,
  pumpedUpKicks,
  wonderwall,
  hotelCalifornia,
  sweetCaroline,
  blackMagicWoman,
  nothingElseMatters,
  heyJoe,
  layla,
  forTheLoveOfGod,
  tornadoOfSouls,
  cliffsOfDover,
  cassidy,
  masterOfPuppets,
  eruption,
  caprice24,
  hammerSmashedFace,
  farBeyondTheSun,
  throughTheFireAndFlames,
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
