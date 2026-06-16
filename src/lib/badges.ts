/**
 * Catalogue des badges gamif — étendu sess 29 Phase 5 (18 badges).
 *
 * Les badges sess 27 (locaux Dexie via checkAndUnlockBadges) restent
 * en place. Les nouveaux sess 29 sont unlock côté Supabase via
 * `unlockBadgeServer()` du socialApi quand l'event utile arrive.
 *
 * Slugs stables — utilisés en clé Dexie ET Supabase, ne JAMAIS renommer.
 */

export type BadgeMeta = {
  slug: string;
  emoji: string;
  title: string;
  description: string;
  /** Catégorie pour grouper dans /u/:username tab Badges. */
  category: 'publish' | 'social' | 'mastery' | 'streak' | 'curation';
};

export const BADGE_CATALOG: BadgeMeta[] = [
  // ─── PUBLISH ────────────────────────────────────────────────────
  {
    slug: 'first-riff',
    emoji: '🎸',
    title: 'Premier post',
    description: 'Tu as publié ton premier riff.',
    category: 'publish',
  },
  {
    slug: 'prolific-author',
    emoji: '📚',
    title: 'Auteur prolifique',
    description: '10 riffs publiés.',
    category: 'publish',
  },
  {
    slug: 'librarian',
    emoji: '✍️',
    title: 'Bibliothécaire',
    description: '50 riffs publiés.',
    category: 'publish',
  },

  // ─── SOCIAL (likes reçus) ──────────────────────────────────────
  {
    slug: 'liked-10-recv',
    emoji: '❤️',
    title: 'Aimé',
    description: '10 likes reçus cumulés.',
    category: 'social',
  },
  {
    slug: 'popular',
    emoji: '💖',
    title: 'Populaire',
    description: '100 likes reçus cumulés.',
    category: 'social',
  },
  {
    slug: 'star',
    emoji: '🌟',
    title: 'Star',
    description: '1000 likes reçus cumulés.',
    category: 'social',
  },

  // ─── SOCIAL (follows) ───────────────────────────────────────────
  {
    slug: 'first-follower',
    emoji: '🎤',
    title: 'Premier follower',
    description: 'Quelqu\'un te suit.',
    category: 'social',
  },
  {
    slug: 'influencer',
    emoji: '👥',
    title: 'Influenceur',
    description: '100 followers.',
    category: 'social',
  },
  {
    slug: 'curious',
    emoji: '🤝',
    title: 'Curieux',
    description: 'Tu suis 10 riffeurs.',
    category: 'social',
  },

  // ─── MASTERY (riffs maîtrisés) ─────────────────────────────────
  {
    slug: 'mastered-1',
    emoji: '🎯',
    title: 'Premier riff maîtrisé',
    description: 'Tu as marqué un riff comme maîtrisé.',
    category: 'mastery',
  },
  {
    slug: 'mastered-10',
    emoji: '🏆',
    title: 'Maître du manche',
    description: '10 riffs maîtrisés.',
    category: 'mastery',
  },
  {
    slug: 'mastered-50',
    emoji: '💎',
    title: 'Collectionneur',
    description: '50 riffs maîtrisés.',
    category: 'mastery',
  },
  {
    slug: 'genre-master',
    emoji: '🎼',
    title: 'Genre maître',
    description: '5 riffs maîtrisés dans le même genre.',
    category: 'mastery',
  },
  {
    slug: 'polymorph',
    emoji: '🎵',
    title: 'Polymorphe',
    description: '1 riff maîtrisé dans 5 genres différents.',
    category: 'mastery',
  },

  // ─── STREAK ─────────────────────────────────────────────────────
  {
    slug: 'streak-7',
    emoji: '🔥',
    title: 'Streak 7 jours',
    description: '7 jours d\'affilée actif sur RiffLab.',
    category: 'streak',
  },
  {
    slug: 'streak-30',
    emoji: '⚡',
    title: 'Streak 30 jours',
    description: '30 jours d\'affilée actif sur RiffLab.',
    category: 'streak',
  },

  // ─── CURATION (battles + editor picks) ─────────────────────────
  {
    slug: 'battle-champion',
    emoji: '⚔️',
    title: 'Battle Champion',
    description: 'Un de tes riffs a gagné une battle.',
    category: 'curation',
  },
  {
    slug: 'editor-pick',
    emoji: '🏅',
    title: "Editor's pick",
    description: 'Un de tes riffs a été choisi par Melvin.',
    category: 'curation',
  },

  // ─── LEGACY sess 27 (gardés pour rétrocompat) ──────────────────
  {
    slug: 'liked-5',
    emoji: '❤️',
    title: 'Coup de cœur',
    description: "Tu as aimé 5 riffs — l'algo Pour toi est calibré.",
    category: 'social',
  },
  {
    slug: 'saved-5',
    emoji: '🔖',
    title: 'Collectionneur de favoris',
    description: '5 riffs sauvegardés dans tes favoris.',
    category: 'social',
  },
  {
    slug: 'fretboard-5',
    emoji: '🧠',
    title: 'Fretboard apprenti',
    description: '5 sessions de Fretboard Learner complétées.',
    category: 'mastery',
  },
];

export function getBadgeMeta(slug: string): BadgeMeta | undefined {
  return BADGE_CATALOG.find((b) => b.slug === slug);
}

/** Groupe les badges par catégorie pour affichage UI structurée. */
export function badgesByCategory(): Record<BadgeMeta['category'], BadgeMeta[]> {
  return BADGE_CATALOG.reduce(
    (acc, b) => {
      (acc[b.category] ??= []).push(b);
      return acc;
    },
    {} as Record<BadgeMeta['category'], BadgeMeta[]>
  );
}
