/**
 * Moteur audio basé sur Tone.js.
 * - 6 voix (un Synth par corde) construites via la recette du timbre actif.
 * - Reverb légère, master gain.
 * - API : playNote(midi), playChordVoicing(frets, tuning), strum(frets, tuning, direction).
 * - rebuildVoices(timbreId) pour switcher de timbre à chaud.
 */
import * as Tone from 'tone';
import { TUNINGS, midiToFreq, midiToNoteWithOctave, type TuningId } from './theory';
import { buildVoices, type StrumSoundId, type SynthVoice } from './strumSounds';
import { prewarmCabinets } from './ampChain';

let initialized = false;
let voices: SynthVoice[] = [];
let activeTimbre: StrumSoundId = 'electric-real-sampled';
let reverb: Tone.Reverb | null = null;
let masterGain: Tone.Gain | null = null;
let masterCompressor: Tone.Compressor | null = null;
let masterLowpass: Tone.Filter | null = null;

/**
 * Init audio. À appeler après une interaction utilisateur (politique navigateur).
 *
 * Chaîne de sortie (session 16 polish) :
 *   voices → reverb → lowpass → compressor → masterGain → destination
 * - Lowpass 8kHz : adoucit les harmoniques aigues qui font "métallique"
 *   et fatiguent l'oreille sur les sessions longues
 * - Compressor (-12 dB threshold, ratio 4) : maîtrise les pics quand
 *   plusieurs strums s'empilent (chord progressions / riffs en boucle)
 */
export async function initAudio(timbre: StrumSoundId = 'electric-real-sampled'): Promise<void> {
  if (initialized) return;
  await Tone.start();

  masterGain = new Tone.Gain(0.65).toDestination();
  masterCompressor = new Tone.Compressor({
    threshold: -12,
    ratio: 4,
    attack: 0.005,
    release: 0.05,
    knee: 8,
  });
  masterCompressor.connect(masterGain);
  masterLowpass = new Tone.Filter({ type: 'lowpass', frequency: 8000, Q: 0.5 });
  masterLowpass.connect(masterCompressor);
  // Reverb : decay 1.6 (au lieu de 2.2) + wet 0.18 (au lieu de 0.25)
  // pour éviter l'effet "cafouilli" quand les strums s'empilent en
  // progression ou en riff rapide (feedback session 16).
  reverb = new Tone.Reverb({ decay: 1.6, wet: 0.18 });
  await reverb.generate();
  reverb.connect(masterLowpass);

  // Pre-warm les IRs cabinet en parallèle — évite le pluck silencieux
  // au premier strum quand l'utilisateur sélectionne un preset ampChain.
  // Fire-and-forget : si ça échoue (browser ancien sans OfflineAudioContext),
  // le Convolver tombe en silence inoffensif.
  void prewarmCabinets();

  activeTimbre = timbre;
  voices = buildVoices(timbre, reverb);

  initialized = true;
}

export function isAudioReady(): boolean {
  return initialized;
}

export function setMasterVolume(value: number): void {
  if (!masterGain) return;
  masterGain.gain.rampTo(Math.max(0, Math.min(1, value)), 0.05);
}

/**
 * Switch le timbre actif. Dispose les voix actuelles et rebuild avec la
 * nouvelle recette. No-op si l'audio n'est pas encore init (le timbre sera
 * lu au prochain initAudio).
 */
export function rebuildVoices(timbre: StrumSoundId): void {
  if (!initialized || !reverb) {
    activeTimbre = timbre;
    return;
  }
  if (timbre === activeTimbre) return;
  // Dispose en différé pour laisser les notes en cours finir leur release.
  const oldVoices = voices;
  setTimeout(() => {
    oldVoices.forEach((v) => {
      try {
        v.dispose();
      } catch {
        // ignore
      }
    });
  }, 1500);
  voices = buildVoices(timbre, reverb);
  activeTimbre = timbre;
}

export function getActiveTimbre(): StrumSoundId {
  return activeTimbre;
}

/**
 * Joue une seule note (MIDI) via la 1ère voix (utility / mélodie).
 */
export async function playNote(midi: number, duration = '2n', when?: number): Promise<void> {
  if (!initialized) await initAudio(activeTimbre);
  const v = voices[0];
  if (!v) return;
  const time = when ?? Tone.now();
  v.trigger(midiToFreq(midi), duration, time, 0.8);
}

/**
 * Joue un accord à partir des positions de frettes (low E → high E).
 */
export async function playChordVoicing(
  frets: Array<number | null>,
  tuning: TuningId = 'standard',
  capo = 0
): Promise<void> {
  if (!initialized) await initAudio(activeTimbre);
  const openTuning = TUNINGS[tuning];
  const now = Tone.now();
  frets.forEach((f, i) => {
    if (f == null || f < 0) return;
    const midi = openTuning[i] + f + capo;
    voices[i]?.trigger(midiToFreq(midi), '2n', now, 0.8);
  });
}

/**
 * Strum un accord : décale légèrement les notes pour simuler un balayage.
 */
export async function strumChord(
  frets: Array<number | null>,
  tuning: TuningId = 'standard',
  capo = 0,
  direction: 'down' | 'up' = 'down',
  spreadMs = 22
): Promise<void> {
  if (!initialized) await initAudio(activeTimbre);
  const openTuning = TUNINGS[tuning];
  const indices = direction === 'down' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
  let offset = 0;
  const now = Tone.now();
  indices.forEach((i) => {
    const f = frets[i];
    if (f == null || f < 0) return;
    const midi = openTuning[i] + f + capo;
    voices[i]?.trigger(midiToFreq(midi), '2n', now + offset / 1000, 0.78);
    offset += spreadMs;
  });
}

/**
 * Métronome simple : tick à intervalle régulier.
 * Renvoie une fonction stop().
 */
export async function startMetronome(
  bpm: number,
  onBeat?: (beat: number) => void
): Promise<() => void> {
  if (!initialized) await initAudio(activeTimbre);
  Tone.Transport.bpm.value = bpm;

  let beat = 0;
  const click = new Tone.MembraneSynth({
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.05 },
  }).toDestination();
  click.volume.value = -10;

  const loop = new Tone.Loop((time: number) => {
    const accent = beat % 4 === 0;
    click.triggerAttackRelease(accent ? 'C5' : 'C4', '32n', time);
    onBeat?.(beat);
    beat++;
  }, '4n').start(0);

  Tone.Transport.start();

  return () => {
    loop.stop();
    loop.dispose();
    click.dispose();
    Tone.Transport.stop();
    Tone.Transport.cancel();
  };
}

/**
 * Met à jour le BPM du métronome en cours sans relancer le loop.
 * Tone.Transport.bpm est un Signal, le Loop pickup la nouvelle valeur au
 * prochain tick.
 */
export function setMetronomeBpm(bpm: number): void {
  Tone.Transport.bpm.value = bpm;
}

// Re-export for convenience
export { midiToNoteWithOctave };
