import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#141414',
        'surface-2': '#1c1c1c',
        border: '#2a2a2a',
        'border-gold': 'rgba(212, 183, 106, 0.18)',
        text: '#ffffff',
        'text-muted': '#9a9a9a',
        'text-soft': '#6a6a6a',
        gold: {
          DEFAULT: '#d4b76a',
          bright: '#f5d97a',
          soft: '#9a8454',
          glow: 'rgba(245, 217, 122, 0.35)',
        },
        success: '#4caf85',
        danger: '#d4685e',
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
        gold: '0 0 24px rgba(245, 217, 122, 0.18)',
        'gold-strong': '0 0 32px rgba(245, 217, 122, 0.32)',
      },
      transitionTimingFunction: {
        'out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
