/**
 * Design tokens — single source of truth pour les couleurs / typo.
 * Reflète tailwind.config.ts pour utilisation dans des composants TS
 * (ex: Three.js, SVG dynamiques).
 */
export const colors = {
  bg: '#0a0a0a',
  surface: '#141414',
  surface2: '#1c1c1c',
  border: '#2a2a2a',
  borderGold: 'rgba(212, 183, 106, 0.18)',
  text: '#ffffff',
  textMuted: '#9a9a9a',
  textSoft: '#6a6a6a',
  gold: '#d4b76a',
  goldBright: '#f5d97a',
  goldSoft: '#9a8454',
  goldGlow: 'rgba(245, 217, 122, 0.35)',
  success: '#4caf85',
  danger: '#d4685e',
} as const;

export const fonts = {
  serif: '"Cormorant Garamond", Georgia, serif',
  sans: 'Inter, system-ui, sans-serif',
  mono: '"JetBrains Mono", monospace',
} as const;
