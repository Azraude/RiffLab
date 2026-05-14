/**
 * Catalogue des thèmes UI. Le toggling se fait via l'attribut data-theme
 * sur <html> ; les couleurs effectives vivent dans `src/styles/globals.css`
 * en variables CSS (RGB triplets). Tailwind consomme via
 * `rgb(var(--xxx) / <alpha-value>)`.
 */

export type ThemeId =
  | 'dark-gold'
  | 'sunset'
  | 'studio-blue'
  | 'pure-white'
  | 'neon-synthwave';

export type Theme = {
  id: ThemeId;
  label: string;
  description: string;
  /** Couleurs preview en hex pur (sans alpha) pour les vignettes du sélecteur. */
  preview: {
    bg: string;
    surface: string;
    accent: string;
    accentBright: string;
    text: string;
  };
  /** Marqueur premium (Phase 5 — cosmetics shop). */
  premium?: boolean;
};

export const THEMES: Theme[] = [
  {
    id: 'dark-gold',
    label: 'Dark Gold',
    description: 'Le thème signature — noir profond, or chaud. Vibe studio nocturne.',
    preview: {
      bg: '#0a0a0a',
      surface: '#141414',
      accent: '#d4b76a',
      accentBright: '#f5d97a',
      text: '#ffffff',
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    description: 'Orangé chaud, ambiance fin de session, dernière prise.',
    preview: {
      bg: '#1a0d08',
      surface: '#251510',
      accent: '#ff7a45',
      accentBright: '#ffb285',
      text: '#ffece0',
    },
  },
  {
    id: 'studio-blue',
    label: 'Studio Blue',
    description: 'Bleu lacustre, focus calme — idéal pour les longues sessions.',
    preview: {
      bg: '#0a1018',
      surface: '#141a26',
      accent: '#6ba8d4',
      accentBright: '#9cc5e5',
      text: '#e8eef5',
    },
  },
  {
    id: 'pure-white',
    label: 'Pure White',
    description: 'Mode jour répèt — pleine lumière, contraste max sur le manche.',
    preview: {
      bg: '#fafafa',
      surface: '#ffffff',
      accent: '#b8954a',
      accentBright: '#d4b76a',
      text: '#1a1a1a',
    },
  },
  {
    id: 'neon-synthwave',
    label: 'Néon Synthwave',
    description: 'Magenta + violet, vibe arcade. Pour jammer du Daft Punk.',
    preview: {
      bg: '#0a0518',
      surface: '#1a0e2e',
      accent: '#ff2dd0',
      accentBright: '#ff6be0',
      text: '#fde8ff',
    },
    premium: true,
  },
];

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/** Applique le thème à <html> via data-theme. */
export function applyTheme(id: ThemeId): void {
  const root = document.documentElement;
  root.setAttribute('data-theme', id);
}
