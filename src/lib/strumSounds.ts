/**
 * Catalogue des sons de strum — V6 (session D, 2026-06-16) : Tone.Sampler HQ.
 *
 * Pivot architectural : on STOP les samples GM SoundFont WebAudioFont (qui
 * sonnaient justement « MIDI-dégueu » — c'est littéralement le son General
 * MIDI). À la place : de **vrais samples de guitare enregistrés** (pack
 * nbrosowsky/tonejs-instruments, format MP3, CDN GitHub Pages) joués via
 * `Tone.Sampler` natif, avec une chaîne d'effets par preset (distortion
 * WaveShaper, EQ3, reverb, delay).
 *
 * Historique :
 * - v1 (Phase 1) : PluckSynth pur → dégueulasse
 * - v2 (session 16) : refonte avec filter chains + chorus
 * - v3 (session 18) : 5 presets sampler nbrosowsky + WaveShaper
 * - v4 (session 20) : ampChain Neural-DSP-like (IR convolver) — cassé
 *   par SR mismatch 44100 vs 48000
 * - v5 (session 21) : WebAudioFont GM presets — crédibles mais clairement
 *   « MIDI » à l'oreille
 * - **v6 (session D — actuel)** : retour aux vrais samples nbrosowsky mais
 *   en propre, via Tone.Sampler + chaîne FX par preset. Lazy-load par pack.
 *
 * Trois packs sources (vrais enregistrements) :
 *   - `guitar-electric` → tous les presets électriques (clean/jazz/drive/disto)
 *   - `guitar-acoustic` → acoustique steel
 *   - `guitar-nylon`    → nylon classique
 * Le caractère (crunch, disto, jazz mellow…) est imprimé en aval par la
 * chaîne FX de `PRESET_CONFIG`, pas par un sample différent.
 *
 * Licence : nbrosowsky/tonejs-instruments — samples libres, distribués sur
 * GitHub Pages, déjà utilisés en session 18. CDN-ready, MP3.
 */

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

/**
 * Packs de samples réels (nbrosowsky/tonejs-instruments, GitHub Pages).
 * Format MP3, ~6 octaves de couverture, multi-samplés. `Tone.Sampler`
 * interpole entre les notes manquantes (pitch-shift), donc 8-12 samples
 * bien espacés suffisent pour un rendu naturel sur tout le manche.
 *
 * Les filenames suivent la convention de la lib : dièses notés `s`
 * (ex. `Ds3.mp3` = D#3). Vérifiés contre Tonejs-Instruments.js (master).
 */
export type SamplePackId = 'guitar-electric' | 'guitar-acoustic' | 'guitar-nylon';

const SAMPLE_BASE = 'https://nbrosowsky.github.io/tonejs-instruments/samples/';

export type SamplePack = {
  /** baseUrl passé tel quel à Tone.Sampler */
  baseUrl: string;
  /** map note (notation Tone "C#4") → filename MP3 */
  urls: Record<string, string>;
};

export const SAMPLE_PACKS: Record<SamplePackId, SamplePack> = {
  'guitar-electric': {
    baseUrl: SAMPLE_BASE + 'guitar-electric/',
    urls: {
      E2: 'E2.mp3',
      A2: 'A2.mp3',
      C3: 'C3.mp3',
      'D#3': 'Ds3.mp3',
      'F#3': 'Fs3.mp3',
      A3: 'A3.mp3',
      C4: 'C4.mp3',
      'D#4': 'Ds4.mp3',
      'F#4': 'Fs4.mp3',
      A4: 'A4.mp3',
      C5: 'C5.mp3',
      C6: 'C6.mp3',
    },
  },
  'guitar-acoustic': {
    baseUrl: SAMPLE_BASE + 'guitar-acoustic/',
    urls: {
      E2: 'E2.mp3',
      A2: 'A2.mp3',
      D3: 'D3.mp3',
      G3: 'G3.mp3',
      B3: 'B3.mp3',
      E4: 'E4.mp3',
      A4: 'A4.mp3',
      C5: 'C5.mp3',
      D5: 'D5.mp3',
    },
  },
  'guitar-nylon': {
    baseUrl: SAMPLE_BASE + 'guitar-nylon/',
    urls: {
      E2: 'E2.mp3',
      A2: 'A2.mp3',
      D3: 'D3.mp3',
      G3: 'G3.mp3',
      B3: 'B3.mp3',
      E4: 'E4.mp3',
      A4: 'A4.mp3',
      E5: 'E5.mp3',
    },
  },
};

/**
 * Recette FX par preset, appliquée en aval du `Tone.Sampler` dans audio.ts.
 *
 * Chaîne :
 *   Sampler → [Distortion?] → EQ3 → [FeedbackDelay?] → Reverb → master
 *
 * - `pack` : quel pack de samples charger (plusieurs presets partagent un
 *   même pack → 1 seul fetch réseau, le sampler est caché par pack).
 * - `distortion` : montant WaveShaper 0-1 (0 = bypass) — c'est lui qui crée
 *   crunch / disto à partir du sample clean.
 * - `eq` : gains low/mid/high en dB (EQ3).
 * - `reverbDecay/reverbWet` : caractère de la pièce (room/spring/plate).
 * - `delayWet/delayTime/delayFeedback` : delay optionnel (0 wet = bypass).
 * - `volumeDb` : trim de niveau du sampler (compense la disto qui pousse).
 * - `release` : release du sampler (sustain naturel).
 * - `noteDuration` : durée par défaut d'une note jouée (sec).
 * - `velocityScale` : multiplicateur de vélocité au trigger.
 */
export type PresetConfig = {
  pack: SamplePackId;
  distortion: number;
  eq: { low: number; mid: number; high: number };
  reverbDecay: number;
  reverbWet: number;
  delayWet: number;
  delayTime: string;
  delayFeedback: number;
  volumeDb: number;
  release: number;
  noteDuration: number;
  velocityScale: number;
};

export const PRESET_CONFIG: Record<StrumSoundId, PresetConfig> = {
  'electric-clean': {
    pack: 'guitar-electric',
    distortion: 0,
    eq: { low: 0, mid: 0, high: 1 },
    reverbDecay: 1.5,
    reverbWet: 0.16,
    delayWet: 0,
    delayTime: '8n.',
    delayFeedback: 0.18,
    volumeDb: 0,
    release: 1.2,
    noteDuration: 2.0,
    velocityScale: 0.85,
  },
  'electric-jazz': {
    pack: 'guitar-electric',
    distortion: 0,
    eq: { low: 2, mid: 1, high: -5 },
    reverbDecay: 1.8,
    reverbWet: 0.14,
    delayWet: 0,
    delayTime: '8n.',
    delayFeedback: 0.18,
    volumeDb: 1,
    release: 1.5,
    noteDuration: 2.2,
    velocityScale: 0.8,
  },
  'electric-overdrive': {
    pack: 'guitar-electric',
    distortion: 0.3,
    eq: { low: -1, mid: 4, high: 0 },
    reverbDecay: 1.2,
    reverbWet: 0.1,
    delayWet: 0,
    delayTime: '8n.',
    delayFeedback: 0.18,
    volumeDb: -3,
    release: 1.0,
    noteDuration: 1.7,
    velocityScale: 0.72,
  },
  'electric-distortion': {
    pack: 'guitar-electric',
    distortion: 0.62,
    eq: { low: 1, mid: 3, high: 1 },
    reverbDecay: 2.0,
    reverbWet: 0.12,
    delayWet: 0.12,
    delayTime: '8n.',
    delayFeedback: 0.22,
    volumeDb: -6,
    release: 1.4,
    noteDuration: 1.8,
    velocityScale: 0.62,
  },
  'acoustic-steel': {
    pack: 'guitar-acoustic',
    distortion: 0,
    eq: { low: 1, mid: 0, high: 2 },
    reverbDecay: 1.6,
    reverbWet: 0.18,
    delayWet: 0,
    delayTime: '8n.',
    delayFeedback: 0.18,
    volumeDb: 0,
    release: 1.5,
    noteDuration: 2.4,
    velocityScale: 0.85,
  },
  'acoustic-nylon': {
    pack: 'guitar-nylon',
    distortion: 0,
    eq: { low: 1, mid: 0, high: -1 },
    reverbDecay: 2.0,
    reverbWet: 0.2,
    delayWet: 0,
    delayTime: '8n.',
    delayFeedback: 0.18,
    volumeDb: 0,
    release: 1.6,
    noteDuration: 2.4,
    velocityScale: 0.82,
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
    description: 'Vrais samples électrique clean, EQ aéré. Polyvalent, default recommandé.',
    tags: ['clean', 'sampler', 'studio'],
    recommended: true,
  },
  {
    id: 'electric-jazz',
    label: 'Électrique jazz 🎷',
    description: 'Hollow body mellow, aigus roulés, médiums chauds. Pour les ballades et le jazz.',
    tags: ['jazz', 'sampler', 'mellow'],
  },
  {
    id: 'electric-overdrive',
    label: 'Électrique overdrive 🤘',
    description: 'Crunch tube (WaveShaper soft) + mid-boost. Vibe rock blues.',
    tags: ['crunch', 'sampler', 'overdrive'],
  },
  {
    id: 'electric-distortion',
    label: 'Électrique distortion ⚡',
    description: 'High-gain saturé (WaveShaper hard) + delay, pour metal et hard rock.',
    tags: ['distortion', 'sampler', 'metal'],
  },
  {
    id: 'acoustic-steel',
    label: 'Acoustique steel 🪵',
    description: 'Vrais samples acoustique cordes acier, vibe Martin / Taylor. Room reverb naturelle.',
    tags: ['acoustique', 'sampler', 'steel'],
  },
  {
    id: 'acoustic-nylon',
    label: 'Nylon classique 🎼',
    description: 'Vrais samples nylon, médiums boisés. Pour bossa, jazz manouche, arpèges doux.',
    tags: ['nylon', 'sampler', 'classique'],
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
