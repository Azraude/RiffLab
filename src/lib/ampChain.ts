/**
 * Amp chain builder — signal-flow Neural-DSP-like pour les presets sampler.
 *
 * Architecture :
 *   Source (Sampler DI) → Preamp Gain → Tube Sat (WaveShaper soft asym)
 *   → 3-band EQ (low shelf / mid peaking / high shelf, "tone stack" Marshall-style)
 *   → Power Amp Sat (WaveShaper cubic clipping 6L6/EL34-like)
 *   → Cabinet IR Convolver (Tone.Convolver, AudioBuffer généré offline)
 *   → [Delay FeedbackDelay optionnel pour les leads]
 *   → Room Reverb (légère, simule le micro recul de cab)
 *   → output (chaîne master)
 *
 * Cabinet IR : on génère un IR synthétique via OfflineAudioContext en
 * filtrant un burst de bruit blanc à enveloppe exponentielle.
 * - Bandpass autour du peak résonant du cab (mid focus pour Marshall,
 *   scoop pour Twin/Mesa, presence boost pour Vox)
 * - HPF pour couper le sub
 * - LPF pour rouler le brillant
 *
 * Ces IRs synthétiques sonnent "convolvés réalistes" mais ne remplacent pas
 * de vrais IRs d'ampli enregistrés au micro. Pour upgrade : drop des .wav
 * libres dans `/public/audio/ir/{cabName}.wav` et activer `loadCabIRFromUrl`.
 *
 * Le cache (`irCache`) survit aux rebuilds de voices — les IRs ne sont
 * générés qu'une fois. Pre-warm via `prewarmCabinets()` au boot de l'audio.
 */
import * as Tone from 'tone';

export type CabinetName =
  | 'marshall-4x12-v30'
  | 'fender-twin-2x12'
  | 'mesa-rectifier-4x12'
  | 'vox-ac30-2x12'
  | 'orange-2x12';

export type CabinetProfile = {
  label: string;
  /** HPF cutoff (Hz) — coupe le sub-rumble */
  lowCut: number;
  /** Fréquence du peak résonant principal (Hz) */
  midPeak: number;
  /** Q du peak — plus haut = plus narrow / nasal */
  midQ: number;
  /** Boost (positif) ou scoop (négatif) en dB au midPeak */
  midGain: number;
  /** LPF cutoff (Hz) — coupe les harsh highs */
  highCut: number;
  /** Longueur IR en ms (typique 150-220) */
  decayMs: number;
  /** Amplitude du transient initial 0-1 (le "thwack" du haut-parleur) */
  initialPunch: number;
};

export const CABINETS: Record<CabinetName, CabinetProfile> = {
  'marshall-4x12-v30': {
    label: 'Marshall 4x12 V30',
    lowCut: 95,
    midPeak: 1700,
    midQ: 1.4,
    midGain: 6,
    highCut: 5200,
    decayMs: 180,
    initialPunch: 0.9,
  },
  'fender-twin-2x12': {
    label: 'Fender Twin 2x12',
    lowCut: 65,
    midPeak: 850,
    midQ: 0.8,
    midGain: -2,
    highCut: 7200,
    decayMs: 220,
    initialPunch: 0.7,
  },
  'mesa-rectifier-4x12': {
    label: 'Mesa Rectifier 4x12',
    lowCut: 105,
    midPeak: 2200,
    midQ: 1.8,
    midGain: 5,
    highCut: 4500,
    decayMs: 150,
    initialPunch: 1,
  },
  'vox-ac30-2x12': {
    label: 'Vox AC30 Blue 2x12',
    lowCut: 80,
    midPeak: 2800,
    midQ: 1.6,
    midGain: 5,
    highCut: 6300,
    decayMs: 200,
    initialPunch: 0.75,
  },
  'orange-2x12': {
    label: 'Orange 2x12',
    lowCut: 85,
    midPeak: 1200,
    midQ: 1,
    midGain: 4,
    highCut: 5000,
    decayMs: 190,
    initialPunch: 0.85,
  },
};

const irCache = new Map<CabinetName, AudioBuffer>();
const irPending = new Map<CabinetName, Promise<AudioBuffer>>();

/**
 * Génère un IR synthétique pour un cab via OfflineAudioContext.
 * Burst de bruit blanc à enveloppe exponentielle, filtré HP / peaking / LP
 * pour donner le caractère tonal du cabinet.
 *
 * Cache global — un cab n'est généré qu'une fois par session.
 */
export function getCabIR(cabName: CabinetName): Promise<AudioBuffer> {
  const cached = irCache.get(cabName);
  if (cached) return Promise.resolve(cached);
  const pending = irPending.get(cabName);
  if (pending) return pending;

  const profile = CABINETS[cabName];
  const sr = 44100;
  const length = Math.max(2048, Math.floor((sr * profile.decayMs) / 1000));

  // OfflineAudioContext supports Web Audio in a non-realtime render.
  const OfflineCtx =
    (window as unknown as { OfflineAudioContext?: typeof OfflineAudioContext })
      .OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;

  if (!OfflineCtx) {
    // Safari iOS très ancien — fallback à un IR trivial (delta).
    const ctx = Tone.getContext().rawContext as unknown as AudioContext;
    const buf = ctx.createBuffer(1, length, sr);
    buf.getChannelData(0)[0] = 1;
    irCache.set(cabName, buf);
    return Promise.resolve(buf);
  }

  const offlineCtx = new OfflineCtx(1, length, sr);

  // Source : burst de bruit + transient initial
  const sourceBuf = offlineCtx.createBuffer(1, length, sr);
  const data = sourceBuf.getChannelData(0);
  // Decay rate : on veut que l'enveloppe tombe à ~-60dB sur la durée
  // decayMs. exp(-decayRate * decayMs/1000) = 0.001 → decayRate = 6.9 / (decayMs/1000)
  const decayRate = 6.9 / (profile.decayMs / 1000);
  const punchSamples = 48;
  for (let i = 0; i < length; i++) {
    const t = i / sr;
    const env = Math.exp(-t * decayRate);
    let sample = (Math.random() * 2 - 1) * env;
    if (i < punchSamples) {
      // Demi-sinus sur les 48 premières samples pour donner un "thwack"
      const punchEnv = Math.sin((i / punchSamples) * Math.PI);
      sample += punchEnv * profile.initialPunch * 0.6;
    }
    data[i] = sample;
  }

  const src = offlineCtx.createBufferSource();
  src.buffer = sourceBuf;

  const hp = offlineCtx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = profile.lowCut;
  hp.Q.value = 0.7;

  const mid = offlineCtx.createBiquadFilter();
  mid.type = 'peaking';
  mid.frequency.value = profile.midPeak;
  mid.Q.value = profile.midQ;
  mid.gain.value = profile.midGain;

  // Petit notch dans les hautes pour adoucir l'attaque "noise raw"
  const presenceShelf = offlineCtx.createBiquadFilter();
  presenceShelf.type = 'highshelf';
  presenceShelf.frequency.value = 6000;
  presenceShelf.gain.value = -4;

  const lp = offlineCtx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = profile.highCut;
  lp.Q.value = 0.5;

  src.connect(hp);
  hp.connect(mid);
  mid.connect(presenceShelf);
  presenceShelf.connect(lp);
  lp.connect(offlineCtx.destination);

  src.start(0);

  const promise = offlineCtx.startRendering().then((rendered) => {
    irCache.set(cabName, rendered);
    irPending.delete(cabName);
    return rendered;
  });
  irPending.set(cabName, promise);
  return promise;
}

/**
 * Synchrone : renvoie l'IR si déjà cached, sinon `null`.
 * Permet à `buildAmpChain` d'être sync quand l'IR est warm.
 */
export function getCabIRSync(cabName: CabinetName): AudioBuffer | null {
  return irCache.get(cabName) ?? null;
}

/**
 * Pre-warm les IRs des 5 cabs en parallèle. À appeler une fois après
 * `Tone.start()` pour éviter le pluck silencieux au premier strum.
 */
export function prewarmCabinets(): Promise<void> {
  const names = Object.keys(CABINETS) as CabinetName[];
  return Promise.all(names.map((n) => getCabIR(n))).then(() => undefined);
}

// ─── WaveShaper curves ────────────────────────────────────────────────

/**
 * Tube preamp saturation : asymétrique (la moitié positive clippe plus
 * doucement que la négative), via tanh — caractère "warm tube".
 */
export function makeTubeSatCurve(amount: number, samples = 4096): Float32Array {
  const curve = new Float32Array(samples);
  const k = Math.max(0.5, amount);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] =
      x >= 0
        ? Math.tanh(k * x) / Math.tanh(k)
        : Math.tanh(k * 0.7 * x) / Math.tanh(k * 0.7);
  }
  return curve;
}

/**
 * Power amp saturation : approche cubique soft-clip type 6L6/EL34.
 * `amount` 0-1 pour piloter l'intensité ; au-dessus de 0.6 ça commence
 * à crunch sérieusement, à 0.9+ c'est du metal Mesa territory.
 */
export function makePowerAmpCurve(amount: number, samples = 4096): Float32Array {
  const curve = new Float32Array(samples);
  // gain pré-clip — plus amount monte, plus on pousse dans la zone non-linéaire
  const drive = 1 + amount * 8;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    const driven = x * drive;
    // Formule "soft cubic" : 3x/2 - x^3/2, bornée à [-1, 1]
    let y = driven;
    if (driven > 1) y = 1;
    else if (driven < -1) y = -1;
    else y = (3 * driven - driven * driven * driven) / 2;
    // Trim post-clip pour éviter d'exploser le master
    curve[i] = y * (1 - amount * 0.3);
  }
  return curve;
}

// ─── Amp chain builder ────────────────────────────────────────────────

export type AmpChainConfig = {
  /** Gain pré-saturation : 1-15. 1-2 = clean, 5-7 = crunch, 10+ = high-gain */
  preampGain: number;
  /** Amount de la tube sat preamp. Par défaut = preampGain * 0.8 */
  tubeSatAmount?: number;
  /** EQ 3 bandes en dB. Range typique : [-12, +12] */
  toneEQ: { bass: number; mid: number; treble: number };
  /** Power amp drive : 0 = pas de power sat, 1 = full Mesa */
  powerAmpSat: number;
  /** Nom du cabinet (génère l'IR via getCabIR) */
  cabName: CabinetName;
  /** Wet de la reverb de salle 0-1. 0 = pas de reverb. */
  roomReverb: number;
  /** Decay de la reverb en secondes (default 1.2) */
  roomDecay?: number;
  /** Wet d'un FeedbackDelay 1/8e optionnel. 0 = pas de delay. */
  delayWet?: number;
  /** Velocity scale appliquée au trigger du sampler (0.4-1.0) */
  velocityScale?: number;
};

export type AmpChain = {
  /** Connecte ta source ici. */
  input: Tone.ToneAudioNode;
  /** Velocity multiplicateur appliqué au sampler.triggerAttackRelease */
  velocityScale: number;
  /** Dispose tous les nœuds de la chaîne. Idempotent. */
  dispose: () => void;
};

/**
 * Construit une chaîne d'ampli signal-flow réaliste.
 * Le Convolver charge son IR async : si l'IR est déjà cached, la chaîne est
 * fonctionnelle immédiatement. Sinon, silence audible pendant ~50-100ms le
 * temps que `getCabIR` résolve, puis ça reprend.
 */
export function buildAmpChain(
  config: AmpChainConfig,
  output: Tone.ToneAudioNode,
): AmpChain {
  const preamp = new Tone.Gain(config.preampGain);
  const tubeSat = new Tone.WaveShaper(
    makeTubeSatCurve(config.tubeSatAmount ?? config.preampGain * 0.8),
  );
  tubeSat.oversample = '4x';

  const bassEQ = new Tone.Filter({
    type: 'lowshelf',
    frequency: 200,
    gain: config.toneEQ.bass,
  });
  const midEQ = new Tone.Filter({
    type: 'peaking',
    frequency: 750,
    Q: 1.2,
    gain: config.toneEQ.mid,
  });
  const trebleEQ = new Tone.Filter({
    type: 'highshelf',
    frequency: 4000,
    gain: config.toneEQ.treble,
  });

  const powerAmp = new Tone.WaveShaper(makePowerAmpCurve(config.powerAmpSat));
  powerAmp.oversample = '4x';

  // Convolver — IR chargé sync si cached, sinon async (legère latence)
  const convolver = new Tone.Convolver({ normalize: true });
  const cached = getCabIRSync(config.cabName);
  if (cached) {
    convolver.buffer = new Tone.ToneAudioBuffer(cached);
  } else {
    void getCabIR(config.cabName).then((ir) => {
      try {
        convolver.buffer = new Tone.ToneAudioBuffer(ir);
      } catch {
        // chain disposed avant que l'IR arrive — ignorer
      }
    });
  }

  // Trim post-cab : la convolution peut booster certaines bandes,
  // on compense pour rester homogène avec les autres presets.
  const postTrim = new Tone.Gain(0.5);

  let delay: Tone.FeedbackDelay | null = null;
  if (config.delayWet && config.delayWet > 0) {
    delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.28,
      wet: config.delayWet,
    });
  }

  const roomDecay = config.roomDecay ?? 1.2;
  const room = new Tone.Reverb({ decay: roomDecay, wet: config.roomReverb });
  void room.generate();

  // Connection : preamp → tubeSat → bass → mid → treble → powerAmp →
  //              convolver → postTrim → [delay] → room → output
  preamp.chain(tubeSat, bassEQ, midEQ, trebleEQ, powerAmp, convolver, postTrim);
  if (delay) {
    postTrim.chain(delay, room, output);
  } else {
    postTrim.chain(room, output);
  }

  const nodes: { dispose: () => void }[] = [
    preamp,
    tubeSat,
    bassEQ,
    midEQ,
    trebleEQ,
    powerAmp,
    convolver,
    postTrim,
    room,
  ];
  if (delay) nodes.push(delay);

  let disposed = false;
  return {
    input: preamp,
    velocityScale: config.velocityScale ?? 0.7,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      nodes.forEach((n) => {
        try {
          n.dispose();
        } catch {
          // ignore
        }
      });
    },
  };
}

// ─── Signal-flow description (pour l'UI mini-schéma sur les preset cards) ─

export type AmpStage = {
  icon: string;
  label: string;
  detail?: string;
};

/**
 * Décrit visuellement la chaîne d'un preset pour affichage UI.
 * Utilisé par le mini-schéma signal-flow sur les preset cards (Settings).
 */
export function describeAmpChain(config: AmpChainConfig): AmpStage[] {
  const stages: AmpStage[] = [
    { icon: '🎸', label: 'DI', detail: 'Sampler' },
    {
      icon: '⚡',
      label: 'Preamp',
      detail: `gain ${config.preampGain.toFixed(1)}`,
    },
    {
      icon: '🎛',
      label: 'EQ',
      detail: `B${formatGain(config.toneEQ.bass)} M${formatGain(
        config.toneEQ.mid,
      )} T${formatGain(config.toneEQ.treble)}`,
    },
  ];
  if (config.powerAmpSat > 0.05) {
    stages.push({
      icon: '🔥',
      label: 'Power',
      detail: `${Math.round(config.powerAmpSat * 100)}%`,
    });
  }
  stages.push({
    icon: '🔊',
    label: 'Cab',
    detail: CABINETS[config.cabName].label,
  });
  if (config.delayWet && config.delayWet > 0) {
    stages.push({ icon: '⏱', label: 'Delay', detail: '1/8' });
  }
  if (config.roomReverb > 0.05) {
    stages.push({
      icon: '🏠',
      label: 'Room',
      detail: `${Math.round(config.roomReverb * 100)}%`,
    });
  }
  return stages;
}

function formatGain(g: number): string {
  if (g === 0) return '0';
  return g > 0 ? `+${g}` : `${g}`;
}
