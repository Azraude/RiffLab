/**
 * Community riffs — sélection rotative hebdomadaire de riffs partagés
 * par des contributeurs (hardcodé en attendant le backend communautaire
 * Phase 5).
 *
 * Rotation auto : `Math.floor(now / weekMs) % length`.
 *
 * Bouton "Partager mon riff" → modal "Bientôt disponible Phase 5"
 * (placeholder).
 */
import { getTab, type Tab } from './tabsDatabase';

export type CommunityRiff = {
  id: string;
  /** ID du tab dans tabsDatabase */
  tabId: string;
  contributor: string; // @pseudo
  /** Compteur de likes "seed" (avant les likes locaux du user) */
  baseLikes: number;
};

export const COMMUNITY_RIFFS: CommunityRiff[] = [
  {
    id: 'cr-smoke',
    tabId: 'smoke-on-the-water',
    contributor: '@melvin',
    baseLikes: 47,
  },
  {
    id: 'cr-iron',
    tabId: 'iron-man',
    contributor: '@sabbath_fan',
    baseLikes: 31,
  },
  {
    id: 'cr-sevennation',
    tabId: 'seven-nation-army',
    contributor: '@whiteguy',
    baseLikes: 89,
  },
  {
    id: 'cr-sunshine',
    tabId: 'sunshine-of-your-love',
    contributor: '@cream_dream',
    baseLikes: 22,
  },
  {
    id: 'cr-stairway',
    tabId: 'stairway-intro',
    contributor: '@zeppelin_kid',
    baseLikes: 64,
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
