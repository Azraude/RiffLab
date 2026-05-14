import type { Config } from 'tailwindcss';

/**
 * Couleurs basées sur des variables CSS (RGB triplet) définies dans
 * `src/styles/globals.css`. Permet le theming via `data-theme="..."`
 * sur `<html>` sans toucher au CSS bundle.
 *
 * Syntaxe `rgb(var(--xxx) / <alpha-value>)` → conserve les utilitaires
 * Tailwind comme `bg-gold/10`, `text-text/50`, etc.
 */
const themeColor = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: themeColor('bg'),
        surface: themeColor('surface'),
        'surface-2': themeColor('surface-2'),
        border: themeColor('border'),
        // border-gold = gold à 0.18 d'opacité, fixe (pas de <alpha-value>
        // car personne n'utilise border-border-gold/N — c'est toujours le
        // halo doré subtil sur les CTAs et cartes hover).
        'border-gold': 'rgb(var(--gold) / 0.18)',
        text: themeColor('text'),
        'text-muted': themeColor('text-muted'),
        'text-soft': themeColor('text-soft'),
        gold: {
          DEFAULT: themeColor('gold'),
          bright: themeColor('gold-bright'),
          soft: themeColor('gold-soft'),
          glow: themeColor('gold-glow'),
        },
        success: themeColor('success'),
        danger: themeColor('danger'),
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        // Display sizes mapped to serif font
        'display-xl': ['64px', { lineHeight: '1.05', letterSpacing: '0.3px' }],
        'display-lg': ['48px', { lineHeight: '1.1', letterSpacing: '0.3px' }],
        'display-md': ['38px', { lineHeight: '1.15', letterSpacing: '0.3px' }],
        'display-sm': ['28px', { lineHeight: '1.2', letterSpacing: '0.2px' }],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        gold: '0 0 24px rgb(var(--gold-glow) / 0.18)',
        'gold-strong': '0 0 32px rgb(var(--gold-glow) / 0.32)',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
