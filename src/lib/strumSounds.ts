/**
 * Catalogue des sons de strum — V5 (session 21) : WebAudioFont.
 *
 * Pivot architectural : on STOP la simulation d'ampli en JS (WaveShaper +
 * filter chains + IR convolver). À la place : samples GM SoundFont
 * **pré-enregistrés en studio** via WebAudioFont (CDN jsdelivr). Chaque
 * preset arrive avec son caractère d'ampli déjà imprimé sur la waveform.
 *
 * Historique :
 * - v1 (Phase 1) : PluckSynth pur → dégueulasse
 * - v2 (session 16) : refonte avec filter chains + chorus
 * - v3 (session 18) : 5 presets sampler nbrosowsky + WaveShaper
 * - v4 (session 20) : ampChain Neural-DSP-like (IR convolver) — cassé
 *   par SR mismatch 44100 vs 48000, fixé en recovery, mais l'approche
 *   reste expérimentale et ne convainc pas à l'oreille
 * - **v5 (session 21 — actuel)** : WebAudioFont GM presets. Les samples
 *   FluidR3_GM sont la référence gratuite la plus crédible.
 *
 * Polish post-WebAudioFont (dans audio.ts) :
 * - Reverb subtile par preset (room / spring / plate selon le caractère)
 * - LP filter léger à ~9kHz pour anti-fatigue (optionnel)
 * - PAS de WaveShaper distortion : les presets overdrive/distortion sont
 *   déjà saturés sur la waveform.
 */
import type { PresetSpec } from './webAudioFont';

export type StrumSoundId =
  | 'acoustic-nylon'
  | 'acoustic-steel'
  | 'electric-jazz'
  | 'electric-clean'
  | 'electric-overdrive'
  | 'electric-distortion';

export type StrumSound = {
  id: StrumSoundId;
  label: string;
  description: string;
  /** Chips affichées dans le picker pour scanner rapidement. */
  tags: string[];
  /** Marqueur "préset validé / default". */
  recommended?: boolean;
  /** Marqueur premium (cosmetics shop Phase 5). */
  premium?: boolean;
};

const WAF_BASE =
  'https://cdn.jsdelivr.net/gh/surikov/webaudiofontdata@master/sound/';

/**
 * Mapping preset GM → URL + global var name.
 * Convention WebAudioFont : `<NNNN>_FluidR3_GM_sf2_file.js` définit
 * `_tone_<NNNN>_FluidR3_GM_sf2_file`.
 */
export const WAF_PRESETS: Record<StrumSoundId, PresetSpec> = {
  'acoustic-nylon': {
    url: WAF_BASE + '0240_FluidR3_GM_sf2_file.js',
    varName: '_tone_0240_FluidR3_GM_sf2_file',
  },
  'acoustic-steel': {
    url: WAF_BASE + '0250_FluidR3_GM_sf2_file.js',
    varName: '_tone_0250_FluidR3_GM_sf2_file',
  },
  'electric-jazz': {
    url: WAF_BASE + '0260_FluidR3_GM_sf2_file.js',
    varName: '_tone_0260_FluidR3_GM_sf2_file',
  },
  'electric-clean': {
    url: WAF_BASE + '0270_FluidR3_GM_sf2_file.js',
    varName: '_tone_0270_FluidR3_GM_sf2_file',
  },
  'electric-overdrive': {
    url: WAF_BASE + '0290_FluidR3_GM_sf2_file.js',
    varName: '_tone_0290_FluidR3_GM_sf2_file',
  },
  'electric-distortion': {
    url: WAF_BASE + '0300_FluidR3_GM_sf2_file.js',
    varName: '_tone_0300_FluidR3_GM_sf2_file',
  },
};

/**
 * Post-FX par preset : reverb decay/wet, optionnellement LP cutoff.
 * Appliqué en aval du sampler dans audio.ts.
 */
export type PresetFx = {
  reverbDecay: number;
  reverbWet: number;
  /** LP filter cutoff Hz (anti-fatigue) — 0 = bypass */
  lpCutoff: number;
  /** Velocity multiplicateur (0-1) appliqué au trigger */
  velocityScale: number;
  /** Durée par défaut d'une note en sec — long pour clean/jazz, court pour distortion mute */
  noteDuration: number;
};

export const PRESET_FX: Record<StrumSoundId, PresetFx> = {
  'acoustic-nylon': {
    reverbDecay: 2.2,
    reverbWet: 0.22,
    lpCutoff: 0,
    velocityScale: 0.85,
    noteDuration: 2.4,
  },
  'acoustic-steel': {
    reverbDecay: 2.0,
    reverbWet: 0.2,
    lpCutoff: 0,
    velocityScale: 0.85,
    noteDuration: 2.4,
  },
  'electric-jazz': {
    reverbDecay: 1.6,
    reverbWet: 0.15,
    lpCutoff: 9000,
    velocityScale: 0.8,
    noteDuration: 2.0,
  },
  'electric-clean': {
    reverbDecay: 1.4,
    reverbWet: 0.15,
    lpCutoff: 9000,
    velocityScale: 0.8,
    noteDuration: 2.0,
  },
  'electric-overdrive': {
    reverbDecay: 1.2,
    reverbWet: 0.1,
    lpCutoff: 8500,
    velocityScale: 0.7,
    noteDuration: 1.6,
  },
  'electric-distortion': {
    reverbDecay: 2.0,
    reverbWet: 0.12,
    lpCutoff: 8000,
    velocityScale: 0.65,
    noteDuration: 1.8,
  },
};

/**
 * Liste ordonnée — clean en premier (default recommandé), puis dans
 * l'ordre acoustique → electric clean → drive → distortion.
 */
export const STRUM_SOUNDS: StrumSound[] = [
  {
    id: 'electric-clean',
    label: 'Électrique clean 🎸',
    description: 'Samples GM électrique clean (FluidR3). Polyvalent, default recommandé.',
    tags: ['clean', 'gm', 'fluidr3'],
    recommended: true,
  },
  {
    id: 'electric-jazz',
    label: 'Électrique jazz 🎷',
    description: 'Hollow body jazz, médiums chauds, attaque douce.',
    tags: ['jazz', 'gm', 'hollow'],
  },
  {
    id: 'electric-overdrive',
    label: 'Électrique overdrive 🤘',
    description: 'Crunch tube saturé, vibe rock blues. Pas de distortion en JS — déjà imprimé sur le sample.',
    tags: ['crunch', 'gm', 'overdrive'],
  },
  {
    id: 'electric-distortion',
    label: 'Électrique distortion ⚡',
    description: 'High-gain saturé, pour metal et hard rock. Sustain long, plate reverb.',
    tags: ['distortion', 'gm', 'metal'],
  },
  {
    id: 'acoustic-steel',
    label: 'Acoustique steel 🪵',
    description: 'Acoustique cordes acier, vibe Martin / Taylor. Room reverb naturelle.',
    tags: ['acoustique', 'gm', 'steel'],
  },
  {
    id: 'acoustic-nylon',
    label: 'Nylon classique 🎼',
    description: 'Classique nylon, médiums boisés. Pour bossa, jazz manouche, arpèges doux.',
    tags: ['nylon', 'gm', 'classique'],
  },
];

export function getStrumSound(id: StrumSoundId): StrumSound {
  return STRUM_SOUNDS.find((s) => s.id === id) ?? STRUM_SOUNDS[0];
}

/**
 * Migration des anciens IDs (sessions précédentes) vers les nouveaux GM
 * presets. Utilisé dans prefsStore migrate v8 → v9.
 */
const LEGACY_ID_MIGRATION: Record<string, StrumSoundId> = {
  // Anciens samplers nbrosowsky + ampChain (session 18-20)
  'electric-real-sampled': 'electric-clean',
  'electric-crunch': 'electric-overdrive',
  'electric-lead': 'electric-distortion',
  'electric-metal': 'electric-distortion',
  'electric-blues': 'electric-clean',
  'acoustic-warm': 'acoustic-steel',
  // Anciens synthés fallback (sessions 1-17)
  'nylon-soft': 'acoustic-nylon',
  'karplus': 'electric-clean',
  'electric-drive': 'electric-overdrive',
};

export function migrateLegacyStrumId(legacy: string): StrumSoundId {
  return LEGACY_ID_MIGRATION[legacy] ?? 'electric-clean';
}
