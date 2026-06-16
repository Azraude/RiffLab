/**
 * Moteur audio — V5 (session 21) : WebAudioFont GM presets.
 *
 * Plus de synthé / ampChain JS — on joue des samples GM SoundFont
 * pré-enregistrés via WebAudioFontPlayer. Chaque preset arrive avec
 * son caractère d'ampli déjà sur la waveform.
 *
 * Chaîne post-WAF (par preset) :
 *   WAF player → preset gain → LP filter (anti-fatigue) → reverb →
 *   master compressor → master gain → destination
 *
 * Le WebAudioFontPlayer écrit directement dans son destination AudioNode
 * (Web Audio natif), donc on utilise `Tone.getContext().rawContext` pour
 * partager le même AudioContext que Tone.js.
 */
import * as Tone from 'tone';
import {
  TUNINGS,
  midiToFreq,
  midiToNoteWithOctave,
  type TuningId,
} from './theory';
import {
  WAF_PRESETS,
  PRESET_FX,
  type StrumSoundId,
} from './strumSounds';
import { loadPreset, playWafNote } from './webAudioFont';

let initialized = false;
let activeTimbre: StrumSoundId = 'electric-clean';
let activePreset: unknown = null;
// Chaîne master partagée par tous les presets
let masterGain: Tone.Gain | null = null;
let masterCompressor: Tone.Compressor | null = null;
// Per-preset post-FX (recréés au switch)
let presetGain: Tone.Gain | null = null;
let presetLp: Tone.Filter | null = null;
let presetReverb: Tone.Reverb | null = null;

/**
 * Init audio. À appeler après une interaction utilisateur (policy navigateur).
 *
 * Chaîne :
 *   WAF queueWaveTable → presetGain → presetLp → presetReverb
 *   → masterCompressor → masterGain → destination
 */
export async function initAudio(
  timbre: StrumSoundId = 'electric-clean',
): Promise<void> {
  if (initialized) return;
  await Tone.start();

  masterGain = new Tone.Gain(0.65).toDestination();
  masterCompressor = new Tone.Compressor({
    threshold: -12,
    ratio: 3,
    attack: 0.005,
    release: 0.05,
    knee: 8,
  });
  masterCompressor.connect(masterGain);

  await buildPresetFxAndLoad(timbre);
  activeTimbre = timbre;
  initialized = true;
}

/**
 * Construit la chaîne post-FX pour `timbre` + load le preset WebAudioFont.
 * Idempotent côté load (cache dans webAudioFont.ts).
 */
async function buildPresetFxAndLoad(timbre: StrumSoundId): Promise<void> {
  if (!masterCompressor) return;
  // Dispose ancienne chaîne post-FX si présente
  disposeCurrentFx();

  const fx = PRESET_FX[timbre];
  presetGain = new Tone.Gain(1);
  presetReverb = new Tone.Reverb({ decay: fx.reverbDecay, wet: fx.reverbWet });
  void presetReverb.generate();

  if (fx.lpCutoff > 0) {
    presetLp = new Tone.Filter({
      type: 'lowpass',
      frequency: fx.lpCutoff,
      Q: 0.5,
    });
    presetGain.chain(presetLp, presetReverb, masterCompressor);
  } else {
    presetGain.chain(presetReverb, masterCompressor);
  }

  // Load le preset (lazy + cache CDN)
  try {
    const audioContext = Tone.getContext().rawContext as unknown as AudioContext;
    activePreset = await loadPreset(WAF_PRESETS[timbre], audioContext);
  } catch (err) {
    console.warn('[audio] WebAudioFont preset load failed:', err);
    activePreset = null;
  }
}

function disposeCurrentFx() {
  [presetGain, presetLp, presetReverb].forEach((n) => {
    if (!n) return;
    try {
      n.dispose();
    } catch {
      // ignore
    }
  });
  presetGain = null;
  presetLp = null;
  presetReverb = null;
}

export function isAudioReady(): boolean {
  return initialized;
}

export function setMasterVolume(value: number): void {
  if (!masterGain) return;
  masterGain.gain.rampTo(Math.max(0, Math.min(1, value)), 0.05);
}

/**
 * Switch le timbre actif. Async parce qu'on doit await le load du preset
 * WebAudioFont (1ère fois ~100-200ms, ensuite cache hit instant).
 */
export async function rebuildVoices(timbre: StrumSoundId): Promise<void> {
  if (!initialized) {
    activeTimbre = timbre;
    return;
  }
  if (timbre === activeTimbre) return;
  await buildPresetFxAndLoad(timbre);
  activeTimbre = timbre;
}

export function getActiveTimbre(): StrumSoundId {
  return activeTimbre;
}

/**
 * Trigger une note MIDI via le preset actif.
 * - Si preset pas encore loaded → silence (les samples arrivent async).
 * - Le `when` est en time absolu (Tone.now() ou Tone.context.currentTime).
 */
async function triggerMidi(
  midi: number,
  when?: number,
  duration?: number,
  volume = 0.7,
): Promise<void> {
  if (!initialized || !activePreset || !presetGain) return;
  const audioContext = Tone.getContext().rawContext as unknown as AudioContext;
  const destination = presetGain.input as unknown as AudioNode;
  const fx = PRESET_FX[activeTimbre];
  try {
    await playWafNote({
      audioContext,
      destination,
      preset: activePreset,
      midi,
      when: when ?? audioContext.currentTime,
      duration: duration ?? fx.noteDuration,
      volume: volume * fx.velocityScale,
    });
  } catch (err) {
    console.warn('[audio] triggerMidi failed:', err);
  }
}

/**
 * Joue une seule note MIDI (utility / mélodie).
 */
export async function playNote(
  midi: number,
  _duration = '2n',
  when?: number,
): Promise<void> {
  if (!initialized) await initAudio(activeTimbre);
  await triggerMidi(midi, when);
}

/**
 * Joue un accord à partir des positions de frettes (low E → high E).
 * Toutes les notes déclenchées en même temps (pas de spread).
 */
export async function playChordVoicing(
  frets: Array<number | null>,
  tuning: TuningId = 'standard',
  capo = 0,
): Promise<void> {
  if (!initialized) await initAudio(activeTimbre);
  const openTuning = TUNINGS[tuning];
  const audioContext = Tone.getContext().rawContext as unknown as AudioContext;
  const when = audioContext.currentTime;
  for (let i = 0; i < frets.length; i++) {
    const f = frets[i];
    if (f == null || f < 0) continue;
    const midi = openTuning[i] + f + capo;
    void triggerMidi(midi, when, undefined, 0.8);
  }
}

/**
 * Strum un accord : décale légèrement les notes pour simuler un balayage.
 */
export async function strumChord(
  frets: Array<number | null>,
  tuning: TuningId = 'standard',
  capo = 0,
  direction: 'down' | 'up' = 'down',
  spreadMs = 22,
): Promise<void> {
  if (!initialized) await initAudio(activeTimbre);
  const openTuning = TUNINGS[tuning];
  const indices = direction === 'down' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
  const audioContext = Tone.getContext().rawContext as unknown as AudioContext;
  const baseWhen = audioContext.currentTime;
  let offset = 0;
  for (const i of indices) {
    const f = frets[i];
    if (f == null || f < 0) continue;
    const midi = openTuning[i] + f + capo;
    void triggerMidi(midi, baseWhen + offset / 1000, undefined, 0.78);
    offset += spreadMs;
  }
}

/**
 * Métronome simple — un click MembraneSynth toujours dispo, indépendant
 * des presets WebAudioFont (le clic doit rester crisp quel que soit le
 * timbre).
 */
export async function startMetronome(
  bpm: number,
  onBeat?: (beat: number) => void,
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

export function setMetronomeBpm(bpm: number): void {
  Tone.Transport.bpm.value = bpm;
}

// Re-export utility
export { midiToFreq, midiToNoteWithOctave };
