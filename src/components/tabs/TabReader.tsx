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
 */
import { useMemo } from 'react';
import { flattenTab, type Tab } from '@/lib/tabsDatabase';

interface TabReaderProps {
  tab: Tab;
  /** Position absolue en 16e de la note en cours (pour highlight + curseur). */
  activeAbsBeat?: number | null;
  /** Hauteur d'une ligne string (px). Défaut 18. */
  lineHeight?: number;
  /** Largeur d'une subdivision 16e (px). Défaut 16. */
  beatWidth?: number;
}

const STRING_LABELS = ['e', 'B', 'G', 'D', 'A', 'E']; // top → bottom (high E first)

export function TabReader({
  tab,
  activeAbsBeat = null,
  lineHeight = 18,
  beatWidth = 16,
}: TabReaderProps) {
  const flat = useMemo(() => flattenTab(tab), [tab]);

  const PAD_LEFT = 24; // espace pour le label "e", "B", etc.
  const PAD_RIGHT = 12;
  const PAD_TOP = 8;
  const PAD_BOTTOM = 8;
  const BEATS_PER_MEASURE = 16;
  const MEASURE_WIDTH = BEATS_PER_MEASURE * beatWidth;
  const totalWidth = PAD_LEFT + tab.measures.length * MEASURE_WIDTH + PAD_RIGHT;
  const totalHeight = PAD_TOP + 5 * lineHeight + PAD_BOTTOM;

  // Position du curseur de lecture
  const cursorX =
    activeAbsBeat != null
      ? PAD_LEFT + activeAbsBeat * beatWidth + beatWidth / 2
      : null;

  return (
    <div className="relative -mx-1 overflow-x-auto pb-1">
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
            activeAbsBeat != null &&
            activeAbsBeat >= n.absoluteBeat &&
            activeAbsBeat < n.absoluteBeat + n.duration;
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
            </g>
          );
        })}

        {/* Curseur de lecture (vertical line) */}
        {cursorX != null && (
          <line
            x1={cursorX}
            y1={PAD_TOP - 4}
            x2={cursorX}
            y2={PAD_TOP + 5 * lineHeight + 4}
            stroke="rgb(var(--gold-bright))"
            strokeWidth={1.5}
            opacity={0.7}
          >
            <animate
              attributeName="opacity"
              values="0.7;0.35;0.7"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </line>
        )}
      </svg>
    </div>
  );
}
