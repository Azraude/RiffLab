/**
 * Catalogue des badges gamif (sess 27 Phase 5).
 *
 * Les badges sont unlock via checkAndUnlockBadges() dans db.ts.
 * Ici on mappe le slug → métadata d'affichage.
 */

export type BadgeMeta = {
  slug: string;
  emoji: string;
  title: string;
  description: string;
};

export const BADGE_CATALOG: BadgeMeta[] = [
  {
    slug: 'first-riff',
    emoji: '🎸',
    title: 'Premier post',
    description: 'Tu as publié ton premier riff perso.',
  },
  {
    slug: 'mastered-1',
    emoji: '🏆',
    title: 'Premier riff maîtrisé',
    description: 'Tu as marqué un riff comme maîtrisé.',
  },
  {
    slug: 'mastered-10',
    emoji: '🎯',
    title: '10 riffs maîtrisés',
    description: '10 riffs marqués comme maîtrisés. Tu es sérieux.',
  },
  {
    slug: 'liked-5',
    emoji: '❤️',
    title: 'Coup de cœur',
    description: "Tu as aimé 5 riffs — l'algo Pour toi est calibré.",
  },
  {
    slug: 'saved-5',
    emoji: '🔖',
    title: 'Collectionneur',
    description: '5 riffs sauvegardés dans tes favoris.',
  },
  {
    slug: 'fretboard-5',
    emoji: '🧠',
    title: 'Fretboard apprenti',
    description: '5 sessions de Fretboard Learner complétées.',
  },
];

export function getBadgeMeta(slug: string): BadgeMeta | undefined {
  return BADGE_CATALOG.find((b) => b.slug === slug);
}
