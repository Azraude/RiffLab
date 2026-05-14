/**
 * Riff de la semaine — sélection rotative basée sur le numéro ISO de la
 * semaine de l'année (52 cycles/an, on rebound après le dernier).
 *
 * Chaque riff est un mini-pack auto-suffisant : accords, tempo, niveau,
 * genre, description, conseil technique, suggestion de strum pattern.
 *
 * Pas de backend — curation 100 % statique. À enrichir/rouler manuellement
 * en ajoutant des entrées au tableau.
 */
import type { ChordRef } from './db';

export type RiffDifficulty = 1 | 2 | 3 | 4 | 5;

export type WeeklyRiff = {
  id: string;
  title: string;
  /** Nom de l'artiste ou du morceau d'origine (peut être "Riff original RiffLab"). */
  source: string;
  /** Genre / mood. */
  genre: string;
  difficulty: RiffDifficulty;
  /** Description courte motivante. */
  pitch: string;
  /** Conseil technique pour réussir le riff. */
  tip: string;
  /** Accords du riff dans l'ordre (avec durée en temps). */
  chords: ChordRef[];
  /** Tempo conseillé en BPM. */
  bpm: number;
  /** Tonalité / clé. */
  key: string;
  /** ID du strum pattern conseillé (cf. src/lib/strumPatterns.ts). Optionnel. */
  strumPatternId?: string;
};

/**
 * 20 riffs curés — la liste tourne via la semaine ISO de l'année.
 * Mix volontaire de niveaux pour que chaque semaine puisse parler à
 * tout le monde (débutant ↔ avancé).
 */
export const WEEKLY_RIFFS: WeeklyRiff[] = [
  {
    id: 'wonderwall',
    title: 'Wonderwall vibe',
    source: 'inspiré de Oasis',
    genre: 'Brit-pop',
    difficulty: 2,
    pitch: 'Le riff le plus jouable du monde — capo 2, 4 accords, et tu es prêt pour les soirées feu de camp.',
    tip: 'Mets le capo case 2 et garde le petit doigt sur la 3e case de la corde de Si. C\'est la signature.',
    chords: [
      { name: 'Em', beats: 4 },
      { name: 'G', beats: 4 },
      { name: 'D', beats: 4 },
      { name: 'A7', beats: 4 },
    ],
    bpm: 90,
    key: 'F# minor (capo 2 → Em)',
    strumPatternId: 'folk-classique',
  },
  {
    id: 'smoke-on-the-water',
    title: 'Smoke on the Water',
    source: 'Deep Purple',
    genre: 'Rock classique',
    difficulty: 1,
    pitch: 'Le riff zéro-à-héros : 4 power chords, et tu balances le riff que tout le monde reconnaît.',
    tip: 'Joue-le avec un médiator vers le bas, sec et lourd. Ne sustain pas — coupe net entre chaque dyade.',
    chords: [
      { name: 'G5', beats: 2 },
      { name: 'A#5', beats: 2 },
      { name: 'C5', beats: 4 },
    ],
    bpm: 116,
    key: 'G minor',
  },
  {
    id: 'pumped-up-kicks',
    title: 'Pumped Up Kicks',
    source: 'Foster the People',
    genre: 'Indie pop',
    difficulty: 2,
    pitch: 'Quatre accords mélancoliques en boucle infinie. Parfait pour bosser ta voix par-dessus.',
    tip: 'Ralentis le tempo si tu chantes — le morceau original est plus serré qu\'il n\'en a l\'air.',
    chords: [
      { name: 'F', beats: 4 },
      { name: 'Am', beats: 4 },
      { name: 'C', beats: 4 },
      { name: 'G', beats: 4 },
    ],
    bpm: 130,
    key: 'F major',
    strumPatternId: 'pop-modern',
  },
  {
    id: 'iron-man',
    title: 'Iron Man intro',
    source: 'Black Sabbath',
    genre: 'Heavy rock',
    difficulty: 2,
    pitch: 'Le riff doom-laden qui a inventé le métal. Lent, lourd, magistral.',
    tip: 'Palm mute sur les notes basses, laisse vibrer les accords. La sensation de pas pesants vient de là.',
    chords: [
      { name: 'B5', beats: 4 },
      { name: 'D5', beats: 2 },
      { name: 'E5', beats: 2 },
    ],
    bpm: 70,
    key: 'B minor',
  },
  {
    id: 'creep-radiohead',
    title: 'Creep',
    source: 'Radiohead',
    genre: 'Alt-rock',
    difficulty: 2,
    pitch: 'Quatre accords, une montagne d\'émotion. Le secret est dans la dynamique : doux puis explosif.',
    tip: 'Le passage au "Cm" est ce qui fait pleurer le morceau. Ne le rate pas — appuie bien sur les 3 cordes.',
    chords: [
      { name: 'G', beats: 4 },
      { name: 'B', beats: 4 },
      { name: 'C', beats: 4 },
      { name: 'Cm', beats: 4 },
    ],
    bpm: 92,
    key: 'G major',
  },
  {
    id: 'house-rising-sun',
    title: 'House of the Rising Sun',
    source: 'The Animals',
    genre: 'Folk-blues',
    difficulty: 3,
    pitch: 'Arpèges sombres sur 6 accords en triolets de croches. Une école entière de fingerpicking.',
    tip: 'Joue en triolets : doum-da-da, doum-da-da. C\'est la pulsation ternaire qui crée l\'envoûtement.',
    chords: [
      { name: 'Am', beats: 3 },
      { name: 'C', beats: 3 },
      { name: 'D', beats: 3 },
      { name: 'F', beats: 3 },
      { name: 'Am', beats: 3 },
      { name: 'E7', beats: 3 },
    ],
    bpm: 75,
    key: 'A minor',
  },
  {
    id: 'horse-with-no-name',
    title: 'A Horse with No Name',
    source: 'America',
    genre: 'Folk-rock',
    difficulty: 1,
    pitch: 'Deux accords seulement — Em et un D6add9/F#. Le summum du minimalisme efficace.',
    tip: 'Le 2e accord c\'est juste tes doigts qui glissent d\'une case sur les cordes 1, 2, 3. Aucune effort.',
    chords: [
      { name: 'Em', beats: 4 },
      { name: 'D6add9', beats: 4 },
    ],
    bpm: 122,
    key: 'E minor',
    strumPatternId: 'folk-classique',
  },
  {
    id: 'sweet-home-chicago',
    title: 'Sweet Home Chicago',
    source: 'Robert Johnson / The Blues Brothers',
    genre: 'Blues',
    difficulty: 3,
    pitch: 'Le blues 12 mesures en E. La grammaire fondamentale du blues — apprends-la et tu jammeras partout.',
    tip: 'Pratique le shuffle (sensation ternaire) avec un médiator. C\'est ça qui fait que ça sonne blues.',
    chords: [
      { name: 'E7', beats: 16 },
      { name: 'A7', beats: 8 },
      { name: 'E7', beats: 8 },
      { name: 'B7', beats: 4 },
      { name: 'A7', beats: 4 },
      { name: 'E7', beats: 4 },
      { name: 'B7', beats: 4 },
    ],
    bpm: 100,
    key: 'E blues',
    strumPatternId: 'shuffle-blues',
  },
  {
    id: 'autumn-leaves',
    title: 'Autumn Leaves',
    source: 'Standard jazz',
    genre: 'Jazz',
    difficulty: 4,
    pitch: 'Le standard d\'entrée en jazz. Toutes les couleurs harmoniques majeures sont là.',
    tip: 'Joue les accords au pouce, pas au médiator. Et apprends d\'abord la mélodie avant de plaquer.',
    chords: [
      { name: 'Am7', beats: 4 },
      { name: 'D7', beats: 4 },
      { name: 'Gmaj7', beats: 4 },
      { name: 'Cmaj7', beats: 4 },
      { name: 'F#m7b5', beats: 4 },
      { name: 'B7', beats: 4 },
      { name: 'Em', beats: 8 },
    ],
    bpm: 110,
    key: 'E minor / G major',
  },
  {
    id: 'redemption-song',
    title: 'Redemption Song',
    source: 'Bob Marley',
    genre: 'Folk acoustique',
    difficulty: 2,
    pitch: 'Quatre accords ouverts qui racontent une histoire. Le morceau acoustique le plus pur de Marley.',
    tip: 'Laisse respirer chaque accord — pas de strumming énergique, des coups secs et espacés.',
    chords: [
      { name: 'G', beats: 4 },
      { name: 'Em', beats: 4 },
      { name: 'C', beats: 4 },
      { name: 'D', beats: 4 },
    ],
    bpm: 88,
    key: 'G major',
    strumPatternId: 'ballad-slow',
  },
  {
    id: 'tears-in-heaven',
    title: 'Tears in Heaven',
    source: 'Eric Clapton',
    genre: 'Folk-rock',
    difficulty: 3,
    pitch: 'Fingerpicking délicat sur des accords riches. Le maître Clapton à son plus humble.',
    tip: 'Mets ton pouce sur la corde de mi grave, alterné avec index/majeur/annulaire sur les 3 aiguës.',
    chords: [
      { name: 'A', beats: 2 },
      { name: 'E/G#', beats: 2 },
      { name: 'F#m', beats: 2 },
      { name: 'A/E', beats: 2 },
      { name: 'D', beats: 2 },
      { name: 'A/C#', beats: 2 },
      { name: 'Bm7', beats: 2 },
      { name: 'E', beats: 2 },
    ],
    bpm: 80,
    key: 'A major',
  },
  {
    id: 'plush-stp',
    title: 'Plush intro',
    source: 'Stone Temple Pilots',
    genre: 'Grunge',
    difficulty: 3,
    pitch: 'Riff grunge en G — gros sound, ralenti, parfait pour rentrer dans l\'attaque rock.',
    tip: 'Joue tes accords ouverts avec puissance, laisse trainer les notes basses pour le sustain.',
    chords: [
      { name: 'G', beats: 4 },
      { name: 'D', beats: 4 },
      { name: 'C', beats: 4 },
      { name: 'D', beats: 4 },
    ],
    bpm: 70,
    key: 'G major',
    strumPatternId: 'rock-driving',
  },
  {
    id: 'la-bamba',
    title: 'La Bamba',
    source: 'Ritchie Valens',
    genre: 'Latin rock',
    difficulty: 2,
    pitch: 'Trois accords, énergie infinie. Le rock latin qui fait danser tout le monde.',
    tip: 'Strum très rapide en doubles-croches. C\'est l\'endurance du poignet, pas la précision.',
    chords: [
      { name: 'C', beats: 4 },
      { name: 'F', beats: 4 },
      { name: 'G', beats: 4 },
    ],
    bpm: 150,
    key: 'C major',
    strumPatternId: 'down-up-steady',
  },
  {
    id: 'imagine',
    title: 'Imagine',
    source: 'John Lennon',
    genre: 'Pop ballade',
    difficulty: 2,
    pitch: 'L\'hymne pacifiste de Lennon — accords doux qui invitent la voix.',
    tip: 'Le secret c\'est la régularité du tempo, pas la complexité. Reste droit comme un métronome.',
    chords: [
      { name: 'C', beats: 4 },
      { name: 'F', beats: 4 },
      { name: 'C', beats: 4 },
      { name: 'F', beats: 4 },
      { name: 'Am', beats: 2 },
      { name: 'Dm7', beats: 2 },
      { name: 'F', beats: 2 },
      { name: 'G7', beats: 2 },
    ],
    bpm: 75,
    key: 'C major',
    strumPatternId: 'ballad-slow',
  },
  {
    id: 'breezin',
    title: 'Breezin\' bossa',
    source: 'Riff original RiffLab',
    genre: 'Bossa nova',
    difficulty: 3,
    pitch: 'Une mini-progression jazzy en doubles-croches. Pour les couchers de soleil sur ta terrasse.',
    tip: 'Joue avec les doigts (pas médiator). Pouce sur la basse, index/majeur sur les accords aigus.',
    chords: [
      { name: 'Cmaj7', beats: 4 },
      { name: 'Fmaj7', beats: 4 },
      { name: 'Dm7', beats: 4 },
      { name: 'G7', beats: 4 },
    ],
    bpm: 110,
    key: 'C major',
    strumPatternId: 'bossa-nova',
  },
  {
    id: 'enter-sandman',
    title: 'Enter Sandman intro',
    source: 'Metallica',
    genre: 'Métal',
    difficulty: 3,
    pitch: 'Le riff métal qui a converti une génération. Carré, lourd, hypnotique.',
    tip: 'Palm mute serré tout le long, sauf sur les accents — c\'est le contraste qui fait le groove.',
    chords: [
      { name: 'E5', beats: 4 },
      { name: 'F#5', beats: 2 },
      { name: 'G5', beats: 2 },
      { name: 'A5', beats: 4 },
    ],
    bpm: 123,
    key: 'E minor',
  },
  {
    id: 'three-little-birds',
    title: 'Three Little Birds',
    source: 'Bob Marley',
    genre: 'Reggae',
    difficulty: 1,
    pitch: 'Trois accords, soleil garanti. Le riff le plus heureux du monde.',
    tip: 'Joue le skank reggae : upstrokes courts sur les temps 2 et 4. Coupe net après chaque chick.',
    chords: [
      { name: 'A', beats: 4 },
      { name: 'D', beats: 4 },
      { name: 'A', beats: 4 },
      { name: 'E', beats: 4 },
    ],
    bpm: 76,
    key: 'A major',
    strumPatternId: 'reggae-skank',
  },
  {
    id: 'stand-by-me',
    title: 'Stand By Me',
    source: 'Ben E. King',
    genre: 'Soul / Doo-wop',
    difficulty: 2,
    pitch: 'La progression I-vi-IV-V des années 50, dans sa plus belle robe. Intemporel.',
    tip: 'Si tu joues à la basse aussi, marque chaque temps fort. C\'est la basse qui porte ce morceau.',
    chords: [
      { name: 'A', beats: 4 },
      { name: 'F#m', beats: 4 },
      { name: 'D', beats: 2 },
      { name: 'E', beats: 2 },
      { name: 'A', beats: 4 },
    ],
    bpm: 119,
    key: 'A major',
  },
  {
    id: 'spanish-romance',
    title: 'Romance Espagnole',
    source: 'Anonyme classique',
    genre: 'Classique',
    difficulty: 4,
    pitch: 'Le triolet hypnotique en E mineur. Le morceau classique qui ouvre les portes du fingerstyle.',
    tip: 'Triolets parfaits : pouce-index-majeur en boucle. Lent au début, accélère seulement quand tu es propre.',
    chords: [
      { name: 'Em', beats: 6 },
      { name: 'B7', beats: 6 },
      { name: 'Em', beats: 6 },
      { name: 'Am', beats: 6 },
      { name: 'B7', beats: 6 },
      { name: 'Em', beats: 6 },
    ],
    bpm: 90,
    key: 'E minor',
  },
  {
    id: 'sunday-morning',
    title: 'Sunday Morning vibe',
    source: 'Riff original RiffLab',
    genre: 'Indie acoustique',
    difficulty: 2,
    pitch: 'Quatre accords doux pour les dimanches café — F, Am, Dm, G. Plus chill, tu meurs.',
    tip: 'Garde le médiator très léger, laisse vibrer toutes les cordes ouvertes. Pas de mute.',
    chords: [
      { name: 'F', beats: 4 },
      { name: 'Am', beats: 4 },
      { name: 'Dm', beats: 4 },
      { name: 'G', beats: 4 },
    ],
    bpm: 78,
    key: 'F major',
    strumPatternId: 'pop-modern',
  },
];

// ─── Selection ─────────────────────────────────────────────────────────

/**
 * Retourne le numéro de semaine ISO 8601 (1-53) pour une date donnée.
 * Lundi = début de semaine.
 */
function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // dim=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Renvoie le riff de la semaine courante. Index = ISO week % nb_riffs.
 * Stable toute la semaine, change automatiquement lundi 00:00.
 */
export function getRiffOfTheWeek(now: Date = new Date()): WeeklyRiff {
  const week = getISOWeek(now);
  const idx = week % WEEKLY_RIFFS.length;
  return WEEKLY_RIFFS[idx];
}

/** Numéro de semaine ISO actuelle (pour affichage "Semaine 19"). */
export function getCurrentISOWeek(now: Date = new Date()): number {
  return getISOWeek(now);
}

/** Date du prochain lundi 00:00 (UTC local), pour le compte à rebours. */
export function nextMondayMidnight(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=dim, 1=lun, …
  const daysUntilMonday = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + daysUntilMonday);
  return d;
}
