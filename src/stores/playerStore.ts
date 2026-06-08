/**
 * playerStore — store global pour la lecture audio cross-page.
 *
 * STATUT : store + StickyPlayer livrés cette session, NON BRANCHÉ aux
 * sources existantes (TabPlayer / RecorderSection / Composer / Progressions
 * ont chacune leur propre handler audio interne).
 *
 * Pourquoi : brancher 5+ sources audio existantes dans le même commit =
 * gros risque de régression. La structure est prête, les sources sont
 * migrées une par une dans des futures sessions (1 commit par source).
 *
 * Usage cible (quand branché) :
 *   import { usePlayer } from '@/stores/playerStore';
 *   const setSource = usePlayer((s) => s.setSource);
 *   setSource({
 *     id: 'riff-' + riff.id,
 *     type: 'riff',
 *     title: riff.title,
 *     subtitle: riff.contributor,
 *     onPlay: () => myStartLogic(),
 *     onPause: () => myPauseLogic(),
 *     onStop: () => mySTopLogic(),
 *   });
 *   usePlayer.setState({ isPlaying: true });
 *
 * Le StickyPlayer apparait alors en bas + permet pause/stop/changer
 * de page sans interrompre la lecture (les handlers sont stockés dans
 * le store).
 */
import { create } from 'zustand';

export type AudioSourceType = 'riff' | 'song' | 'progression' | 'recording' | 'preview';

export interface AudioSource {
  /** Identifiant unique de la source (préfixé par type, ex: 'riff-abc') */
  id: string;
  /** Catégorie pour l'icône + label */
  type: AudioSourceType;
  /** Titre principal affiché (ex: "Wonderwall") */
  title: string;
  /** Sous-titre optionnel (ex: artiste, contributor pseudo) */
  subtitle?: string;
  /** URL navigable pour cliquer le titre (ex: '/songs/abc') */
  href?: string;
  /** Callbacks de contrôle — laissés à la source d'origine */
  onPlay?: () => void | Promise<void>;
  onPause?: () => void | Promise<void>;
  onStop?: () => void | Promise<void>;
  /** Optionnel : durée totale en ms si la source la connait (pour barre de progression) */
  durationMs?: number;
}

interface PlayerState {
  source: AudioSource | null;
  isPlaying: boolean;
  /** Position actuelle en ms (la source la pousse régulièrement) */
  positionMs: number;
  /** Volume 0-1, persisté via prefsStore.volume éventuellement */
  volume: number;

  setSource: (source: AudioSource | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setPosition: (ms: number) => void;
  setVolume: (v: number) => void;
  /** Stop + clear : utilisé quand la source quitte la page */
  clear: () => void;
}

export const usePlayer = create<PlayerState>((set, get) => ({
  source: null,
  isPlaying: false,
  positionMs: 0,
  volume: 0.65,

  setSource: (source) => set({ source, positionMs: 0, isPlaying: false }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPosition: (positionMs) => set({ positionMs }),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
  clear: () => {
    const { source } = get();
    if (source?.onStop) void source.onStop();
    set({ source: null, isPlaying: false, positionMs: 0 });
  },
}));
