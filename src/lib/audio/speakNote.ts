/**
 * TTS français pour le mode Challenge du Fretboard Learner.
 *
 * Utilise l'API Web Speech (speechSynthesis) — natif navigateur, zéro lib.
 * La voix française dépend de l'OS (Windows : ajouter le pack voix FR si
 * absent). Si aucune voix FR : fallback voix par défaut avec lang='fr-FR'.
 */

const NOTE_FR: Record<string, string> = {
  C: 'Do',
  'C#': 'Do dièse',
  D: 'Ré',
  'D#': 'Ré dièse',
  E: 'Mi',
  F: 'Fa',
  'F#': 'Fa dièse',
  G: 'Sol',
  'G#': 'Sol dièse',
  A: 'La',
  'A#': 'La dièse',
  B: 'Si',
};

const STRING_FR = [
  '', // 0 inutilisé
  'première',
  'deuxième',
  'troisième',
  'quatrième',
  'cinquième',
  'sixième',
];

let frenchVoice: SpeechSynthesisVoice | null = null;

function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function getFrenchVoice(): SpeechSynthesisVoice | null {
  if (!ttsAvailable()) return null;
  if (frenchVoice) return frenchVoice;
  const voices = window.speechSynthesis.getVoices();
  frenchVoice =
    voices.find((v) => v.lang === 'fr-FR') ??
    voices.find((v) => v.lang.startsWith('fr')) ??
    null;
  return frenchVoice;
}

/** Pré-charge les voix (Chrome les charge en async après le 1er getVoices). */
export function initVoices(): void {
  if (!ttsAvailable()) return;
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = () => getFrenchVoice();
  } else {
    getFrenchVoice();
  }
}

function speak(text: string, rate: number, cancelPrevious: boolean): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsAvailable()) {
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getFrenchVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = 'fr-FR';
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    if (cancelPrevious) window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  });
}

/** "deuxième corde, La" — annonce d'un challenge. */
export function speakChallenge(stringNumber: number, noteName: string): Promise<void> {
  const stringFr = STRING_FR[stringNumber] ?? `corde ${stringNumber}`;
  const noteFr = NOTE_FR[noteName] ?? noteName;
  return speak(`${stringFr} corde, ${noteFr}`, 0.95, true);
}

/** Dit juste le nom d'une note ("La"). */
export function speakNote(noteName: string): Promise<void> {
  return speak(NOTE_FR[noteName] ?? noteName, 1.1, false);
}

/** Arrête toute synthèse en cours. */
export function cancelSpeech(): void {
  if (ttsAvailable()) window.speechSynthesis.cancel();
}
