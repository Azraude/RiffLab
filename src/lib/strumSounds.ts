/**
 * Catalogue des sons de strum (timbres synthés Tone.js).
 *
 * Chaque timbre est une recette qui produit 6 synths (un par corde, polyphonie
 * monophonique par corde) + une chaîne d'effets optionnelle.
 *
 * Les recettes sont construites à la demande dans `audio.ts` via `buildSynths`.
 */
import * as Tone from 'tone';

export type StrumSoundId =
  | 'karplus'
  | 'acoustic-steel'
  | 'nylon-soft'
  | 'electric-clean'
  | 'electric-drive';

export type StrumSound = {
  id: StrumSoundId;
  label: string;
  description: string;
  /** Caractère sonore en mots-clés (chips affichées dans le picker). */
  tags: string[];
  /** Marqueur premium (cosmetics shop Phase 5). */
  premium?: boolean;
};

export const STRUM_SOUNDS: StrumSound[] = [
  {
    id: 'karplus',
    label: 'Karplus standard',
    description: 'Le pluck par défaut — léger, brillant, ne gêne pas le travail.',
    tags: ['default', 'clair'],
  },
  {
    id: 'acoustic-steel',
    label: 'Acoustique cordée',
    description: 'Steel-string warm, sustain plus long, vibe Martin/Taylor.',
    tags: ['acoustique', 'chaud'],
  },
  {
    id: 'nylon-soft',
    label: 'Nylon douce',
    description: 'Classique nylon, attaque douce et tons médiums. Pour la bossa.',
    tags: ['classique', 'doux'],
  },
  {
    id: 'electric-clean',
    label: 'Électrique clean',
    description: 'Strat clean polysynth — son cristallin, sustain modéré.',
    tags: ['électrique', 'clean'],
  },
  {
    id: 'electric-drive',
    label: 'Électrique drive',
    description: 'Avec distortion subtile. Pour le rock léger, pas pour le métal.',
    tags: ['électrique', 'overdrive'],
  },
];

export function getStrumSound(id: StrumSoundId): StrumSound {
  return STRUM_SOUNDS.find((s) => s.id === id) ?? STRUM_SOUNDS[0];
}

// ─── Recipes ───────────────────────────────────────────────────────────

/**
 * Construit 6 voix (un Synth + son nœud de sortie) pour le timbre donné.
 * Renvoie aussi un dispose() pour cleanup quand on switch.
 *
 * `output` est le nœud Tone vers lequel toutes les voix doivent envoyer
 * (généralement la reverb).
 */
export type SynthVoice = {
  trigger: (freqHz: number, duration: string, time: number, velocity: number) => void;
  dispose: () => void;
};

export function buildVoices(id: StrumSoundId, output: Tone.ToneAudioNode): SynthVoice[] {
  const voices: SynthVoice[] = [];
  const num = 6;

  switch (id) {
    case 'karplus': {
      for (let i = 0; i < num; i++) {
        const s = new Tone.PluckSynth({
          attackNoise: 1.2,
          dampening: 4200,
          resonance: 0.96,
        });
        s.connect(output);
        voices.push({
          trigger: (f, d, t, v) => s.triggerAttackRelease(f, d, t, v),
          dispose: () => s.dispose(),
        });
      }
      return voices;
    }

    case 'acoustic-steel': {
      // PluckSynth chaud + lowpass autour de 5kHz pour adoucir, gain léger boost
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 5200, Q: 0.5 });
      lp.connect(output);
      for (let i = 0; i < num; i++) {
        const s = new Tone.PluckSynth({
          attackNoise: 0.8,
          dampening: 3200,
          resonance: 0.985, // plus de sustain
        });
        s.connect(lp);
        voices.push({
          trigger: (f, d, t, v) => s.triggerAttackRelease(f, d, t, v * 0.95),
          dispose: () => s.dispose(),
        });
      }
      voices[0].dispose = (() => {
        const orig = voices[0].dispose;
        return () => {
          orig();
          lp.dispose();
        };
      })();
      return voices;
    }

    case 'nylon-soft': {
      // PluckSynth + lowpass plus bas + un peu moins de bruit d'attaque
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 3200, Q: 0.7 });
      lp.connect(output);
      for (let i = 0; i < num; i++) {
        const s = new Tone.PluckSynth({
          attackNoise: 0.4,
          dampening: 2400,
          resonance: 0.94,
        });
        s.connect(lp);
        voices.push({
          trigger: (f, d, t, v) => s.triggerAttackRelease(f, d, t, v * 0.9),
          dispose: () => s.dispose(),
        });
      }
      voices[0].dispose = (() => {
        const orig = voices[0].dispose;
        return () => {
          orig();
          lp.dispose();
        };
      })();
      return voices;
    }

    case 'electric-clean': {
      // Synth sawtooth + lowpass dynamique pour simuler chorus/clarté
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 4000, Q: 0.6 });
      lp.connect(output);
      for (let i = 0; i < num; i++) {
        const s = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          envelope: {
            attack: 0.005,
            decay: 0.3,
            sustain: 0.15,
            release: 1.2,
          },
        });
        s.connect(lp);
        voices.push({
          trigger: (f, d, t, v) => s.triggerAttackRelease(f, d, t, v * 0.4),
          dispose: () => s.dispose(),
        });
      }
      voices[0].dispose = (() => {
        const orig = voices[0].dispose;
        return () => {
          orig();
          lp.dispose();
        };
      })();
      return voices;
    }

    case 'electric-drive': {
      // Sawtooth + distortion + lowpass coupé pour ne pas être agressif
      const dist = new Tone.Distortion({ distortion: 0.45, wet: 0.55 });
      const lp = new Tone.Filter({ type: 'lowpass', frequency: 3200, Q: 0.5 });
      dist.connect(lp);
      lp.connect(output);
      for (let i = 0; i < num; i++) {
        const s = new Tone.Synth({
          oscillator: { type: 'sawtooth' },
          envelope: {
            attack: 0.004,
            decay: 0.25,
            sustain: 0.3,
            release: 0.8,
          },
        });
        s.connect(dist);
        voices.push({
          trigger: (f, d, t, v) => s.triggerAttackRelease(f, d, t, v * 0.32),
          dispose: () => s.dispose(),
        });
      }
      voices[0].dispose = (() => {
        const orig = voices[0].dispose;
        return () => {
          orig();
          dist.dispose();
          lp.dispose();
        };
      })();
      return voices;
    }
  }
}
