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
    id: 'electric-clean',
    label: 'Électrique clean',
    description: 'Cristal et présent — le son le plus polyvalent, choisi par défaut. Marche partout.',
    tags: ['recommandé', 'clean', 'polyvalent'],
    recommended: true,
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
