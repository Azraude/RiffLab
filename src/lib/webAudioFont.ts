/**
 * WebAudioFont loader — script injection pour les samples GM SoundFont.
 *
 * Pourquoi cette approche : WebAudioFont distribue ses presets comme
 * des fichiers .js qui définissent un global `_tone_<filename>`. Pas
 * d'ES module, pas de npm bundle propre — l'injection de <script> est
 * le pattern officiel et garde notre main bundle léger (samples lazy
 * loadés à la demande au switch de preset).
 *
 * Note bundle : WebAudioFontPlayer.js fait ~124KB raw / ~30KB gzip,
 * chaque preset GM fait ~250-500KB raw. On charge tout depuis le CDN
 * jsdelivr (cache 7 jours côté browser + Workbox cache 90 jours via
 * vite-plugin-pwa).
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const PLAYER_URL =
  'https://cdn.jsdelivr.net/gh/surikov/webaudiofont@master/npm/dist/WebAudioFontPlayer.js';

/** Cache des promises de load — évite de re-fetcher le même script. */
const scriptCache = new Map<string, Promise<void>>();

function loadScript(url: string): Promise<void> {
  const cached = scriptCache.get(url);
  if (cached) return cached;
  const p = new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = url;
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load script ${url}`));
    document.head.appendChild(s);
  });
  scriptCache.set(url, p);
  return p;
}

/** Singleton player — il est partagé entre tous les presets. */
let playerPromise: Promise<any> | null = null;

export function getPlayer(): Promise<any> {
  if (playerPromise) return playerPromise;
  playerPromise = loadScript(PLAYER_URL).then(() => {
    const Ctor = (window as any).WebAudioFontPlayer;
    if (!Ctor) throw new Error('WebAudioFontPlayer not available on window');
    return new Ctor();
  });
  return playerPromise;
}

/**
 * Load + adjust un preset GM, retourne l'objet preset prêt à être joué
 * via `player.queueWaveTable`.
 *
 * Cache idempotent : un même preset n'est chargé qu'une fois par session.
 */
const presetCache = new Map<string, Promise<any>>();

export type PresetSpec = {
  /** URL CDN du fichier .js définissant la var globale */
  url: string;
  /** Nom de la variable globale exposée par le script (ex: _tone_0270_...) */
  varName: string;
};

export async function loadPreset(
  spec: PresetSpec,
  audioContext: AudioContext,
): Promise<any> {
  const key = spec.url;
  const cached = presetCache.get(key);
  if (cached) return cached;
  const p = (async () => {
    const player = await getPlayer();
    await loadScript(spec.url);
    const preset = (window as any)[spec.varName];
    if (!preset) {
      throw new Error(`Preset var ${spec.varName} not found after loading ${spec.url}`);
    }
    // adjustPreset normalise les structures + crée les AudioBuffer pour
    // les zones — obligatoire avant queueWaveTable.
    player.adjustPreset(audioContext, preset);
    return preset;
  })();
  presetCache.set(key, p);
  return p;
}

/**
 * Plays a single MIDI note via the WebAudioFont player.
 * Retourne l'envelope renvoyée par queueWaveTable (utile pour stop early).
 */
export async function playWafNote(opts: {
  audioContext: AudioContext;
  destination: AudioNode;
  preset: any;
  midi: number;
  /** when (audioContext.currentTime offset) — default = currentTime */
  when?: number;
  /** durée en secondes — default 1.5s */
  duration?: number;
  /** volume 0-1 — default 0.7 */
  volume?: number;
}): Promise<any> {
  const player = await getPlayer();
  const when = opts.when ?? opts.audioContext.currentTime;
  return player.queueWaveTable(
    opts.audioContext,
    opts.destination,
    opts.preset,
    when,
    opts.midi,
    opts.duration ?? 1.5,
    opts.volume ?? 0.7,
  );
}
