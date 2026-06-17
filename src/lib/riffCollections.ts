/**
 * Collections de riffs — 5 sélections curées hardcodées (sess 27 Phase 3).
 *
 * Une collection = un sous-ensemble de COMMUNITY_RIFFS via predicate ou
 * liste explicite d'IDs. Permet de présenter le feed par thème dans le
 * carousel /riffs.
 *
 * Future : quand on aura un backend, les collections viendront depuis
 * Supabase + auteurs custom.
 */
import {
  COMMUNITY_RIFFS,
  difficultyToLevel,
  type CommunityRiff,
  type RiffTag,
  type RiffTechnique,
} from './communityRiffs';

export type RiffCollection = {
  /** Slug URL-safe pour /riffs/collections/:slug */
  slug: string;
  /** Titre court affiché sur la card */
  title: string;
  /** Sous-titre / description longue */
  description: string;
  /** Emoji decorative leading (peut être null) */
  emoji: string;
  /** Couleur d'accent pour le gradient de la card carousel */
  accent: 'gold' | 'green' | 'orange' | 'purple' | 'red';
  /** Filtre : prend les riffs qui matchent ce predicate */
  filter: (riff: CommunityRiff) => boolean;
};

export const COLLECTIONS: RiffCollection[] = [
  {
    slug: 'beginners',
    title: '10 riffs pour débuter',
    description:
      "La sélection idéale si tu commences. Tous les riffs ici sont jouables après 2-3 semaines de gratte.",
    emoji: '🎓',
    accent: 'green',
    filter: (r) => difficultyToLevel(r.difficulty) === 'beginner' || r.difficulty <= 2,
  },
  {
    slug: 'iconic-intros',
    title: 'Top intros iconiques',
    description:
      "Les intros qui ont marqué l'histoire du rock. Smoke, Stairway, Sweet Child... le best of à connaître.",
    emoji: '🔥',
    accent: 'gold',
    filter: (r) => r.tags.includes('iconique'),
  },
  {
    slug: 'bend-mastery',
    title: 'Apprendre le bend',
    description:
      "5 riffs où le bend fait toute la différence. Travaille ta technique du blues au rock.",
    emoji: '💪',
    accent: 'orange',
    filter: (r) => (r.techniques ?? []).includes('bend' as RiffTechnique),
  },
  {
    slug: 'rock-70s',
    title: 'Riffs rock 70s',
    description:
      "L'âge d'or du rock : Sabbath, Cream, Zeppelin, Deep Purple. Les fondations du metal et du hard rock.",
    emoji: '🎸',
    accent: 'red',
    filter: (r) =>
      r.tags.includes('rock' as RiffTag) &&
      r.addedAt <= '2026-03-01' &&
      ['cr-iron', 'cr-sunshine', 'cr-stairway', 'cr-smoke', 'cr-whole-lotta-love'].includes(
        r.id
      ),
  },
  {
    slug: 'blues-approach',
    title: 'Approche blues',
    description:
      "Sentir le blues : feel, bend, vibrato. Les riffs pour apprendre à respirer.",
    emoji: '🎷',
    accent: 'purple',
    filter: (r) => r.tags.includes('blues' as RiffTag),
  },
  {
    slug: 'metal',
    title: '🤘 Riffs metal',
    description:
      "Du doom de Sabbath au death de Cannibal Corpse : palm mute, gallops et down-picking. Monte le gain.",
    emoji: '🤘',
    accent: 'red',
    filter: (r) => r.tags.includes('metal' as RiffTag),
  },
  {
    slug: 'classic-blues',
    title: '🎷 Blues classique',
    description:
      "Hey Joe, Layla, Black Magic Woman... le vocabulaire blues-rock à avoir dans les doigts : bend, feel, vibrato.",
    emoji: '🎷',
    accent: 'purple',
    filter: (r) =>
      ['cr-hey-joe', 'cr-layla', 'cr-black-magic-woman', 'cr-sunshine', 'cr-whole-lotta-love'].includes(
        r.id
      ),
  },
];

/** Lookup d'une collection par slug. */
export function getCollection(slug: string): RiffCollection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

/** Riffs filtrés d'une collection. */
export function getCollectionRiffs(slug: string): CommunityRiff[] {
  const c = getCollection(slug);
  if (!c) return [];
  return COMMUNITY_RIFFS.filter(c.filter);
}

/** Classes Tailwind par couleur d'accent (gradients + bordures). */
export const ACCENT_CLASSES: Record<RiffCollection['accent'], string> = {
  gold: 'border-gold/40 from-gold/20 to-gold-soft/5',
  green: 'border-success/40 from-success/20 to-success/5',
  orange: 'border-[#e8a04b]/40 from-[#e8a04b]/20 to-[#e8a04b]/5',
  purple: 'border-[#a07cd4]/40 from-[#a07cd4]/20 to-[#a07cd4]/5',
  red: 'border-danger/40 from-danger/20 to-danger/5',
};
