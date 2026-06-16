/**
 * Moteur audio — V6 (session D, 2026-06-16) : Tone.Sampler HQ + fallback synth.
 *
 * Deux moteurs, choisis par `audioQuality` (pref user) :
 *
 *  - **studio** (default) : `Tone.Sampler` chargé sur de VRAIS samples de
 *    guitare (nbrosowsky/tonejs-instruments, MP3, CDN GitHub Pages). Chaque
 *    preset ajoute sa chaîne FX (distortion WaveShaper, EQ3, reverb, delay).
 *    Lazy-load : seul le pack du preset actif est fetché au boot, les autres
 *    arrivent à la demande au switch (~20 MB total si on charge tout).
 *
 *  - **synth** : pool de `Tone.PluckSynth` (Karplus-Strong). Léger, marche
 *    offline immédiat, zéro fetch. Sert aussi de **fallback gracieux** si le
 *    chargement des samples échoue (offline / CDN down).
 *
 * Chaîne master partagée :
 *   [studio FX | synth pool] → masterCompressor → masterGain → destination
 *
 * Switch de preset ou de qualité = `rebuildVoices` / `setAudioQuality`,
 * idempotents et non-bloquants côté UI (le load est awaité en interne).
 */
import * as Tone from 'tone';
import {
  TUNINGS,
  midiToFreq,
  midiToNoteWithOctave,
  type TuningId,
} from './theory';
import {
  SAMPLE_PACKS,
  PRESET_CONFIG,
  getStrumSound,
  type StrumSoundId,
  type SamplePackId,
} from './strumSounds';

export type AudioQuality = 'studio' | 'synth';

// ─── État module ─────────────────────────────────────────────────────
let initialized = false;
let activeTimbre: StrumSoundId = 'electric-clean';
let activeQuality: AudioQuality = 'studio';

// Chaîne master (partagée studio + synth)
let masterGain: Tone.Gain | null = null;
let masterCompressor: Tone.Compressor | null = null;

// ── Moteur studio (sampler + FX) ──
/** Samplers cachés par pack — un seul fetch réseau par pack de samples. */
const samplerPromises = new Map<SamplePackId, Promise<Tone.Sampler>>();
/** Packs dont les samples sont entièrement chargés (pour décider du toast). */
const loadedPacks = new Set<SamplePackId>();
let activeSampler: Tone.Sampler | null = null;
let studioReady = false; // le sampler du preset actif est chargé
// FX du preset actif (recréés à chaque switch)
let fxDistortion: Tone.Distortion | null = null;
let fxEq: Tone.EQ3 | null = null;
let fxReverb: Tone.Reverb | null = null;
let fxDelay: Tone.FeedbackDelay | null = null;

// ── Moteur synth (fallback / mode léger) ──
const PLUCK_POLYPHONY = 6; // 6 cordes → round-robin
let pluckPool: Tone.PluckSynth[] = [];
let pluckIdx = 0;
let synthReverb: Tone.Reverb | null = null;

// ─── Reporter de statut (toast injecté depuis la couche React) ───────
export type AudioStatus = 'loading' | 'ready' | 'fallback';
type StatusReporter = (status: AudioStatus, presetLabel: string) => void;
let statusReporter: StatusReporter | null = null;

/**
 * Enregistre le reporter de statut (utilisé par useAudio pour afficher les
 * toasts « Chargement du son… » / « Mode synthèse activé »). Identity-guarded :
 * on ne clear que si le reporter courant est bien le nôtre, pour survivre aux
 * multiples montages/démontages de useAudio.
 */
export function setAudioStatusReporter(fn: StatusReporter | null): void {
  if (fn === null) return; // clear explicite via clearAudioStatusReporter
  statusReporter = fn;
}
export function clearAudioStatusReporter(fn: StatusReporter): void {
  if (statusReporter === fn) statusReporter = null;
}

function report(status: AudioStatus, timbre: StrumSoundId) {
  try {
    statusReporter?.(status, getStrumSound(timbre).label);
  } catch {
    // un toast qui plante ne doit jamais casser l'audio
  }
}

// ─── Init ────────────────────────────────────────────────────────────
/**
 * Init audio. À appeler après une interaction utilisateur (policy navigateur).
 */
export async function initAudio(
  timbre: StrumSoundId = 'electric-clean',
  quality: AudioQuality = 'studio',
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

  // Le moteur synth est toujours prêt (fallback instantané + mode léger).
  buildSynthEngine();

  activeTimbre = timbre;
  activeQuality = quality;
  initialized = true;

  // En mode studio, on lance le build du preset (lazy load des samples).
  if (quality === 'studio') {
    await buildStudioPreset(timbre);
  }
}

export function isAudioReady(): boolean {
  return initialized;
}

export function setMasterVolume(value: number): void {
  if (!masterGain) return;
  masterGain.gain.rampTo(Math.max(0, Math.min(1, value)), 0.05);
}

// ─── Moteur synth (PluckSynth pool) ──────────────────────────────────
function buildSynthEngine() {
  if (!masterCompressor || pluckPool.length) return;
  synthReverb = new Tone.Reverb({ decay: 1.4, wet: 0.14 });
  void synthReverb.generate();
  synthReverb.connect(masterCompressor);
  pluckPool = Array.from({ length: PLUCK_POLYPHONY }, () => {
    const p = new Tone.PluckSynth({
      attackNoise: 1,
      dampening: 4000,
      resonance: 0.92,
    });
    p.volume.value = -6;
    p.connect(synthReverb!);
    return p;
  });
}

function triggerSynth(midi: number, when: number) {
  if (!pluckPool.length) return;
  const v = pluckPool[pluckIdx % pluckPool.length];
  pluckIdx = (pluckIdx + 1) % pluckPool.length;
  try {
    v.triggerAttack(midiToFreq(midi), when);
  } catch {
    // ignore (note hors range / timing)
  }
}

// ─── Moteur studio (Tone.Sampler + FX) ───────────────────────────────
/**
 * Charge (ou récupère du cache) le sampler d'un pack. La promesse résout
 * quand TOUS les samples MP3 sont chargés. En cas d'échec réseau, la
 * promesse rejette → buildStudioPreset bascule en fallback synth.
 */
function loadSampler(pack: SamplePackId, release: number): Promise<Tone.Sampler> {
  const cached = samplerPromises.get(pack);
  if (cached) return cached;
  const spec = SAMPLE_PACKS[pack];
  const p = new Promise<Tone.Sampler>((resolve, reject) => {
    let settled = false;
    const sampler = new Tone.Sampler({
      urls: spec.urls,
      baseUrl: spec.baseUrl,
      release,
      onload: () => {
        if (settled) return;
        settled = true;
        loadedPacks.add(pack);
        resolve(sampler);
      },
      onerror: (err) => {
        if (settled) return;
        settled = true;
        reject(err);
      },
    });
    // Garde-fou : si ni onload ni onerror ne se déclenchent (CDN qui hang),
    // on rejette au bout de 12s pour ne pas laisser l'UI sans son.
    window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`Sampler load timeout for pack ${pack}`));
    }, 12_000);
  });
  // On ne cache QUE les promesses qui aboutissent : un échec doit pouvoir
  // être re-tenté (ex. l'user repasse online).
  p.catch(() => samplerPromises.delete(pack));
  samplerPromises.set(pack, p);
  return p;
}

function disposeStudioFx() {
  [fxDistortion, fxEq, fxDelay, fxReverb].forEach((n) => {
    try {
      n?.dispose();
    } catch {
      // ignore
    }
  });
  fxDistortion = null;
  fxEq = null;
  fxReverb = null;
  fxDelay = null;
}

/**
 * Construit la chaîne FX du preset + branche le sampler dessus.
 * Lazy : déclenche le load du pack si pas encore chargé. Si le load échoue,
 * `studioReady` reste false → triggerMidi tombe sur le synth (fallback) et
 * on signale le mode dégradé via le reporter.
 */
async function buildStudioPreset(timbre: StrumSoundId): Promise<void> {
  if (!masterCompressor) return;
  const master = masterCompressor;
  const cfg = PRESET_CONFIG[timbre];

  // 1) Chaîne FX (Sampler → [Distortion] → EQ3 → [Delay] → Reverb → master)
  disposeStudioFx();
  const eq = new Tone.EQ3({ low: cfg.eq.low, mid: cfg.eq.mid, high: cfg.eq.high });
  const reverb = new Tone.Reverb({ decay: cfg.reverbDecay, wet: cfg.reverbWet });
  void reverb.generate();
  fxEq = eq;
  fxReverb = reverb;

  const tail: Tone.ToneAudioNode[] = [];
  if (cfg.delayWet > 0) {
    fxDelay = new Tone.FeedbackDelay({
      delayTime: cfg.delayTime,
      feedback: cfg.delayFeedback,
      wet: cfg.delayWet,
    });
    tail.push(fxDelay);
  }
  tail.push(reverb, master);

  let head: Tone.ToneAudioNode = eq;
  if (cfg.distortion > 0) {
    const dist = new Tone.Distortion({ distortion: cfg.distortion, wet: 1 });
    fxDistortion = dist;
    dist.connect(eq);
    head = dist;
  }
  // chaîne EQ → [Delay] → Reverb → master
  eq.chain(...tail);

  // 2) Sampler (lazy). On signale le chargement seulement si le pack n'est
  //    pas déjà en cache (sinon switch instantané, pas de toast).
  studioReady = false;
  const firstLoad = !loadedPacks.has(cfg.pack) && !samplerPromises.has(cfg.pack);
  if (firstLoad) report('loading', timbre);

  try {
    const sampler = await loadSampler(cfg.pack, cfg.release);
    // Le preset a pu changer pendant l'await → ne câble que si on est encore
    // sur ce preset (sinon un autre buildStudioPreset a pris la main).
    if (activeTimbre !== timbre || !fxEq) return;
    sampler.disconnect();
    sampler.connect(head);
    sampler.volume.value = cfg.volumeDb;
    sampler.release = cfg.release;
    activeSampler = sampler;
    studioReady = true;
    if (firstLoad) report('ready', timbre);
  } catch (err) {
    console.warn('[audio] sampler load failed → fallback synth:', err);
    activeSampler = null;
    studioReady = false;
    report('fallback', timbre);
  }
}

// ─── Switch preset / qualité ─────────────────────────────────────────
/**
 * Switch le timbre actif. Non-bloquant côté UI (await interne du load).
 */
export async function rebuildVoices(timbre: StrumSoundId): Promise<void> {
  activeTimbre = timbre;
  if (!initialized) return;
  if (activeQuality === 'studio') {
    await buildStudioPreset(timbre);
  }
}

/**
 * Hot-swap de la qualité audio (studio ↔ synth). En passant à studio, on
 * (re)charge le preset actif ; en passant à synth, le sampler reste caché
 * mais on ignore juste son output (triggerMidi route vers le synth).
 */
export async function setAudioQuality(quality: AudioQuality): Promise<void> {
  activeQuality = quality;
  if (!initialized) return;
  if (quality === 'studio') {
    await buildStudioPreset(activeTimbre);
  }
}

export function getActiveTimbre(): StrumSoundId {
  return activeTimbre;
}
export function getActiveQuality(): AudioQuality {
  return activeQuality;
}

// ─── Trigger ─────────────────────────────────────────────────────────
/**
 * Trigger une note MIDI via le moteur actif (studio si dispo, sinon synth).
 * `when` est en time absolu (audioContext.currentTime).
 */
function triggerMidi(
  midi: number,
  when: number,
  duration?: number,
  velocity = 0.8,
): void {
  const cfg = PRESET_CONFIG[activeTimbre];
  const useStudio =
    activeQuality === 'studio' && studioReady && activeSampler !== null;
  if (useStudio) {
    try {
      activeSampler!.triggerAttackRelease(
        midiToNoteWithOctave(midi),
        duration ?? cfg.noteDuration,
        when,
        Math.max(0, Math.min(1, velocity * cfg.velocityScale)),
      );
      return;
    } catch (err) {
      console.warn('[audio] studio trigger failed, fallback synth:', err);
    }
  }
  triggerSynth(midi, when);
}

function now(): number {
  return (Tone.getContext().rawContext as unknown as AudioContext).currentTime;
}

/**
 * Joue une seule note MIDI (utility / mélodie / ear training).
 */
export async function playNote(
  midi: number,
  _duration = '2n',
  when?: number,
): Promise<void> {
  if (!initialized) await initAudio(activeTimbre, activeQuality);
  triggerMidi(midi, when ?? now());
}

/**
 * Joue un accord à partir des positions de frettes (low E → high E).
 * Toutes les notes en même temps (pas de spread).
 */
export async function playChordVoicing(
  frets: Array<number | null>,
  tuning: TuningId = 'standard',
  capo = 0,
): Promise<void> {
  if (!initialized) await initAudio(activeTimbre, activeQuality);
  const openTuning = TUNINGS[tuning];
  const when = now();
  for (let i = 0; i < frets.length; i++) {
    const f = frets[i];
    if (f == null || f < 0) continue;
    triggerMidi(openTuning[i] + f + capo, when, undefined, 0.8);
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
  if (!initialized) await initAudio(activeTimbre, activeQuality);
  const openTuning = TUNINGS[tuning];
  const indices = direction === 'down' ? [0, 1, 2, 3, 4, 5] : [5, 4, 3, 2, 1, 0];
  const baseWhen = now();
  let offset = 0;
  for (const i of indices) {
    const f = frets[i];
    if (f == null || f < 0) continue;
    triggerMidi(openTuning[i] + f + capo, baseWhen + offset / 1000, undefined, 0.78);
    offset += spreadMs;
  }
}

// ─── Voie B : lecture d'un enregistrement audio réel par riff ─────────
/**
 * Riff jouable — on type structurellement (`audio_url` optionnel) pour ne
 * pas coupler audio.ts à communityRiffs.ts.
 */
export type PlayableRiff = {
  audio_url?: string | null;
};

/**
 * Lecture d'un riff (préparation Voie B). Si le riff a un `audio_url`, on
 * charge et joue le vrai fichier MP3/Opus via `Tone.Player` et on retourne
 * le player (le caller — Session B — gère stop/dispose). Sinon retourne null :
 * Session B garde sa lecture note-à-note via les samplers de presets.
 */
export async function playRiff(riff: PlayableRiff): Promise<Tone.Player | null> {
  if (!initialized) await initAudio(activeTimbre, activeQuality);
  if (!riff.audio_url) return null;
  const player = new Tone.Player({ url: riff.audio_url, autostart: false }).toDestination();
  try {
    await Tone.loaded();
    player.start();
    return player;
  } catch (err) {
    console.warn('[audio] playRiff audio_url load failed:', err);
    player.dispose();
    return null;
  }
}

// ─── Métronome ───────────────────────────────────────────────────────
/**
 * Métronome simple — un click MembraneSynth toujours dispo, indépendant des
 * presets (le clic doit rester crisp quel que soit le timbre / la qualité).
 */
export async function startMetronome(
  bpm: number,
  onBeat?: (beat: number) => void,
): Promise<() => void> {
  if (!initialized) await initAudio(activeTimbre, activeQuality);
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
