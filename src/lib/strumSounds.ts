/**
 * Catalogue des sons de strum (timbres synthés Tone.js).
 *
 * Chaque timbre est une recette qui produit 6 synths (un par corde, polyphonie
 * monophonique par corde) + une chaîne d'effets optionnelle.
 *
 * ⚠️ Historique : la recette `karplus` initiale (PluckSynth pur) sonnait
 * dégueulasse — feedback Melvin "le seul son acceptable est Électrique clean".
 * Conséquence : `electric-clean` devient le default + toutes les recettes
 * PluckSynth ont été refondues (filter chain plus agressive, chorus, EQ
 * shaping, dispose chain propre).
 *
 * Le default `electric-clean` est marqué `recommended: true` pour qu'il
 * apparaisse en premier dans le picker Settings avec un badge dédié.
 */
import * as Tone from 'tone';

export type StrumSoundId =
  // Sampler CDN nbrosowsky + chaîne d'effets dédiée par preset
  | 'electric-real-sampled' // alias historique = clean sampled (session 18)
  | 'electric-crunch'       // AC30 crunch / blues solo
  | 'electric-lead'         // Marshall lead / Slash solo
  | 'electric-blues'        // Fender Twin / BB King
  | 'acoustic-warm'         // Sampler avec chaîne acoustique (LP + reverb)
  // Synthés legacy (fallback hors-ligne / différents timbres)
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
 * Liste ordonnée — `recommended` d'abord, puis les autres timbres par
 * caractère croissant (clair → chaud → drive).
 */
export const STRUM_SOUNDS: StrumSound[] = [
  {
    id: 'electric-real-sampled',
    label: 'Électrique clean 🎸',
    description: 'Sampler réel Fender clean — Compressor + LP + Chorus + reverb hall. Le default polyvalent.',
    tags: ['samples', 'clean', 'fender'],
    recommended: true,
  },
  {
    id: 'electric-crunch',
    label: 'Électrique crunch 🤘',
    description: 'AC30 crunch — WaveShaper soft + HP/LP + compressor. Pour les solos blues et la rythmique rock.',
    tags: ['samples', 'crunch', 'ac30'],
  },
  {
    id: 'electric-lead',
    label: 'Électrique Lead 🔥',
    description: 'Marshall stack lead — distortion hard + delay 1/4 + plate reverb. Solo "Slash".',
    tags: ['samples', 'distortion', 'marshall', 'solo'],
  },
  {
    id: 'electric-blues',
    label: 'Électrique blues 🎷',
    description: 'Fender Twin overdrive doux — tube sat + plate reverb longue. Vibe BB King / SRV.',
    tags: ['samples', 'blues', 'tube', 'twin'],
  },
  {
    id: 'acoustic-warm',
    label: 'Acoustique chaude 🪵',
    description: 'Sampler avec LP 7kHz + reverb hall — vibe studio acoustique. Pour ballades et arpèges.',
    tags: ['samples', 'acoustique', 'studio'],
  },
  {
    id: 'electric-clean',
    label: 'Électrique clean',
    description: 'Synthé cristallin — fallback si les samples ne chargent pas. Présent sans réseau.',
    tags: ['synthé', 'fallback', 'offline'],
  },
  {
    id: 'acoustic-steel',
    label: 'Acoustique steel',
    description: 'Steel-string chaud avec un peu de chorus — vibe Martin / Taylor pour les ballades.',
    tags: ['acoustique', 'chaud', 'ballade'],
  },
  {
    id: 'nylon-soft',
    label: 'Nylon douce',
    description: 'Classique nylon, attaque douce et médiums boisés. Pour la bossa et le jazz.',
    tags: ['classique', 'doux', 'bossa'],
  },
  {
    id: 'karplus',
    label: 'Pluck clair',
    description: 'Pluck synthétique brillant et léger. Pour les arpèges et le détail.',
    tags: ['pluck', 'clair', 'arpèges'],
  },
  {
    id: 'electric-drive',
    label: 'Électrique drive',
    description: 'Saturation subtile — pour rock léger et indie. Pas pour le métal.',
    tags: ['électrique', 'overdrive', 'rock'],
  },
];

export function getStrumSound(id: StrumSoundId): StrumSound {
  return STRUM_SOUNDS.find((s) => s.id === id) ?? STRUM_SOUNDS[0];
}

// ─── Recipes ───────────────────────────────────────────────────────────

/**
 * Construit 6 voix (un Synth + son nœud de sortie) pour le timbre donné.
 * Renvoie aussi un dispose() pour cleanup quand on switch de timbre.
 *
 * `output` est le nœud Tone vers lequel toutes les voix doivent envoyer
 * (généralement la reverb).
 */
export type SynthVoice = {
  trigger: (freqHz: number, duration: string, time: number, velocity: number) => void;
  dispose: () => void;
};

/**
 * WaveShaper curves pour les amp simulators.
 *
 * - soft : saturation tube douce via tanh — vibe AC30 / Twin
 * - hard : clipping plus agressif type Marshall lead — Slash solo
 */
function makeSoftClipCurve(amount: number, samples = 4096): Float32Array {
  const curve = new Float32Array(samples);
  const k = amount;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(k * x) / Math.tanh(k);
  }
  return curve;
}

function makeHardClipCurve(amount: number, samples = 4096): Float32Array {
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

/**
 * Crée un sampler partagé (samples nbrosowsky/tonejs-instruments CDN
 * public). Utilisé par les 5 presets sampler-based : electric clean,
 * crunch, lead, blues, acoustic-warm.
 *
 * release plus ou moins long selon le preset (lead = 1.8s pour le
 * sustain solo, clean = 1.2s, acoustic = 1.5s).
 */
function makeElectricSampler(release = 1.2): Tone.Sampler {
  const baseUrl =
    'https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-electric/';
  return new Tone.Sampler({
    urls: {
      A2: 'A2.mp3', C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
      A3: 'A3.mp3', C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
      A4: 'A4.mp3', C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
      A5: 'A5.mp3',
    },
    baseUrl,
    release,
  });
}

/**
 * Helper pour attacher un dispose() chain au premier voice — la convention
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

export function buildVoices(id: StrumSoundId, output: Tone.ToneAudioNode): SynthVoice[] {
  const voices: SynthVoice[] = [];
  const num = 6;

  switch (id) {
    // ─── Électrique CLEAN (sampler CDN + Compressor + LP + Chorus + Reverb) ─
    case 'electric-real-sampled': {
      // ID historique conservé pour backward compat — c'est le preset
      // "clean" du sampler. Compressor doux + LP 6kHz + chorus subtil
      // + reverb hall = vibe Fender Strat clean amp.
      const sampler = makeElectricSampler(1.3);
      const compressor = new Tone.Compressor({ ratio: 2, threshold: -18, attack: 0.005, release: 0.1 });
      const lp = new Tone.Filter({ frequency: 6000, type: 'lowpass', Q: 0.5 });
      const chorus = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.4, wet: 0.25 }).start();
      const reverb = new Tone.Reverb({ decay: 1.8, wet: 0.20 });
      void reverb.generate();

      sampler.chain(compressor, lp, chorus, reverb, output);

      for (let i = 0; i < num; i++) {
        voices.push({
          trigger: (f, d, t, v) => {
            if (!sampler.loaded) return;
            sampler.triggerAttackRelease(f, d, t, v * 0.9);
          },
          dispose: () => {},
        });
      }
      chainDispose(voices, [sampler, compressor, lp, chorus, reverb]);
      return voices;
    }

    // ─── Électrique CRUNCH (AC30 blues solo) ──────────────────────────
    case 'electric-crunch': {
      // Sampler → preGain → HP 100Hz → WaveShaper soft (tanh 8) →
      // LP 5kHz cab → compressor ratio 4 → small room reverb
      const sampler = makeElectricSampler(1.4);
      const preGain = new Tone.Gain(1.6);
      const hp = new Tone.Filter({ frequency: 100, type: 'highpass', Q: 0.3 });
      const shaper = new Tone.WaveShaper(makeSoftClipCurve(8));
      shaper.oversample = '4x';
      const lp = new Tone.Filter({ frequency: 5000, type: 'lowpass', Q: 0.7 });
      const compressor = new Tone.Compressor({ ratio: 4, threshold: -14, attack: 0.004, release: 0.08 });
      const reverb = new Tone.Reverb({ decay: 1.4, wet: 0.15 });
      void reverb.generate();

      sampler.chain(preGain, hp, shaper, lp, compressor, reverb, output);

      for (let i = 0; i < num; i++) {
        voices.push({
          trigger: (f, d, t, v) => {
            if (!sampler.loaded) return;
            sampler.triggerAttackRelease(f, d, t, v * 0.75);
          },
          dispose: () => {},
        });
      }
      chainDispose(voices, [sampler, preGain, hp, shaper, lp, compressor, reverb]);
      return voices;
    }

    // ─── Électrique LEAD (Marshall stack — solo Slash) ────────────────
    case 'electric-lead': {
      // Sampler → preGain 2.5 → HP 120Hz → WaveShaper hard (15) →
      // LP 4.5kHz mid-focused → compressor agressif → FeedbackDelay 1/4
      // → plate reverb decay 2.5
      const sampler = makeElectricSampler(1.8);
      const preGain = new Tone.Gain(2.5);
      const hp = new Tone.Filter({ frequency: 120, type: 'highpass', Q: 0.5 });
      const shaper = new Tone.WaveShaper(makeHardClipCurve(15));
      shaper.oversample = '4x';
      const lp = new Tone.Filter({ frequency: 4500, type: 'lowpass', Q: 1.0 });
      const compressor = new Tone.Compressor({ ratio: 6, threshold: -10, attack: 0.003, release: 0.1 });
      const delay = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.25, wet: 0.18 });
      const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.25 });
      void reverb.generate();

      sampler.chain(preGain, hp, shaper, lp, compressor, delay, reverb, output);

      for (let i = 0; i < num; i++) {
        voices.push({
          trigger: (f, d, t, v) => {
            if (!sampler.loaded) return;
            sampler.triggerAttackRelease(f, d, t, v * 0.55);
          },
          dispose: () => {},
        });
      }
      chainDispose(voices, [sampler, preGain, hp, shaper, lp, compressor, delay, reverb]);
      return voices;
    }

    // ─── Électrique BLUES (Fender Twin / BB King / SRV) ───────────────
    case 'electric-blues': {
      // Sampler → preGain modéré → HP 80Hz → WaveShaper soft asymétrique
      // (tube character) → LP 5.5kHz → léger chorus → plate reverb longue
      const sampler = makeElectricSampler(1.6);
      const preGain = new Tone.Gain(1.4);
      const hp = new Tone.Filter({ frequency: 80, type: 'highpass', Q: 0.3 });
      const shaper = new Tone.WaveShaper(makeSoftClipCurve(5));
      shaper.oversample = '4x';
      const lp = new Tone.Filter({ frequency: 5500, type: 'lowpass', Q: 0.6 });
      const chorus = new Tone.Chorus({ frequency: 1, delayTime: 3, depth: 0.3, wet: 0.15 }).start();
      const reverb = new Tone.Reverb({ decay: 3.0, wet: 0.30 });
      void reverb.generate();

      sampler.chain(preGain, hp, shaper, lp, chorus, reverb, output);

      for (let i = 0; i < num; i++) {
        voices.push({
          trigger: (f, d, t, v) => {
            if (!sampler.loaded) return;
            sampler.triggerAttackRelease(f, d, t, v * 0.8);
          },
          dispose: () => {},
        });
      }
      chainDispose(voices, [sampler, preGain, hp, shaper, lp, chorus, reverb]);
      return voices;
    }

    // ─── Acoustique chaude (sampler avec chaîne acoustique) ────────────
    case 'acoustic-warm': {
      // Sampler "électrique" filtré pour faire passer en acoustique :
      // LP 7kHz (élimine le brillant trop électrique) + reverb hall
      // décente. Pas de distortion. Petit boost médium.
      const sampler = makeElectricSampler(1.5);
      const lp = new Tone.Filter({ frequency: 7000, type: 'lowpass', Q: 0.5 });
      const eq = new Tone.EQ3({ low: 0, mid: 2, high: -3 });
      const reverb = new Tone.Reverb({ decay: 2.2, wet: 0.25 });
      void reverb.generate();

      sampler.chain(lp, eq, reverb, output);

      for (let i = 0; i < num; i++) {
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

    // ─── Électrique clean (DEFAULT, validé) ──────────────────────────
    case 'electric-clean': {
      // Saw + LP filter 4kHz + envelope plucky → cristallin et chaleureux.
      // Recette inchangée par rapport à l'original (validée par Melvin).
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 4000, Q: 0.6 });
      lp.connect(output);
      for (let i = 0; i < num; i++) {
        const s = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          // release 0.6 (vs 1.2 avant) : adouci pour la lisibilité en
          // progression / riff (le compressor master gère la dynamique)
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

    // ─── Acoustic steel — recette refondue ──────────────────────────
    case 'acoustic-steel': {
      // Approche : FMSynth (modulateur sinusoïdal, harmonics riches sur
      // l'attaque, sustain doux) + chorus stéréo léger + LP filter pour
      // adoucir + reverb implicite via output (qui a déjà la reverb master).
      // Beaucoup plus crédible qu'un PluckSynth pour du steel-string.
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

      for (let i = 0; i < num; i++) {
        const s = new Tone.FMSynth({
          harmonicity: 2.5,
          modulationIndex: 8,
          oscillator: { type: 'sine' },
          // release 0.7 (vs 1.6 avant) : raccourci pour éviter l'empilement
          // sur progressions / riffs en boucle (feedback session 16)
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

    // ─── Nylon soft — recette refondue ──────────────────────────────
    case 'nylon-soft': {
      // Triangle + LP basse + envelope très douce = corde nylon classique.
      // Pas de saw (trop brillant pour du nylon), pas de modulation FM
      // (trop synthétique). Triangle a un spectre riche en harmoniques
      // basses qui sied au nylon.
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 2400, Q: 0.6 });
      lp.connect(output);

      for (let i = 0; i < num; i++) {
        const s = new Tone.Synth({
          oscillator: { type: 'triangle' },
          // release 0.6 (vs 1.4 avant) : éviter le wash sur les patterns rapides
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

    // ─── Pluck clair — ex-karplus ───────────────────────────────────
    case 'karplus': {
      // On garde le caractère "pluck" via PluckSynth MAIS on adoucit
      // brutalement : attackNoise très bas (0.3 vs 1.2 avant), dampening
      // plus haut → pas de scratchy high-freq, LP filter ferme à 3.8kHz,
      // HP coupe le sub-rumble, et un peu de chorus pour donner de la
      // largeur stéréo. Résultat : ça ressemble vraiment à un pluck doux
      // plutôt qu'à un grain de café qui crame.
      const hp = new Tone.Filter({ type: 'highpass', frequency: 100, Q: 0.5 });
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 3800, Q: 0.4 });
      const chorus = new Tone.Chorus({ frequency: 0.8, delayTime: 2, depth: 0.2 }).start();
      hp.connect(chorus);
      chorus.connect(lp);
      lp.connect(output);

      for (let i = 0; i < num; i++) {
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

    // ─── Électrique drive — recette refondue ────────────────────────
    case 'electric-drive': {
      // Approche tube-style : sawtooth chaud + LP avant distortion (pour
      // éviter les harsh highs qui font mal aux oreilles) + Distortion
      // assez modeste (0.3 vs 0.45 avant) + LP post-distortion pour
      // dompter le tail. Velocity réduite pour pas saturer.
      const lpPre = new Tone.Filter({ type: 'lowpass', frequency: 4000, Q: 0.4 });
      const dist = new Tone.Distortion({ distortion: 0.3, wet: 0.6 });
      const lpPost = new Tone.Filter({ type: 'lowpass', frequency: 2800, Q: 0.5 });
      lpPre.connect(dist);
      dist.connect(lpPost);
      lpPost.connect(output);

      for (let i = 0; i < num; i++) {
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
      chainDispose(voices, [lpPre, dist, lpPost]);
      return voices;
    }
  }
}
