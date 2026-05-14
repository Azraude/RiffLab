import type { Voicing } from '@/lib/chordDatabase';

interface ChordDiagramProps {
  voicing: Voicing;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  showFingers?: boolean;
}

// Padding asymétrique : padL > padR pour laisser la place au label "Xfr"
// à gauche du diagramme sans qu'il soit masqué par le point de la corde Mi
// grave (string 0, à gauche). Le diagramme reste lisible côté droit.
const SIZES = {
  sm: { w: 96, h: 110, padTop: 22, padBottom: 8, padL: 20, padR: 8, frets: 4 },
  md: { w: 116, h: 140, padTop: 26, padBottom: 10, padL: 24, padR: 10, frets: 4 },
  lg: { w: 148, h: 180, padTop: 30, padBottom: 12, padL: 30, padR: 12, frets: 4 },
};

export function ChordDiagram({
  voicing,
  name,
  size = 'md',
  showFingers = true,
}: ChordDiagramProps) {
  const cfg = SIZES[size];
  const STRING_COUNT = 6;
  const FRETS_SHOWN = cfg.frets;

  // Determine baseFret (lowest non-zero fret in the voicing, or explicit baseFret)
  const playedFrets = voicing.frets.filter((f): f is number => f != null && f > 0);
  const minFret = playedFrets.length ? Math.min(...playedFrets) : 0;
  const baseFret = voicing.baseFret ?? (minFret > 1 ? minFret : 1);
  const isOpenPosition = baseFret === 1 && !voicing.barre;

  const w = cfg.w;
  const h = cfg.h;
  const innerW = w - cfg.padL - cfg.padR;
  const innerH = h - cfg.padTop - cfg.padBottom;
  const stringSpacing = innerW / (STRING_COUNT - 1);
  const fretSpacing = innerH / FRETS_SHOWN;

  // Coords
  const x = (stringIdx: number) => cfg.padL + stringIdx * stringSpacing;
  const y = (fretFromTop: number) => cfg.padTop + fretFromTop * fretSpacing;

  // Translate absolute fret to display position (1-FRETS_SHOWN)
  const displayFret = (absFret: number) => absFret - baseFret + 1;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={name ? `Diagramme de l'accord ${name}` : 'Diagramme d\'accord'}
    >
      {/* Indicators above strings (X for muted, O for open) */}
      {voicing.frets.map((f, i) => {
        if (f === null) {
          return (
            <text
              key={`mute-${i}`}
              x={x(i)}
              y={cfg.padTop - 6}
              textAnchor="middle"
              fontFamily="Inter"
              fontSize="10"
              fill="#9a9a9a"
            >
              ×
            </text>
          );
        }
        if (f === 0) {
          return (
            <circle
              key={`open-${i}`}
              cx={x(i)}
              cy={cfg.padTop - 8}
              r={3.5}
              fill="none"
              stroke="#d4b76a"
              strokeWidth="1.2"
            />
          );
        }
        return null;
      })}

      {/* Nut (top thick line) — only shown if base position */}
      {isOpenPosition && (
        <rect
          x={cfg.padL - 1}
          y={cfg.padTop - 2}
          width={innerW + 2}
          height={3}
          fill="#d4b76a"
        />
      )}

      {/* Fret lines */}
      {Array.from({ length: FRETS_SHOWN + 1 }).map((_, i) => (
        <line
          key={`fret-${i}`}
          x1={cfg.padL}
          y1={y(i)}
          x2={cfg.padL + innerW}
          y2={y(i)}
          stroke={i === 0 && !isOpenPosition ? '#666' : '#404040'}
          strokeWidth={i === 0 && !isOpenPosition ? 1 : 1}
        />
      ))}

      {/* String lines */}
      {Array.from({ length: STRING_COUNT }).map((_, i) => (
        <line
          key={`str-${i}`}
          x1={x(i)}
          y1={cfg.padTop}
          x2={x(i)}
          y2={cfg.padTop + innerH}
          stroke="#5a5a5a"
          strokeWidth="0.8"
        />
      ))}

      {/* Position indicator (e.g. "3fr") — placé juste à gauche de la
          1ère row du diagramme, dans la zone padL. fill="#d4b76a" pour
          le rendre visible et cohérent avec la palette. */}
      {!isOpenPosition && (
        <text
          x={cfg.padL - 5}
          y={cfg.padTop + fretSpacing / 2 + 4}
          textAnchor="end"
          fontFamily="Inter"
          fontSize="10"
          fontWeight="600"
          fill="#d4b76a"
        >
          {baseFret}fr
        </text>
      )}

      {/* Barre */}
      {voicing.barre && (() => {
        const b = voicing.barre;
        const fy = y(displayFret(b.fret) - 0.5);
        return (
          <rect
            x={x(b.fromString) - 6}
            y={fy - 5}
            width={x(b.toString) - x(b.fromString) + 12}
            height={10}
            rx={5}
            fill="#d4b76a"
          />
        );
      })()}

      {/* Dots */}
      {voicing.frets.map((f, i) => {
        if (f == null || f === 0) return null;
        // Skip if it's part of a barre (the barre rect covers it)
        if (
          voicing.barre &&
          f === voicing.barre.fret &&
          i >= voicing.barre.fromString &&
          i <= voicing.barre.toString
        ) {
          // Still show finger number on barre? Yes, on the first string of the barre
          if (i !== voicing.barre.fromString) return null;
          if (!showFingers) return null;
          const finger = voicing.fingers?.[i];
          if (finger == null) return null;
          return (
            <text
              key={`barre-finger-${i}`}
              x={x(i)}
              y={y(displayFret(f) - 0.5) + 3}
              textAnchor="middle"
              fontFamily="Inter"
              fontSize="9"
              fontWeight="700"
              fill="#0a0a0a"
            >
              {finger}
            </text>
          );
        }

        const dy = y(displayFret(f) - 0.5);
        const finger = voicing.fingers?.[i];
        return (
          <g key={`dot-${i}`}>
            <circle cx={x(i)} cy={dy} r={size === 'sm' ? 5 : 6.5} fill="#ffffff" />
            {showFingers && finger != null && finger > 0 && (
              <text
                x={x(i)}
                y={dy + 3}
                textAnchor="middle"
                fontFamily="Inter"
                fontSize={size === 'sm' ? '8' : '9'}
                fontWeight="700"
                fill="#0a0a0a"
              >
                {finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
