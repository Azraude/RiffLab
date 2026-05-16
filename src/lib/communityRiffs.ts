/**
 * Community riffs — sélection rotative hebdomadaire de riffs partagés
 * par des contributeurs (hardcodé en attendant le backend communautaire
 * Phase 5).
 *
 * Session 17 enrichi : ajout de tags, difficulty 1-5, date d'ajout,
 * rating moyenne baseline (la note du user sera persistée en Dexie
 * riffRatings et combinée à baseRating pour affichage).
 */
import { getTab, type Tab } from './tabsDatabase';

export type RiffDifficulty = 1 | 2 | 3 | 4 | 5;
export type RiffTag = 'rock' | 'blues' | 'metal' | 'pop' | 'folk' | 'classique' | 'arpège' | 'iconique';

export type CommunityRiff = {
  id: string;
  /** ID du tab dans tabsDatabase */
  tabId: string;
  contributor: string; // @pseudo
  difficulty: RiffDifficulty;
  tags: RiffTag[];
  /** Compteur de likes "seed" (avant les likes locaux du user) */
  baseLikes: number;
  /** Note moyenne baseline (avant la note locale du user) — sur 5 */
  baseRating: number;
  /** Date d'ajout YYYY-MM-DD */
  addedAt: string;
};

export const COMMUNITY_RIFFS: CommunityRiff[] = [
  {
    id: 'cr-smoke',
    tabId: 'smoke-on-the-water',
    contributor: '@rifflab',
    difficulty: 1,
    tags: ['rock', 'iconique'],
    baseLikes: 247,
    baseRating: 4.8,
    addedAt: '2026-01-15',
  },
  {
    id: 'cr-iron',
    tabId: 'iron-man',
    contributor: '@sabbath_fan',
    difficulty: 2,
    tags: ['rock', 'metal', 'iconique'],
    baseLikes: 189,
    baseRating: 4.7,
    addedAt: '2026-02-03',
  },
  {
    id: 'cr-sevennation',
    tabId: 'seven-nation-army',
    contributor: '@whiteguy',
    difficulty: 1,
    tags: ['rock', 'iconique'],
    baseLikes: 412,
    baseRating: 4.9,
    addedAt: '2026-01-20',
  },
  {
    id: 'cr-sunshine',
    tabId: 'sunshine-of-your-love',
    contributor: '@cream_dream',
    difficulty: 3,
    tags: ['rock', 'blues', 'iconique'],
    baseLikes: 156,
    baseRating: 4.6,
    addedAt: '2026-02-10',
  },
  {
    id: 'cr-stairway',
    tabId: 'stairway-intro',
    contributor: '@zeppelin_kid',
    difficulty: 3,
    tags: ['rock', 'arpège', 'iconique'],
    baseLikes: 387,
    baseRating: 4.9,
    addedAt: '2026-01-08',
  },
  {
    id: 'cr-sweet-child',
    tabId: 'sweet-child-intro',
    contributor: '@axl_rose',
    difficulty: 4,
    tags: ['rock', 'arpège', 'iconique'],
    baseLikes: 298,
    baseRating: 4.8,
    addedAt: '2026-02-18',
  },
  {
    id: 'cr-back-in-black',
    tabId: 'back-in-black',
    contributor: '@angus_y',
    difficulty: 2,
    tags: ['rock', 'iconique'],
    baseLikes: 234,
    baseRating: 4.7,
    addedAt: '2026-03-01',
  },
  {
    id: 'cr-day-tripper',
    tabId: 'day-tripper',
    contributor: '@beatlemania',
    difficulty: 3,
    tags: ['pop', 'rock', 'iconique'],
    baseLikes: 178,
    baseRating: 4.5,
    addedAt: '2026-03-15',
  },
  {
    id: 'cr-crazy-train',
    tabId: 'crazy-train',
    contributor: '@randy_r',
    difficulty: 4,
    tags: ['rock', 'metal'],
    baseLikes: 201,
    baseRating: 4.6,
    addedAt: '2026-04-02',
  },
  {
    id: 'cr-money-nothing',
    tabId: 'money-for-nothing',
    contributor: '@knopfler',
    difficulty: 3,
    tags: ['rock', 'iconique'],
    baseLikes: 143,
    baseRating: 4.4,
    addedAt: '2026-04-20',
  },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Riff de la semaine courante (rotation auto par numéro de semaine). */
export function getCurrentCommunityRiff(now: Date = new Date()): {
  riff: CommunityRiff;
  tab: Tab;
} | null {
  const weekIdx = Math.floor(now.getTime() / WEEK_MS);
  const riff = COMMUNITY_RIFFS[weekIdx % COMMUNITY_RIFFS.length];
  const tab = getTab(riff.tabId);
  if (!tab) return null;
  return { riff, tab };
}

/** Lookup d'un riff par ID — utilisé par les pages /riffs/:id et le hub. */
export function getCommunityRiff(id: string): { riff: CommunityRiff; tab: Tab } | null {
  const riff = COMMUNITY_RIFFS.find((r) => r.id === id);
  if (!riff) return null;
  const tab = getTab(riff.tabId);
  if (!tab) return null;
  return { riff, tab };
}

export const ALL_RIFF_TAGS: RiffTag[] = [
  'rock',
  'blues',
  'metal',
  'pop',
  'folk',
  'classique',
  'arpège',
  'iconique',
];
