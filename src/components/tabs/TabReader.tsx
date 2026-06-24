/**
 * TabReader — affiche un Tab en notation guitare classique (6 lignes
 * horizontales + frets positionnées sur les lignes).
 *
 * Rendu SVG pour le contrôle précis du positionnement et l'accessibilité
 * aux animations (curseur, highlight de la note active).
 *
 * Convention rendu (top → bottom) :
 *   e (string 0) — high E
 *   B (string 1)
 *   G (string 2)
 *   D (string 3)
 *   A (string 4)
 *   E (string 5) — low E (bass)
 *
 * activeNoteAbsBeat (optionnel) = position absolue de la note actuellement
 * jouée par le player, utilisé pour highlight + curseur.
 *
 * Sess refonte détail (Phase 2) — props ajoutés pour l'écran de pratique :
 *  - autoScroll : suit la tête de lecture en scrollant horizontalement
 *  - currentTime/duration : pilote la tête de lecture depuis l'horloge audio
 *    (sinon fallback sur activeAbsBeat)
 *  - showPlayhead : tête de lecture dorée pleine (vs curseur pulsé léger)
 *  - showTechniques : glyphes techniques (h/p/slide/bend/vibrato) en or
 *  - onSeek : clic sur la tab → seek (temps en secondes)
 */
import { useEffect, useMemo, useRef } from 'react';
import { flattenTab, type Technique, type Tab } from '@/lib/tabsDatabase';

interface TabReaderProps {
  tab: Tab;
  /** Position absolue en 16e de la note en cours (pour highlight + curseur). */
  activeAbsBeat?: number | null;
  /** Hauteur d'une ligne string (px). Défaut 18. */
  lineHeight?: number;
  /** Largeur d'une subdivision 16e (px). Défaut 16. */
  beatWidth?: number;
  /** Scroll horizontal auto pour suivre la tête de lecture. */
  autoScroll?: boolean;
  /** Seconde courante de l'horloge audio (override activeAbsBeat). */
  currentTime?: number;
  /** Durée totale en secondes (pour mapper temps → beat). */
  duration?: number;
  /** Affiche une tête de lecture dorée pleine. */
  showPlayhead?: boolean;
  /** Colore les techniques (h/p///\\/b/~) en or sur la tab. */
  showTechniques?: boolean;
  /** Clic sur la tab → seek (temps en secondes). */
  onSeek?: (time: number) => void;
}

const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E']; // top → bottom (high E first)

/** Glyphe affiché pour chaque technique. */
const TECHNIQUE_GLYPH: Record<Technique, string> = {
  h: 'h',
  p: 'p',
  's-up': '/',
  's-down': '\\',
  b: 'b',
  v: '~',
};

const MANUAL_SCROLL_GRACE_MS = 2500;

export function TabReader({
  tab,
  activeAbsBeat = null,
  lineHeight = 18,
  beatWidth = 16,
  autoScroll = false,
  currentTime,
  duration,
  showPlayhead = false,
  showTechniques = false,
  onSeek,
}: TabReaderProps) {
  const flat = useMemo(() => flattenTab(tab), [tab]);

  const PAD_LEFT = 24; // espace pour le label "e", "B", etc.
  const PAD_RIGHT = 12;
  const PAD_TOP = 8;
  const PAD_BOTTOM = 8;
  const BEATS_PER_MEASURE = 16;
  const MEASURE_WIDTH = BEATS_PER_MEASURE * beatWidth;
  const totalBeats = tab.measures.length * BEATS_PER_MEASURE;
  const totalWidth = PAD_LEFT + tab.measures.length * MEASURE_WIDTH + PAD_RIGHT;
  const totalHeight = PAD_TOP + 5 * lineHeight + PAD_BOTTOM;

  // Tête de lecture : pilotée par currentTime/duration si fournis, sinon
  // par activeAbsBeat (mode player beat-based legacy).
  const effectiveBeat =
    currentTime != null && duration && duration > 0
      ? (currentTime / duration) * totalBeats
      : activeAbsBeat;

  const cursorX = effectiveBeat != null ? PAD_LEFT + effectiveBeat * beatWidth + beatWidth / 2 : null;

  // ─── Auto-scroll horizontal pour suivre la tête de lecture ───
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const manualUntilRef = useRef(0);

  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (!el) return;
    const markManual = () => {
      manualUntilRef.current = Date.now() + MANUAL_SCROLL_GRACE_MS;
    };
    el.addEventListener('touchstart', markManual, { passive: true });
    el.addEventListener('wheel', markManual, { passive: true });
    el.addEventListener('pointerdown', markManual, { passive: true });
    return () => {
      el.removeEventListener('touchstart', markManual);
      el.removeEventListener('wheel', markManual);
      el.removeEventListener('pointerdown', markManual);
    };
  }, [autoScroll]);

  useEffect(() => {
    if (!autoScroll || cursorX == null) return;
    if (Date.now() < manualUntilRef.current) return;
    const el = scrollRef.current;
    if (!el) return;
    const target = Math.max(0, cursorX - el.clientWidth * 0.35);
    if (Math.abs(el.scrollLeft - target) > 24) {
      el.scrollTo({ left: target, behavior: 'smooth' });
    }
  }, [autoScroll, cursorX]);

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    const el = scrollRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const xInContent = e.clientX - rect.left + el.scrollLeft - PAD_LEFT;
    const beat = Math.max(0, Math.min(totalBeats, xInContent / beatWidth));
    const time = duration ? (beat / totalBeats) * duration : 0;
    onSeek(time);
  };

  return (
    <div
      ref={scrollRef}
      className={`relative -mx-1 overflow-x-auto pb-1 [scrollbar-width:thin] ${onSeek ? 'cursor-pointer' : ''}`}
      onClick={onSeek ? handleSeekClick : undefined}
    >
      <svg
        viewBox={`0 0 ${totalWidth} ${totalHeight}`}
        width={totalWidth}
        height={totalHeight}
        className="block"
        aria-label={`Tablature ${tab.name}`}
      >
        {/* 6 string lines + labels */}
        {STRING_LABELS.map((label, i) => {
          const y = PAD_TOP + i * lineHeight;
          return (
            <g key={i}>
              <text
                x={6}
                y={y + 4}
                fontFamily="JetBrains Mono"
                fontSize={11}
                fontWeight={500}
                fill="rgb(var(--text-soft))"
              >
                {label}
              </text>
              <line
                x1={PAD_LEFT}
                y1={y}
                x2={totalWidth - PAD_RIGHT}
                y2={y}
                stroke="rgb(var(--border))"
                strokeWidth={1}
              />
            </g>
          );
        })}

        {/* Measure separators */}
        {tab.measures.map((_, mi) => (
          <line
            key={`sep-${mi}`}
            x1={PAD_LEFT + mi * MEASURE_WIDTH}
            y1={PAD_TOP - 2}
            x2={PAD_LEFT + mi * MEASURE_WIDTH}
            y2={PAD_TOP + 5 * lineHeight + 2}
            stroke="rgb(var(--text-soft) / 0.4)"
            strokeWidth={1}
          />
        ))}
        {/* Closing bar */}
        <line
          x1={totalWidth - PAD_RIGHT}
          y1={PAD_TOP - 2}
          x2={totalWidth - PAD_RIGHT}
          y2={PAD_TOP + 5 * lineHeight + 2}
          stroke="rgb(var(--gold-soft))"
          strokeWidth={1.5}
        />

        {/* Notes */}
        {flat.map((n, idx) => {
          const x = PAD_LEFT + n.absoluteBeat * beatWidth + beatWidth / 2;
          const y = PAD_TOP + n.string * lineHeight;
          const isActive =
            effectiveBeat != null &&
            effectiveBeat >= n.absoluteBeat &&
            effectiveBeat < n.absoluteBeat + n.duration;
          return (
            <g key={idx}>
              {/* Background rect pour masquer la ligne sous le chiffre */}
              <rect
                x={x - 7}
                y={y - 7}
                width={14}
                height={14}
                rx={2}
                fill="rgb(var(--surface))"
              />
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fontFamily="JetBrains Mono"
                fontSize={11}
                fontWeight={isActive ? 700 : 600}
                fill={isActive ? 'rgb(var(--gold-bright))' : 'rgb(var(--gold))'}
                style={
                  isActive
                    ? { filter: 'drop-shadow(0 0 4px rgb(var(--gold-glow) / 0.8))' }
                    : undefined
                }
              >
                {n.fret}
              </text>
              {/* Glyphe technique (h/p/slide/bend/vibrato) */}
              {showTechniques && n.technique && (
                <text
                  x={x + 8}
                  y={y - 3}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono"
                  fontSize={9}
                  fontWeight={700}
                  fill="rgb(var(--gold-bright))"
                  aria-hidden
                >
                  {TECHNIQUE_GLYPH[n.technique]}
                </text>
              )}
            </g>
          );
        })}

        {/* Tête de lecture / curseur (vertical line) */}
        {cursorX != null && (
          <line
            x1={cursorX}
            y1={PAD_TOP - 4}
            x2={cursorX}
            y2={PAD_TOP + 5 * lineHeight + 4}
            stroke="rgb(var(--gold-bright))"
            strokeWidth={showPlayhead ? 2 : 1.5}
            opacity={showPlayhead ? 0.9 : 0.7}
            style={
              showPlayhead
                ? { filter: 'drop-shadow(0 0 6px rgb(var(--gold-glow) / 0.6))' }
                : undefined
            }
          >
            {!showPlayhead && (
              <animate
                attributeName="opacity"
                values="0.7;0.35;0.7"
                dur="0.6s"
                repeatCount="indefinite"
              />
            )}
          </line>
        )}
      </svg>
    </div>
  );
}
