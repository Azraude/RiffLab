/**
 * YIN pitch detection — version compacte et fiable pour signal mono.
 *
 * Réf : de Cheveigné & Kawahara (2002), "YIN, a fundamental frequency
 * estimator for speech and music". L'algo a 6 étapes ; on implémente
 * 1-5 (étape 6 "best local estimate" est superflue pour notre cas).
 *
 * Pourquoi YIN plutôt qu'un simple FFT/autocorr :
 *  - Robuste aux overtones (gestion du "first dip below threshold")
 *  - Précision sub-buffer via interpolation parabolique
 *  - Excellent sur les fréquences guitare (E2=82Hz → E5=659Hz)
 *
 * Coût : O(W² / 2) où W = buffer.length. Pour W=2048 ça reste largement
 * temps-réel sur tout device récent.
 */

const DEFAULT_THRESHOLD = 0.15;

export type PitchResult = {
  /** Frequency in Hz, ou null si confidence insuffisante. */
  frequency: number | null;
  /** Probability (0-1) de l'estimation. 0 = aléatoire, 1 = certain. */
  probability: number;
};

export class PitchDetector {
  private readonly bufferSize: number;
  private readonly sampleRate: number;
  private readonly threshold: number;
  private readonly yinBuffer: Float32Array;

  constructor(
    bufferSize: number,
    sampleRate: number,
    threshold: number = DEFAULT_THRESHOLD
  ) {
    this.bufferSize = bufferSize;
    this.sampleRate = sampleRate;
    this.threshold = threshold;
    // YIN n'utilise que la moitié du buffer pour les tau candidats
    this.yinBuffer = new Float32Array(bufferSize / 2);
  }

  /**
   * Détecte la fondamentale dans un buffer mono.
   * @param input — samples bruts (Float32, typiquement -1 à 1)
   * @returns { frequency, probability } ou frequency=null si pas confiant.
   */
  detect(input: Float32Array): PitchResult {
    if (input.length < this.bufferSize) {
      return { frequency: null, probability: 0 };
    }

    // Étape 1 : Difference function
    // d_t(τ) = Σ (x[j] - x[j+τ])² pour j de 0 à W/2
    const yin = this.yinBuffer;
    const W = this.bufferSize;
    const halfW = W / 2;
    for (let tau = 0; tau < halfW; tau++) {
      let sum = 0;
      for (let j = 0; j < halfW; j++) {
        const delta = input[j] - input[j + tau];
        sum += delta * delta;
      }
      yin[tau] = sum;
    }

    // Étape 2 : Cumulative mean normalized difference
    // d'_t(τ) = d_t(τ) / [ (1/τ) * Σ d_t(j) pour j=1..τ ]
    yin[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau < halfW; tau++) {
      runningSum += yin[tau];
      yin[tau] = (yin[tau] * tau) / runningSum;
    }

    // Étape 3 : Absolute threshold
    // On cherche le premier tau où yin[tau] < threshold, ET on continue
    // tant que yin[tau+1] décroît (chercher le minimum local après le seuil).
    let tau = -1;
    for (let t = 2; t < halfW; t++) {
      if (yin[t] < this.threshold) {
        while (t + 1 < halfW && yin[t + 1] < yin[t]) t++;
        tau = t;
        break;
      }
    }

    // Si aucun tau ne passe le threshold : pas confiant.
    if (tau === -1) {
      return { frequency: null, probability: 0 };
    }

    // Étape 4 : Parabolic interpolation autour du minimum trouvé
    // Améliore la précision (sub-sample) en interpolant les 3 valeurs.
    const refinedTau = this.parabolicInterpolation(yin, tau);

    // Étape 5 : Conversion tau → fréquence
    const frequency = this.sampleRate / refinedTau;

    // Probabilité estimée à partir de la valeur yin[tau] (plus elle est
    // basse, plus on est confiant). Clamp 0-1.
    const probability = Math.max(0, Math.min(1, 1 - yin[tau]));

    return { frequency, probability };
  }

  /**
   * Interpolation parabolique entre 3 points pour affiner le minimum.
   * Si tau est aux bornes, on retourne tau tel quel.
   */
  private parabolicInterpolation(yin: Float32Array, tau: number): number {
    if (tau <= 0 || tau >= yin.length - 1) return tau;
    const s0 = yin[tau - 1];
    const s1 = yin[tau];
    const s2 = yin[tau + 1];
    const denom = 2 * (2 * s1 - s2 - s0);
    if (denom === 0) return tau;
    return tau + (s2 - s0) / denom;
  }
}

// ─── Helpers note/octave ──────────────────────────────────────────

const A4_FREQ = 440;
const A4_MIDI = 69;

/**
 * Convertit une fréquence Hz → numéro MIDI flottant.
 * Ex : 440 Hz → 69.0, 466.16 Hz → 70.0 (A#4).
 */
export function freqToMidiFloat(freq: number): number {
  return A4_MIDI + 12 * Math.log2(freq / A4_FREQ);
}

/**
 * Décompose une fréquence en (midi entier le plus proche, cents off).
 *   - midi : 0-127, la note "cible" la plus proche
 *   - cents : -50 à +50, écart vs cette note (négatif = bémol, positif = dièse)
 */
export function freqToMidiAndCents(freq: number): { midi: number; cents: number } {
  const exact = freqToMidiFloat(freq);
  const midi = Math.round(exact);
  const cents = Math.round((exact - midi) * 100);
  return { midi, cents };
}

/** Inverse : midi entier → fréquence cible exacte */
export function midiToFreq(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}
