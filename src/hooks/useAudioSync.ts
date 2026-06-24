/**
 * useAudioSync — horloge de lecture pour l'écran détail riff.
 *
 * Deux modes :
 *  1. Vrai audio (`audioUrl` fourni, ex: enregistrement uploadé) → pilote un
 *     <audio> et reflète son `currentTime`.
 *  2. Simulation (pas d'audio) → avance `currentTime` via requestAnimationFrame
 *     sur `duration` secondes. La page détail déclenche en parallèle la
 *     synthèse note-à-note (mode hybride) pour garder le son.
 *
 * Expose une API play/pause/seek + togglePlay et l'état (isPlaying,
 * currentTime, duration), consommée par TabReader (tête de lecture +
 * auto-scroll) et AnnotationList (highlight de l'annotation active).
 */
import { useEffect, useRef, useState } from 'react';

interface UseAudioSyncOptions {
  /** Durée en secondes (défaut 24). En mode hybride : longueur musicale réelle. */
  duration?: number;
  /** Si fourni, joue le vrai fichier audio au lieu de la simulation. */
  audioUrl?: string | null;
}

export interface AudioSync {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  /** True si on simule (pas de vrai fichier) — la page peut alors synthétiser. */
  isSimulated: boolean;
  play: () => void;
  pause: () => void;
  seekTo: (time: number) => void;
  togglePlay: () => void;
}

export function useAudioSync({ duration = 24, audioUrl }: UseAudioSyncOptions = {}): AudioSync {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const isSimulated = !audioUrl;

  // Mode 1 : vrai audio
  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [audioUrl]);

  // Mode 2 : simulation rAF (pas d'audio uploadé)
  useEffect(() => {
    if (audioUrl) return;
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    startTimeRef.current = Date.now() - currentTime * 1000;
    const tick = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      if (elapsed >= duration) {
        setCurrentTime(duration);
        setIsPlaying(false);
        return;
      }
      setCurrentTime(elapsed);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // currentTime volontairement hors deps : sert seulement de point de
    // reprise au (re)démarrage, pas à relancer la boucle à chaque frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, duration, audioUrl]);

  const play = () => {
    // Reprise depuis le début si on était à la fin (bouton Play uniquement).
    if (currentTime >= duration) {
      setCurrentTime(0);
      startTimeRef.current = Date.now();
    }
    if (audioRef.current) void audioRef.current.play();
    setIsPlaying(true);
  };

  const pause = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
  };

  const seekTo = (time: number) => {
    const clamped = Math.max(0, Math.min(time, duration));
    setCurrentTime(clamped);
    // Recale la baseline rAF pour que la boucle en cours reparte du seek
    // (sinon elle écrase currentTime au frame suivant) + démarre si en pause.
    startTimeRef.current = Date.now() - clamped * 1000;
    if (audioRef.current) audioRef.current.currentTime = clamped;
    setIsPlaying(true);
  };

  return {
    isPlaying,
    currentTime,
    duration,
    isSimulated,
    play,
    pause,
    seekTo,
    togglePlay: () => (isPlaying ? pause() : play()),
  };
}
