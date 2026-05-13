/**
 * Moteur audio basé sur Tone.js.
 * - 6 PluckSynth (un par corde) pour polyphonie correcte
 * - Reverb légère, master gain
 * - API : playNote(midi), playChordVoicing(frets, tuning), strum(frets, tuning, direction)
 */
import * as Tone from 'tone';
import { TUNINGS, midiToFreq, midiToNoteWithOctave, type TuningId } from './theory';

let initialized = false;
const synths: Tone.PluckSynth[] = [];
let reverb: Tone.Reverb | null = null;
let masterGain: Tone.Gain | null = null;

/**
 * Init audio. À appeler après une interaction utilisateur (politique navigateur).
 */
export async function initAudio(): Promise<void> {
  if (initialized) return;
  await Tone.start();

  masterGain = new Tone.Gain(0.65).toDestination();
  reverb = new Tone.Reverb({ decay: 2.2, wet: 0.25 });
  await reverb.generate();
  reverb.connect(masterGain);

  // 6 PluckSynth, un par corde (Tone.PluckSynth est monophonique)
  for (let i = 0; i < 6; i++) {
    const s = new Tone.PluckSynth({
      attackNoise: 1.2,
      dampening: 4200,
      resonance: 0.96,
    });
    s.connect(reverb);
    synths.push(s);
  }

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
 * Joue une seule note (MIDI) via le synth de la 1ère corde (utility / mélodie).
 */
export async function playNote(midi: number, duration = '2n', when?: number): Promise<void> {
  if (!initialized) await initAudio();
  const s = synths[0];
  if (!s) return;
  const time = when ?? Tone.now();
  s.triggerAttackRelease(midiToFreq(midi), duration, time);
}

/**
 * Joue un accord à partir des positions de frettes (low E → high E).
 */
export async function playChordVoicing(
  frets: Array<number | null>,
  tuning: TuningId = 'standard',
  capo = 0
): Promise<void> {
  if (!initialized) await initAudio();
  const openTuning = TUNINGS[tuning];
  const now = Tone.now();
  frets.forEach((f, i) => {
    if (f == null || f < 0) return;
    const midi = openTuning[i] + f + capo;
    synths[i]?.triggerAttackRelease(midiToFreq(midi), '2n', now, 0.8);
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
  if (!initialized) await initAudio();
  const openTuning = TUNINGS[tuning];
  const indices = direction === 'down' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
  let offset = 0;
  const now = Tone.now();
  indices.forEach((i) => {
    const f = frets[i];
    if (f == null || f < 0) return;
    const midi = openTuning[i] + f + capo;
    synths[i]?.triggerAttackRelease(midiToFreq(midi), '2n', now + offset / 1000, 0.78);
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
  if (!initialized) await initAudio();
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
