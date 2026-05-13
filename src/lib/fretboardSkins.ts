/**
 * Skins de manche — Phase 2C.
 *
 * Chaque skin fournit les couleurs des gradients SVG consommés par
 * `Fretboard2D`. Le composant garde sa géométrie fixe (viewBox 880×168) ;
 * seules les couleurs changent. Phase 2C.2 ajoutera une headstock épurée
 * optionnelle à gauche du nut.
 *
 * Format des tokens :
 *   - linear gradient à 3 stops (0% / 50% / 100%)  →  `[from, mid, to]`
 *   - radial gradient à 3 stops (0% / 55% / 100%)  →  `[center, mid, edge]`
 *   - "note" (radial 2 stops 0% / 100%)            →  `[center, edge]`
 */

export type FretboardSkinId =
  | 'noir-mat'
  | 'acoustique-rosewood'
  | 'electrique-erable';

export type FretboardSkin = {
  id: FretboardSkinId;
  name: string;
  short: string;
  description: string;
  category: 'minimal' | 'realistic' | 'arty';

  // Color tokens
  board: [string, string, string];
  fret: [string, string, string];
  nut: [string, string, string];
  pearl: [string, string, string];
  bassString: [string, string, string];
  trebleString: [string, string, string];
  note: [string, string];
  tonic: [string, string, string];

  // Misc
  bindingTop: string;
  bindingBottom: string;
  openLabel: string;
  fret12Label: string;
};

export const FRETBOARD_SKINS: Record<FretboardSkinId, FretboardSkin> = {
  'noir-mat': {
    id: 'noir-mat',
    name: 'Noir mat doré',
    short: 'Noir mat',
    description: 'Manche noir mat, frets or brillant, cordes bronze et argent. Le défaut RiffLab.',
    category: 'minimal',
    board: ['#1a1a1c', '#101012', '#0a0a0c'],
    fret: ['#8a7548', '#f5d97a', '#8a7548'],
    nut: ['#c4b596', '#fff5dc', '#9a8966'],
    pearl: ['#ffffff', '#dee0eb', '#7a7a85'],
    bassString: ['#5a4828', '#d4b76a', '#3a2c18'],
    trebleString: ['#7a7a82', '#f0f0f4', '#5a5a62'],
    note: ['#ffffff', '#c8c8d0'],
    tonic: ['#fbe89a', '#d4b76a', '#7a623c'],
    bindingTop: 'rgba(212, 183, 106, 0.32)',
    bindingBottom: 'rgba(0, 0, 0, 0.6)',
    openLabel: '#9a8454',
    fret12Label: '#d4b76a',
  },

  'acoustique-rosewood': {
    id: 'acoustique-rosewood',
    name: 'Acoustique rosewood',
    short: 'Acoustique',
    description: 'Manche palissandre naturel, frets nickel poli, dots nacre. Vibe folk / classique.',
    category: 'realistic',
    board: ['#4a2a18', '#2e1810', '#1a0a04'],
    fret: ['#888888', '#f0f0f0', '#888888'],
    nut: ['#c4b596', '#fff5dc', '#9a8966'],
    pearl: ['#ffffff', '#dee0eb', '#7a7a85'],
    bassString: ['#5a4828', '#d4b76a', '#3a2c18'],
    trebleString: ['#9a9a9a', '#f0f0f0', '#6a6a6a'],
    note: ['#ffffff', '#c8c8d0'],
    tonic: ['#fbe89a', '#d4b76a', '#7a623c'],
    bindingTop: 'rgba(180, 120, 60, 0.5)',
    bindingBottom: 'rgba(0, 0, 0, 0.7)',
    openLabel: '#d4b890',
    fret12Label: '#e8c994',
  },

  'electrique-erable': {
    id: 'electrique-erable',
    name: 'Électrique érable',
    short: 'Électrique',
    description: 'Manche érable clair façon Strat, frets chromées, dots noirs. Vibe rock / blues.',
    category: 'realistic',
    board: ['#f0d4a0', '#e0b878', '#b89858'],
    fret: ['#a0a0a0', '#fafafa', '#888888'],
    nut: ['#c4b596', '#fff5dc', '#9a8966'],
    pearl: ['#3a2a1c', '#1a1208', '#0a0604'],
    bassString: ['#5a4828', '#d4b76a', '#3a2c18'],
    trebleString: ['#7a7a82', '#e0e0e4', '#5a5a62'],
    note: ['#ffffff', '#c8c8d0'],
    tonic: ['#fbe89a', '#d4b76a', '#7a623c'],
    bindingTop: 'rgba(255, 230, 180, 0.7)',
    bindingBottom: 'rgba(70, 40, 20, 0.6)',
    openLabel: '#3a2c18',
    fret12Label: '#3a2c18',
  },
};

export const SKIN_LIST: FretboardSkin[] = Object.values(FRETBOARD_SKINS);

export function getSkin(id: FretboardSkinId): FretboardSkin {
  return FRETBOARD_SKINS[id] ?? FRETBOARD_SKINS['noir-mat'];
}
