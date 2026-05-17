/**
 * Teleprompter — Mode Lecture full-screen pour SongDetail.
 *
 * Affiche les paroles de chaque section avec les accords inline (format
 * UG `[Am]today`). Auto-scroll au tempo, screen.wakeLock pour empêcher
 * le téléphone de s'éteindre, tap pour pause/play.
 *
 * Phase 3.5 MVP (branche feature/teleprompter) :
 * - Parser inline `[Chord]` via lyricsParser.ts
 * - Auto-scroll : durée par section calculée comme
 *     totalBeats * (60_000 / tempo) ms
 *   où totalBeats = somme des ChordRef.beats de la section
 * - Tap n'importe où = toggle play/pause
 * - Bouton "←/→" : section précédente/suivante manuellement
 * - Sortie via bouton X ou navigate back
 *
 * Limitations connues (à itérer plus tard) :
 * - Pas de mapping chord/syllabe fin si lyrics n'ont pas de `[Chord]`
 *   inline — on affiche juste les chords de section.chords en bandeau
 * - Pas d'auto-scroll fin via Intersection — on advance section par
 *   section uniquement (atomique). Phase 4 = scroll continu.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';
import { db, type Song } from '@/lib/db';
import { parseLyrics, extractChordsFromLyrics } from '@/lib/lyricsParser';

export function Teleprompter() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const song = useLiveQuery<Song | undefined>(
    async () => (id ? await db.songs.get(id) : undefined),
    [id],
  );
  const [sectionIdx, setSectionIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1 sur la section en cours
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Lock le screen — pas de mise en veille pendant qu'on joue
  useEffect(() => {
    let sentinel: WakeLockSentinel | null = null;
    const lock = async () => {
      try {
        if ('wakeLock' in navigator) {
          sentinel = await navigator.wakeLock.request('screen');
        }
      } catch {
        // bloqué par le browser → on continue sans
      }
    };
    void lock();
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !sentinel) void lock();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void sentinel?.release().catch(() => undefined);
    };
  }, []);

  const sections = song?.sections ?? [];
  const currentSection = sections[sectionIdx];
  const tempo = song?.tempo ?? 100;

  // Durée totale de la section en ms (somme des beats * 60s/bpm)
  const sectionDurationMs = useMemo(() => {
    if (!currentSection) return 0;
    const totalBeats =
      currentSection.chords.reduce((sum, c) => sum + c.beats, 0) || 16; // fallback 4 bars
    return totalBeats * (60_000 / tempo);
  }, [currentSection, tempo]);

  // Boucle d'animation : avance le progress, advance section au bout
  useEffect(() => {
    if (!playing || sectionDurationMs === 0) return;
    startTimeRef.current = performance.now() - progress * sectionDurationMs;
    const tick = (now: number) => {
      if (startTimeRef.current === null) return;
      const elapsed = now - startTimeRef.current;
      const p = Math.min(1, elapsed / sectionDurationMs);
      setProgress(p);
      if (p >= 1) {
        // Section terminée — avance ou stop si dernière
        if (sectionIdx < sections.length - 1) {
          setSectionIdx((i) => i + 1);
          setProgress(0);
          startTimeRef.current = performance.now();
        } else {
          setPlaying(false);
          setProgress(1);
          return;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sectionIdx, sectionDurationMs]);

  const togglePlay = () => setPlaying((p) => !p);

  const prevSection = () => {
    setSectionIdx((i) => Math.max(0, i - 1));
    setProgress(0);
  };
  const nextSection = () => {
    setSectionIdx((i) => Math.min(sections.length - 1, i + 1));
    setProgress(0);
  };

  const exit = () => navigate(`/songs/${id}`);

  if (!song) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg text-text-soft">
        Chargement…
      </div>
    );
  }
  if (sections.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-bg p-6 text-center">
        <p className="text-text-muted">Ce son n'a pas encore de sections.</p>
        <button
          type="button"
          onClick={exit}
          className="rounded-xl border border-border-gold px-4 py-2 text-sm hover:bg-gold/5"
        >
          Retour
        </button>
      </div>
    );
  }

  const lyrics = parseLyrics(currentSection?.lyrics);
  const chordsFromLyrics = extractChordsFromLyrics(currentSection?.lyrics);
  // Si pas de chords inline, fallback sur section.chords (bandeau)
  const showChordBanner = lyrics.length === 0 || chordsFromLyrics.length === 0;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-bg text-text">
      {/* Header minimaliste */}
      <div className="flex items-center justify-between border-b border-border bg-bg/80 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={exit}
          aria-label="Quitter le mode lecture"
          className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-text-muted hover:bg-surface hover:text-text"
        >
          <X size={16} /> Sortir
        </button>
        <div className="text-center">
          <div className="display text-base text-text">{song.title}</div>
          <div className="text-[10px] uppercase tracking-wider text-text-soft">
            {song.artist ?? '—'} · {tempo} BPM
          </div>
        </div>
        <div className="text-right font-mono text-xs text-text-soft">
          {sectionIdx + 1}/{sections.length}
        </div>
      </div>

      {/* Section name + chord banner */}
      <div className="border-b border-border bg-surface px-4 py-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="display text-display-sm text-gold">
            {currentSection.name}
          </h2>
          {showChordBanner && currentSection.chords.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {currentSection.chords.map((c, i) => (
                <span
                  key={i}
                  className="rounded-md border border-border-gold bg-gold/10 px-2 py-1 font-mono text-sm font-bold text-gold-bright"
                >
                  {c.name}
                  <span className="ml-1 text-[10px] text-gold-soft">×{c.beats}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Zone lyrics — tap pour toggle play */}
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? 'Mettre en pause' : 'Démarrer la lecture'}
        className="relative flex-1 overflow-y-auto px-6 py-8 text-left transition-colors focus:outline-none active:bg-surface/30"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={sectionIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mx-auto max-w-3xl space-y-3"
          >
            {lyrics.length === 0 ? (
              <div className="py-12 text-center text-text-muted">
                {currentSection.chords.length > 0
                  ? 'Section instrumentale — joue les accords ci-dessus.'
                  : 'Section vide.'}
              </div>
            ) : (
              lyrics.map((line, li) =>
                line.length === 0 ? (
                  <div key={li} className="h-6" />
                ) : (
                  <div
                    key={li}
                    className="flex flex-wrap items-end gap-x-1 leading-relaxed"
                  >
                    {line.map((token, ti) => (
                      <span key={ti} className="relative inline-flex flex-col">
                        {token.chord && (
                          <span className="-mb-1 font-mono text-base font-bold text-gold-bright md:text-lg">
                            {token.chord}
                          </span>
                        )}
                        <span className="text-[26px] text-text md:text-[34px]">
                          {token.text || ' '}
                        </span>
                      </span>
                    ))}
                  </div>
                ),
              )
            )}
          </motion.div>
        </AnimatePresence>
      </button>

      {/* Footer transport */}
      <div className="border-t border-border bg-bg/80 px-4 py-3 backdrop-blur">
        {/* Progress bar */}
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full bg-gold-bright"
            style={{ width: `${progress * 100}%` }}
            animate={{ width: `${progress * 100}%` }}
            transition={{ duration: 0 }}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={prevSection}
            disabled={sectionIdx === 0}
            aria-label="Section précédente"
            className="flex h-12 w-12 items-center justify-center rounded-full text-text-muted disabled:opacity-30 hover:bg-surface hover:text-text"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? 'Pause' : 'Play'}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-bg shadow-gold hover:bg-gold-bright"
          >
            {playing ? (
              <Pause size={22} fill="currentColor" />
            ) : (
              <Play size={22} fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            onClick={nextSection}
            disabled={sectionIdx === sections.length - 1}
            aria-label="Section suivante"
            className="flex h-12 w-12 items-center justify-center rounded-full text-text-muted disabled:opacity-30 hover:bg-surface hover:text-text"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="mt-2 text-center text-[10px] text-text-soft">
          Tap n'importe où dans les paroles pour pause/play
        </div>
      </div>
    </div>
  );
}
