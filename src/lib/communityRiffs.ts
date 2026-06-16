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

/** Difficulté 1-5 (legacy session 17) → mappée vers les 4 niveaux nommés. */
export type RiffDifficulty = 1 | 2 | 3 | 4 | 5;
export type RiffLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type RiffTag = 'rock' | 'blues' | 'metal' | 'pop' | 'folk' | 'classique' | 'arpège' | 'iconique';
/** Techniques travaillées dans le riff — utilisé par les filtres. */
export type RiffTechnique =
  | 'bend'
  | 'slide'
  | 'hammer'
  | 'pull-off'
  | 'palm-mute'
  | 'tapping'
  | 'arpège'
  | 'sweep'
  | 'vibrato';

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
  /** Caption courte façon post Instagram (session 21 social feed) */
  caption?: string;
  /** Compteur de commentaires seed (stub — pas de système de commentaires
   *  encore, juste affichage du compteur sur les cards) */
  commentsCount?: number;
  /** Techniques travaillées dans ce riff (filtre cible) — optionnel,
   *  fallback : array vide si pas renseigné. */
  techniques?: RiffTechnique[];
  /**
   * Voie B (session D) : URL d'un VRAI enregistrement audio du riff (MP3 /
   * Opus, bucket Supabase `riff-audio`). Optionnel et additif — si présent,
   * `playRiff()` (lib/audio.ts) joue le fichier réel au lieu de la synthèse
   * note-à-note. Aucun riff n'en a encore : mécanisme préparé pour les
   * uploads futurs (Melvin / contributeurs). Voir la migration SQL
   * docs/SUPABASE-MIGRATIONS-SESSION-D.sql. */
  audio_url?: string | null;
};

/** Mapping difficulty 1-5 → level nommé. Utilisé par les filtres + UI. */
export function difficultyToLevel(d: RiffDifficulty): RiffLevel {
  if (d <= 1) return 'beginner';
  if (d <= 2) return 'intermediate';
  if (d <= 4) return 'advanced';
  return 'expert';
}

export const LEVEL_LABELS: Record<RiffLevel, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  expert: 'Expert',
};

export const LEVEL_COLORS: Record<RiffLevel, string> = {
  beginner: 'text-success border-success/40 bg-success/10',
  intermediate: 'text-gold-bright border-gold/40 bg-gold/10',
  advanced: 'text-[#e8a04b] border-[#e8a04b]/40 bg-[#e8a04b]/10',
  expert: 'text-danger border-danger/40 bg-danger/10',
};

export const ALL_RIFF_TECHNIQUES: RiffTechnique[] = [
  'bend',
  'slide',
  'hammer',
  'pull-off',
  'palm-mute',
  'tapping',
  'arpège',
  'sweep',
  'vibrato',
];

export const TECHNIQUE_LABELS: Record<RiffTechnique, string> = {
  bend: 'Bend',
  slide: 'Slide',
  hammer: 'Hammer-on',
  'pull-off': 'Pull-off',
  'palm-mute': 'Palm mute',
  tapping: 'Tapping',
  arpège: 'Arpège',
  sweep: 'Sweep',
  vibrato: 'Vibrato',
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
    caption: "Le riff que TOUT le monde connaît. Si t'es débutant, c'est le premier à savoir par cœur 🤘",
    commentsCount: 28,
    techniques: ['palm-mute'],
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
    caption: "Tony Iommi en mode total — joue palm-muted sur les notes basses pour le vrai grain Sabbath.",
    commentsCount: 14,
    techniques: ['palm-mute', 'hammer'],
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
    caption: "Le riff qui passe dans tous les stades de foot. Joue-le sur la corde de mi grave, simple comme bonjour.",
    commentsCount: 47,
    techniques: [],
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
    caption: "Clapton à son meilleur. Travaille le bend sur la 3e mesure, c'est ce qui fait toute la différence.",
    commentsCount: 19,
    techniques: ['bend', 'vibrato'],
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
    caption: "L'intro qui a marqué une génération. Prends ton temps sur l'arpège, chaque note doit respirer.",
    commentsCount: 53,
    techniques: ['arpège'],
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
    caption: "Slash a dit qu'il l'a écrit en s'échauffant. Décompose mesure par mesure et travaille la précision avant la vitesse.",
    commentsCount: 31,
    techniques: ['arpège', 'hammer', 'pull-off'],
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
    caption: "AC/DC kiff total. Le swing c'est tout — joue laid back, pas droit comme un piquet.",
    commentsCount: 22,
    techniques: ['palm-mute'],
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
    caption: "Beatles 1965 — riff catchy mais propre techniquement. Travaille les hammer-on en alternance.",
    commentsCount: 16,
    techniques: ['hammer', 'pull-off'],
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
    caption: "Randy Rhoads RIP 🤘 Le riff est plus dur qu'il en a l'air, surtout la transition en mesure 4.",
    commentsCount: 38,
    techniques: ['palm-mute', 'slide'],
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
    caption: "Knopfler fingerpicking au pouce. Si tu joues au médiator, faux bons résultats mais c'est moins authentique.",
    commentsCount: 11,
    techniques: ['arpège'],
  },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

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

/** Pitches déterministes pour le "Riff du jour" — texte court qui change
 *  selon le riff (basés sur tags + difficulté). */
function pitchForDailyRiff(riff: CommunityRiff): string {
  if (riff.techniques?.includes('bend')) {
    return "Aujourd'hui : un classique pour bosser ton bend";
  }
  if (riff.techniques?.includes('arpège')) {
    return "Aujourd'hui : un riff d'arpège pour la précision";
  }
  if (riff.tags.includes('iconique') && riff.difficulty <= 2) {
    return "Aujourd'hui : un riff incontournable, facile à attaquer";
  }
  if (riff.tags.includes('blues')) {
    return "Aujourd'hui : un blues pour travailler le feel";
  }
  if (riff.difficulty >= 4) {
    return "Aujourd'hui : un riff costaud — défi du jour";
  }
  return "Aujourd'hui : le riff à découvrir";
}

/** Riff du jour — rotation déterministe sur la date (même jour = même
 *  riff pour tous). Utilisé dans le hero de /riffs (sess 27 Phase 3). */
export function getDailyRiff(now: Date = new Date()): {
  riff: CommunityRiff;
  tab: Tab;
  pitch: string;
} | null {
  const dayIdx = Math.floor(now.getTime() / DAY_MS);
  const riff = COMMUNITY_RIFFS[dayIdx % COMMUNITY_RIFFS.length];
  const tab = getTab(riff.tabId);
  if (!tab) return null;
  return { riff, tab, pitch: pitchForDailyRiff(riff) };
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

/**
 * Format relatif "il y a X" pour les timestamps des posts dans le feed.
 * "2h" "hier" "il y a 3 jours" "il y a 2 sem." "il y a 3 mois".
 */
export function formatRelativeDate(isoDate: string, now: Date = new Date()): string {
  const then = new Date(isoDate);
  const diffMs = now.getTime() - then.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `${minutes} min`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return 'hier';
  if (days < 7) return `il y a ${days} jours`;
  if (weeks < 4) return `il y a ${weeks} sem.`;
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(days / 365);
  return `il y a ${years} an${years > 1 ? 's' : ''}`;
}

export type FeedSort = 'for-you' | 'trending' | 'recent';

/**
 * Contexte enrichi pour le tri "For You" (sess 27 Phase 5).
 *  - likedIds : riffs likés par l'user (tag overlap +20)
 *  - masteredIds : riffs déjà maîtrisés (-10 pour pas répéter)
 *  - userLevel : niveau actuel du Practice Plan user pour matcher
 *    la difficulté (+30 si match)
 *  - exploreWeight : 0-100, ajuste l'aléatoire (0 = confort zone,
 *    100 = explorer)
 */
export interface ForYouContext {
  likedIds?: string[];
  masteredIds?: string[];
  userLevel?: RiffLevel;
  exploreWeight?: number;
}

/**
 * Trie les riffs selon le mode du feed :
 * - 'for-you' : algo pondéré (likes / level / mastered penalty / random
 *   explore). Si pas de signal user → fallback trending.
 * - 'trending' : par baseLikes desc
 * - 'recent' : par addedAt desc
 */
export function sortFeedRiffs(
  riffs: CommunityRiff[],
  mode: FeedSort,
  likedIds: string[] = [],
  context: ForYouContext = {}
): CommunityRiff[] {
  const arr = [...riffs];
  if (mode === 'recent') {
    return arr.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  }
  if (mode === 'trending') {
    return arr.sort((a, b) => b.baseLikes - a.baseLikes);
  }

  // 'for-you' : algo pondéré sess 27 Phase 5
  const masteredIds = context.masteredIds ?? [];
  const userLevel = context.userLevel;
  const explore = Math.max(0, Math.min(100, context.exploreWeight ?? 25));

  // Si zéro signal user, fallback trending
  if (likedIds.length === 0 && masteredIds.length === 0 && !userLevel) {
    return arr.sort((a, b) => b.baseLikes - a.baseLikes);
  }

  // Tag score depuis les likes
  const tagScore = new Map<RiffTag, number>();
  const likedArtists = new Set<string>();
  for (const id of [...likedIds, ...masteredIds]) {
    const r = arr.find((x) => x.id === id);
    if (!r) continue;
    for (const t of r.tags) {
      tagScore.set(t, (tagScore.get(t) ?? 0) + 1);
    }
    likedArtists.add(r.contributor);
  }

  return arr
    .map((r) => {
      let score = 0;
      // +20 si tag overlap avec likes
      score += r.tags.reduce((s, t) => s + (tagScore.get(t) ?? 0) * 20, 0);
      // +30 si difficulté matche le niveau de l'user
      if (userLevel && difficultyToLevel(r.difficulty) === userLevel) score += 30;
      // +15 si même artiste qu'un mastered ou liked
      if (likedArtists.has(r.contributor)) score += 15;
      // -10 si déjà mastered (pour pas répéter)
      if (masteredIds.includes(r.id)) score -= 10;
      // +random (0 → explore/10) — plus exploreWeight haut, plus de
      // diversité dans le ranking
      score += Math.random() * (explore / 10);
      // Baseline likes pour départager
      score += r.baseLikes / 100;
      return { r, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ r }) => r);
}
