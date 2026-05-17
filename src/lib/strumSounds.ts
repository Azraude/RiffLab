/**
 * Catalogue des sons de strum (timbres synthés / sampler Tone.js).
 *
 * Chaque timbre est une recette qui produit 6 voices (un par corde) +
 * une chaîne d'effets dédiée. La chaîne est ensuite branchée sur l'output
 * fourni (typiquement la reverb master de audio.ts).
 *
 * ⚠️ Historique audio :
 * - v1 (Phase 1) : PluckSynth pur → sonnait dégueulasse.
 * - v2 (session 16) : refonte avec filter chains + chorus + EQ shaping.
 * - v3 (session 18) : ajout de 5 presets sampler-based (CDN nbrosowsky)
 *   avec WaveShaper + filter chains.
 * - **v4 (session 20 — actuel)** : refonte des presets sampler avec
 *   `buildAmpChain` (preamp → tube sat → tone stack 3-band → power amp →
 *   cabinet IR convolver → room reverb). Approche Neural-DSP-like.
 *
 * Les IDs sampler historiques (electric-real-sampled, electric-crunch,
 * electric-lead, electric-blues, acoustic-warm) sont préservés pour la
 * compat des prefs persisted — mais leur recette pointe maintenant sur
 * la chaîne ampChain. `electric-metal` est nouveau (Mesa Rectifier).
 */
import * as Tone from 'tone';
import {
  buildAmpChain,
  describeAmpChain,
  type AmpChainConfig,
  type AmpStage,
} from './ampChain';

export type StrumSoundId =
  // Presets sampler "ampChain" (IDs historiques préservés pour prefs compat)
  | 'electric-real-sampled' // Fender Twin clean — DEFAULT
  | 'electric-crunch' // Marshall Plexi crunch
  | 'electric-lead' // Marshall JCM lead — solo Slash
  | 'electric-metal' // NEW : Mesa Rectifier high-gain
  | 'electric-blues' // Vox AC30 blues
  | 'acoustic-warm' // Acoustique douce (pas d'IR cab, juste filtre + reverb)
  // Synthés legacy (fallback hors-ligne / timbres alternatifs)
  | 'electric-clean'
  | 'acoustic-steel'
  | 'nylon-soft'
  | 'karplus'
  | 'electric-drive';

export type StrumSound = {
  id: StrumSoundId;
  label: string;
  description: string;
  /** Caractère sonore en mots-clés (chips affichées dans le picker). */
  tags: string[];
  /** Marqueur "préset validé / default" — affiché en premier dans le picker. */
  recommended?: boolean;
  /** Marqueur premium (cosmetics shop Phase 5). */
  premium?: boolean;
};

/**
 * Liste ordonnée — `recommended` d'abord, puis les presets ampChain par
 * gain croissant (clean → crunch → lead → metal), puis acoustique, puis
 * legacy synthés.
 */
export const STRUM_SOUNDS: StrumSound[] = [
  {
    id: 'electric-real-sampled',
    label: 'Fender Twin clean 🎸',
    description: 'Sampler + ampChain : Twin 2x12, clean chimey. Compresseur léger, room reverb.',
    tags: ['samples', 'clean', 'fender', 'twin'],
    recommended: true,
  },
  {
    id: 'electric-crunch',
    label: 'Marshall Plexi crunch 🤘',
    description: 'Sampler + ampChain : Marshall 4x12 V30, preamp boost + tube sat. Rythmique rock.',
    tags: ['samples', 'crunch', 'marshall', 'plexi'],
  },
  {
    id: 'electric-lead',
    label: 'Marshall JCM Lead 🔥',
    description: 'Sampler + ampChain : JCM lead high-gain, mid-focused + delay 1/8 + plate reverb. Solo Slash.',
    tags: ['samples', 'distortion', 'marshall', 'solo'],
  },
  {
    id: 'electric-metal',
    label: 'Mesa Rectifier metal ⚡',
    description: 'Sampler + ampChain : Mesa 4x12, high-gain scoop. Power chords agressifs.',
    tags: ['samples', 'metal', 'mesa', 'scoop'],
  },
  {
    id: 'electric-blues',
    label: 'Vox AC30 blues 🎷',
    description: 'Sampler + ampChain : Vox 2x12 top boost, tube sat doux + chorus + plate reverb. BB King / SRV.',
    tags: ['samples', 'blues', 'vox', 'ac30'],
  },
  {
    id: 'acoustic-warm',
    label: 'Acoustique chaude 🪵',
    description: 'Sampler filtré sans amp : LP 7kHz + EQ + reverb hall. Pour ballades et arpèges.',
    tags: ['samples', 'acoustique', 'studio'],
  },
  {
    id: 'electric-clean',
    label: 'Électrique clean (synthé)',
    description: 'Synthé cristallin — fallback offline si les samples ne chargent pas.',
    tags: ['synthé', 'fallback', 'offline'],
  },
  {
    id: 'acoustic-steel',
    label: 'Acoustique steel (synthé)',
    description: 'Steel-string FM + chorus — vibe Martin / Taylor pour ballades.',
    tags: ['synthé', 'acoustique', 'ballade'],
  },
  {
    id: 'nylon-soft',
    label: 'Nylon douce (synthé)',
    description: 'Classique nylon, attaque douce et médiums boisés. Pour la bossa et le jazz.',
    tags: ['synthé', 'classique', 'doux'],
  },
  {
    id: 'karplus',
    label: 'Pluck clair (synthé)',
    description: 'Pluck synthétique brillant et léger. Pour les arpèges et le détail.',
    tags: ['synthé', 'pluck', 'clair'],
  },
  {
    id: 'electric-drive',
    label: 'Drive subtil (synthé)',
    description: 'Saturation subtile — rock léger et indie. Pas pour le métal.',
    tags: ['synthé', 'overdrive', 'rock'],
  },
];

export function getStrumSound(id: StrumSoundId): StrumSound {
  return STRUM_SOUNDS.find((s) => s.id === id) ?? STRUM_SOUNDS[0];
}

// ─── Recipes config (pour l'UI signal-flow display) ──────────────────

/**
 * Recettes ampChain pour les presets sampler. Centralisé ici pour que
 * l'UI puisse afficher le signal-flow via `describeAmpChain`.
 *
 * Note : `acoustic-warm` n'utilise pas ampChain (pas de cab, pas
 * d'overdrive), ce n'est donc pas dans cette map.
 */
export const AMP_CONFIGS: Partial<Record<StrumSoundId, AmpChainConfig>> = {
  // Fender Twin clean — chimey, sparkle, mid scoop léger
  'electric-real-sampled': {
    preampGain: 2,
    tubeSatAmount: 1.5,
    toneEQ: { bass: 2, mid: -3, treble: 4 },
    powerAmpSat: 0.08,
    cabName: 'fender-twin-2x12',
    roomReverb: 0.3,
    roomDecay: 1.6,
    velocityScale: 0.78,
  },
  // Marshall Plexi crunch — preamp gain modéré, tone stack mid forward
  'electric-crunch': {
    preampGain: 4.5,
    tubeSatAmount: 5,
    toneEQ: { bass: 3, mid: 4, treble: 3 },
    powerAmpSat: 0.4,
    cabName: 'marshall-4x12-v30',
    roomReverb: 0.18,
    roomDecay: 1.4,
    velocityScale: 0.72,
  },
  // Marshall JCM lead — high gain, mid focus brutal, delay + plate
  'electric-lead': {
    preampGain: 8,
    tubeSatAmount: 9,
    toneEQ: { bass: 1, mid: 6, treble: 5 },
    powerAmpSat: 0.7,
    cabName: 'marshall-4x12-v30',
    roomReverb: 0.28,
    roomDecay: 2.4,
    delayWet: 0.22,
    velocityScale: 0.6,
  },
  // Mesa Rectifier metal — scoop classique, tight, agressif
  'electric-metal': {
    preampGain: 12,
    tubeSatAmount: 13,
    toneEQ: { bass: 6, mid: -4, treble: 6 },
    powerAmpSat: 0.85,
    cabName: 'mesa-rectifier-4x12',
    roomReverb: 0.15,
    roomDecay: 1.2,
    velocityScale: 0.55,
  },
  // Vox AC30 blues — top boost, tube sat doux, plate reverb longue
  'electric-blues': {
    preampGain: 3.5,
    tubeSatAmount: 4,
    toneEQ: { bass: 2, mid: 2, treble: 6 },
    powerAmpSat: 0.28,
    cabName: 'vox-ac30-2x12',
    roomReverb: 0.35,
    roomDecay: 2.8,
    velocityScale: 0.75,
  },
};

/**
 * Renvoie la chaîne stages pour un preset, ou null si pas de chaîne ampChain
 * (presets acoustique / synthés legacy).
 */
export function getAmpStages(id: StrumSoundId): AmpStage[] | null {
  const config = AMP_CONFIGS[id];
  if (!config) return null;
  return describeAmpChain(config);
}

// ─── Voice builders ────────────────────────────────────────────────

export type SynthVoice = {
  trigger: (freqHz: number, duration: string, time: number, velocity: number) => void;
  dispose: () => void;
};

/**
 * Crée un sampler partagé (samples nbrosowsky/tonejs-instruments CDN public).
 * Utilisé par tous les presets sampler (clean, crunch, lead, metal, blues, acoustic).
 *
 * release : 1.2 par défaut, plus long pour les leads (sustain solo).
 */
function makeElectricSampler(release = 1.2): Tone.Sampler {
  const baseUrl =
    'https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-electric/';
  return new Tone.Sampler({
    urls: {
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
      'D#5': 'Ds5.mp3',
      'F#5': 'Fs5.mp3',
      A5: 'A5.mp3',
    },
    baseUrl,
    release,
  });
}

/**
 * Helper : attache un dispose() chain au premier voice — la convention
 * dans audio.ts c'est d'appeler voice.dispose() qui doit nettoyer le synth
 * ET les effets de la chaîne.
 */
function chainDispose(voices: SynthVoice[], chain: { dispose: () => void }[]) {
  if (voices.length === 0) return;
  const orig = voices[0].dispose;
  voices[0].dispose = () => {
    orig();
    chain.forEach((node) => {
      try {
        node.dispose();
      } catch {
        // ignore
      }
    });
  };
}

/**
 * Crée les 6 voices (une par corde) pour un preset utilisant ampChain.
 * Toutes les voices partagent le même sampler + même chaîne d'amp (polyphonie
 * du sampler suffit pour 6 cordes en strum simultané).
 */
function buildSampler6(
  configId: keyof typeof AMP_CONFIGS,
  output: Tone.ToneAudioNode,
  samplerRelease: number,
): SynthVoice[] {
  const config = AMP_CONFIGS[configId];
  if (!config) {
    // ne devrait jamais arriver — fallback safe
    return [];
  }
  const sampler = makeElectricSampler(samplerRelease);
  const amp = buildAmpChain(config, output);
  sampler.connect(amp.input);

  const voices: SynthVoice[] = [];
  for (let i = 0; i < 6; i++) {
    voices.push({
      trigger: (f, d, t, v) => {
        if (!sampler.loaded) return;
        sampler.triggerAttackRelease(f, d, t, v * amp.velocityScale);
      },
      dispose: () => {},
    });
  }
  chainDispose(voices, [sampler, { dispose: amp.dispose }]);
  return voices;
}

// ─── Legacy WaveShaper curves (utilisées par electric-drive only) ────

function makeSoftClipCurveLegacy(amount: number, samples = 4096): Float32Array {
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(amount * x) / Math.tanh(amount);
  }
  return curve;
}

// ─── Main entry point ──────────────────────────────────────────────

export function buildVoices(id: StrumSoundId, output: Tone.ToneAudioNode): SynthVoice[] {
  switch (id) {
    case 'electric-real-sampled':
      return buildSampler6('electric-real-sampled', output, 1.3);

    case 'electric-crunch':
      return buildSampler6('electric-crunch', output, 1.4);

    case 'electric-lead':
      return buildSampler6('electric-lead', output, 1.9);

    case 'electric-metal':
      return buildSampler6('electric-metal', output, 1.5);

    case 'electric-blues':
      return buildSampler6('electric-blues', output, 1.7);

    // ─── Acoustique chaude (pas d'ampChain, juste filtre + EQ + reverb) ──
    case 'acoustic-warm': {
      const sampler = makeElectricSampler(1.5);
      const lp = new Tone.Filter({ frequency: 7000, type: 'lowpass', Q: 0.5 });
      const eq = new Tone.EQ3({ low: 0, mid: 2, high: -3 });
      const reverb = new Tone.Reverb({ decay: 2.2, wet: 0.25 });
      void reverb.generate();

      sampler.chain(lp, eq, reverb, output);

      const voices: SynthVoice[] = [];
      for (let i = 0; i < 6; i++) {
        voices.push({
          trigger: (f, d, t, v) => {
            if (!sampler.loaded) return;
            sampler.triggerAttackRelease(f, d, t, v * 0.9);
          },
          dispose: () => {},
        });
      }
      chainDispose(voices, [sampler, lp, eq, reverb]);
      return voices;
    }

    // ─── Électrique clean synthé (fallback) ──────────────────────────
    case 'electric-clean': {
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 4000, Q: 0.6 });
      lp.connect(output);
      const voices: SynthVoice[] = [];
      for (let i = 0; i < 6; i++) {
        const s = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.005, decay: 0.25, sustain: 0.12, release: 0.6 },
        });
        s.connect(lp);
        voices.push({
          trigger: (f, d, t, v) => s.triggerAttackRelease(f, d, t, v * 0.4),
          dispose: () => s.dispose(),
        });
      }
      chainDispose(voices, [lp]);
      return voices;
    }

    case 'acoustic-steel': {
      const chorus = new Tone.Chorus({
        frequency: 1.5,
        delayTime: 3.5,
        depth: 0.4,
        spread: 80,
      }).start();
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 4800, Q: 0.4 });
      const hp = new Tone.Filter({ type: 'highpass', frequency: 80, Q: 0.5 });
      hp.connect(chorus);
      chorus.connect(lp);
      lp.connect(output);

      const voices: SynthVoice[] = [];
      for (let i = 0; i < 6; i++) {
        const s = new Tone.FMSynth({
          harmonicity: 2.5,
          modulationIndex: 8,
          oscillator: { type: 'sine' },
          envelope: { attack: 0.003, decay: 0.4, sustain: 0.15, release: 0.7 },
          modulation: { type: 'triangle' },
          modulationEnvelope: { attack: 0.002, decay: 0.3, sustain: 0.1, release: 0.4 },
        });
        s.connect(hp);
        voices.push({
          trigger: (f, d, t, v) => s.triggerAttackRelease(f, d, t, v * 0.5),
          dispose: () => s.dispose(),
        });
      }
      chainDispose(voices, [hp, chorus, lp]);
      return voices;
    }

    case 'nylon-soft': {
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 2400, Q: 0.6 });
      lp.connect(output);
      const voices: SynthVoice[] = [];
      for (let i = 0; i < 6; i++) {
        const s = new Tone.Synth({
          oscillator: { type: 'triangle' },
          envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.6 },
        });
        s.connect(lp);
        voices.push({
          trigger: (f, d, t, v) => s.triggerAttackRelease(f, d, t, v * 0.55),
          dispose: () => s.dispose(),
        });
      }
      chainDispose(voices, [lp]);
      return voices;
    }

    case 'karplus': {
      const hp = new Tone.Filter({ type: 'highpass', frequency: 100, Q: 0.5 });
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 3800, Q: 0.4 });
      const chorus = new Tone.Chorus({ frequency: 0.8, delayTime: 2, depth: 0.2 }).start();
      hp.connect(chorus);
      chorus.connect(lp);
      lp.connect(output);

      const voices: SynthVoice[] = [];
      for (let i = 0; i < 6; i++) {
        const s = new Tone.PluckSynth({
          attackNoise: 0.3,
          dampening: 3000,
          resonance: 0.96,
        });
        s.connect(hp);
        voices.push({
          trigger: (f, d, t, v) => s.triggerAttackRelease(f, d, t, v * 0.85),
          dispose: () => s.dispose(),
        });
      }
      chainDispose(voices, [hp, chorus, lp]);
      return voices;
    }

    case 'electric-drive': {
      const lpPre = new Tone.Filter({ type: 'lowpass', frequency: 4000, Q: 0.4 });
      const shaper = new Tone.WaveShaper(makeSoftClipCurveLegacy(6));
      shaper.oversample = '4x';
      const lpPost = new Tone.Filter({ type: 'lowpass', frequency: 2800, Q: 0.5 });
      lpPre.connect(shaper);
      shaper.connect(lpPost);
      lpPost.connect(output);

      const voices: SynthVoice[] = [];
      for (let i = 0; i < 6; i++) {
        const s = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          envelope: { attack: 0.004, decay: 0.4, sustain: 0.25, release: 0.9 },
        });
        s.connect(lpPre);
        voices.push({
          trigger: (f, d, t, v) => s.triggerAttackRelease(f, d, t, v * 0.28),
          dispose: () => s.dispose(),
        });
      }
      chainDispose(voices, [lpPre, shaper, lpPost]);
      return voices;
    }
  }
}
