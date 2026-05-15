/**
 * Skins de manche — Phase 2C + extensions Phase 4 (nouveaux skins
 * Classique nylon, Électrique LP, Néon arty premium, Vintage gold
 * premium).
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
  | 'electrique-erable'
  | 'classique-nylon'
  | 'electrique-lp'
  | 'neon-arty'
  | 'vintage-gold';

/**
 * Type de headstock dessinée à gauche du nut quand le skin en a une.
 *  - 'dreadnought' : 3+3 pegs en haut/bas, forme légèrement trapézoïdale (folk)
 *  - 'strat'       : 6-in-line le long du bord haut (rock/blues)
 */
export type HeadstockType = 'dreadnought' | 'strat';

export type FretboardSkin = {
  id: FretboardSkinId;
  name: string;
  short: string;
  description: string;
  category: 'minimal' | 'realistic' | 'arty';
  /** Marqueur premium — affiché avec un lock dans le picker. */
  premium?: boolean;

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

  // Optional headstock (extends the viewBox to the left of the nut)
  headstock?: { type: HeadstockType; width: number };

  /**
   * Couleur des chevilles (tuning pegs) sur la headstock. 3 stops radial
   * (center highlight, mid, edge). Si non défini, fallback sur `pearl`.
   */
  peg?: [string, string, string];
};

export const FRETBOARD_SKINS: Record<FretboardSkinId, FretboardSkin> = {
  // ─── Existants (Phase 2C) ───────────────────────────────────────
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
    description: 'Manche palissandre, frets nickel, dots nacre. Vibe folk / classique.',
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
    headstock: { type: 'dreadnought', width: 110 },
    peg: ['#e8c994', '#c9a96a', '#8a7548'],
  },

  'electrique-erable': {
    id: 'electrique-erable',
    name: 'Électrique érable',
    short: 'Électrique',
    description: 'Érable clair façon Strat, frets chromées, dots noirs. Vibe rock / blues.',
    category: 'realistic',
    board: ['#f0d4a0', '#e0b878', '#b89858'],
    fret: ['#a0a0a0', '#fafafa', '#888888'],
    nut: ['#c4b596', '#fff5dc', '#9a8966'],
    pearl: ['#3a2a1c', '#1a1208', '#0a0604'],
    bassString: ['#2a1c0c', '#5a4220', '#1a0c04'],
    trebleString: ['#3a3a40', '#6a6a72', '#2a2a32'],
    note: ['#ffffff', '#c8c8d0'],
    tonic: ['#fbe89a', '#d4b76a', '#7a623c'],
    bindingTop: 'rgba(255, 230, 180, 0.7)',
    bindingBottom: 'rgba(70, 40, 20, 0.6)',
    openLabel: '#3a2c18',
    fret12Label: '#3a2c18',
    headstock: { type: 'strat', width: 130 },
    peg: ['#f0f0f0', '#dadada', '#a0a0a8'],
  },

  // ─── Phase 4 — nouveaux skins (TASK 7) ──────────────────────────
  'classique-nylon': {
    id: 'classique-nylon',
    name: 'Classique nylon',
    short: 'Nylon',
    description: 'Palissandre clair façon classique, cordes nylon ivoire, inlays nacre crème. Mat et noble.',
    category: 'realistic',
    // Palissandre clair satiné, plus chaud que rosewood foncé
    board: ['#7a4a30', '#5a3422', '#3a1f14'],
    // Frets nickel mat (pas chromé brillant)
    fret: ['#999999', '#d8d8d8', '#888888'],
    // Nut os blanc-ivoire
    nut: ['#e8dec6', '#fff5dc', '#a89a82'],
    // Inlays nacre crème
    pearl: ['#f0e8d8', '#dac8b0', '#9a8a72'],
    // Cordes nylon : 3 graves filées (or pâle), 3 aiguës nylon translucide
    bassString: ['#a89568', '#d4c098', '#7a6848'],
    trebleString: ['#e8dcc6', '#f5ecda', '#a89c88'],
    note: ['#fff5dc', '#cab896'],
    tonic: ['#ffeaa8', '#d4b76a', '#7a623c'],
    bindingTop: 'rgba(232, 222, 198, 0.6)',
    bindingBottom: 'rgba(60, 40, 25, 0.65)',
    openLabel: '#d4c098',
    fret12Label: '#e8dec6',
    headstock: { type: 'dreadnought', width: 110 },
    peg: ['#f0e8d8', '#c9b89a', '#7a6a52'],
  },

  'electrique-lp': {
    id: 'electrique-lp',
    name: 'Électrique LP',
    short: 'Les Paul',
    description: 'Palissandre foncé façon Les Paul, frets jumbo chromées, inlays trapèzes nacre. Vibe rock épais.',
    category: 'realistic',
    // Rosewood Les Paul très sombre, presque ébène
    board: ['#2a1408', '#180a04', '#0a0402'],
    // Frets jumbo chromées brillantes
    fret: ['#b8b8b8', '#fafafa', '#888888'],
    nut: ['#c4b596', '#fff5dc', '#9a8966'],
    // Inlays trapèzes nacre crème blanc cassé (le LP signature)
    pearl: ['#f0e8d4', '#d8cab2', '#8a7d68'],
    // Cordes nickel / acier (style 9-42 électrique)
    bassString: ['#6a5a3a', '#a89868', '#3a3020'],
    trebleString: ['#a0a0a0', '#e0e0e0', '#6a6a6a'],
    note: ['#ffffff', '#c8c8d0'],
    tonic: ['#fbe89a', '#d4b76a', '#7a623c'],
    bindingTop: 'rgba(240, 232, 212, 0.4)',
    bindingBottom: 'rgba(0, 0, 0, 0.75)',
    openLabel: '#c9b890',
    fret12Label: '#f0e8d4',
    headstock: { type: 'dreadnought', width: 110 },
    peg: ['#f5d97a', '#d4b76a', '#7a623c'],
  },

  // Premium — locked tant que le shop Phase 5 n'est pas en place
  'neon-arty': {
    id: 'neon-arty',
    name: 'Néon arty',
    short: 'Néon',
    description: 'Noir profond, frets néon cyan/magenta qui glow, inlays néon, cordes argent vif. Vibe arcade.',
    category: 'arty',
    premium: true,
    // Noir absolu pour faire ressortir les néons
    board: ['#04040a', '#020208', '#000004'],
    // Frets néon : cyan brillant avec halo
    fret: ['#1ae8f5', '#a8f9ff', '#1ae8f5'],
    // Nut magenta
    nut: ['#ff2dd0', '#ff8ae8', '#b81f9c'],
    // Inlays néon magenta avec glow
    pearl: ['#ff6be0', '#ff2dd0', '#80157c'],
    // Cordes argent ultra-vif (contraste max sur noir)
    bassString: ['#1ae8f5', '#7df0fa', '#0aa0b0'],
    trebleString: ['#ff6be0', '#ffaef0', '#b81f9c'],
    note: ['#ffffff', '#a8f9ff'],
    // Tonique néon magenta saturé
    tonic: ['#ffaef0', '#ff2dd0', '#80157c'],
    bindingTop: 'rgba(26, 232, 245, 0.5)',
    bindingBottom: 'rgba(255, 45, 208, 0.4)',
    openLabel: '#ff2dd0',
    fret12Label: '#1ae8f5',
  },

  'vintage-gold': {
    id: 'vintage-gold',
    name: 'Vintage gold',
    short: 'Vintage',
    description: 'Manche or vieilli, frets or brillant, inlays nacre or, cordes bronze chaud. Luxe estampillé.',
    category: 'arty',
    premium: true,
    // Or vieilli — patiné, désaturé, ocre
    board: ['#3a2a14', '#251806', '#150c02'],
    // Frets or brillant pur
    fret: ['#a87a28', '#fbe89a', '#a87a28'],
    nut: ['#d4b76a', '#fff5dc', '#7a623c'],
    // Inlays nacre or
    pearl: ['#ffeaa8', '#d4b76a', '#7a623c'],
    // Cordes bronze chaud
    bassString: ['#7a4a18', '#d4a060', '#3a200a'],
    trebleString: ['#c9a96a', '#f0d8a0', '#7a623c'],
    note: ['#fff5dc', '#c8b078'],
    tonic: ['#fff0c0', '#fbe89a', '#a87a28'],
    bindingTop: 'rgba(251, 232, 154, 0.6)',
    bindingBottom: 'rgba(40, 25, 8, 0.75)',
    openLabel: '#d4b76a',
    fret12Label: '#fbe89a',
    headstock: { type: 'dreadnought', width: 110 },
    peg: ['#fbe89a', '#d4b76a', '#7a4a18'],
  },
};

export const SKIN_LIST: FretboardSkin[] = Object.values(FRETBOARD_SKINS);

export function getSkin(id: FretboardSkinId): FretboardSkin {
  return FRETBOARD_SKINS[id] ?? FRETBOARD_SKINS['noir-mat'];
}
