import type { Voicing } from '@/lib/chordDatabase';

interface ChordDiagramProps {
  voicing: Voicing;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  showFingers?: boolean;
}

const SIZES = {
  sm: { w: 90, h: 110, padTop: 22, padBottom: 8, padX: 12, frets: 4 },
  md: { w: 110, h: 140, padTop: 26, padBottom: 10, padX: 14, frets: 4 },
  lg: { w: 140, h: 180, padTop: 30, padBottom: 12, padX: 18, frets: 4 },
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
  const innerW = w - cfg.padX * 2;
  const innerH = h - cfg.padTop - cfg.padBottom;
  const stringSpacing = innerW / (STRING_COUNT - 1);
  const fretSpacing = innerH / FRETS_SHOWN;

  // Coords
  const x = (stringIdx: number) => cfg.padX + stringIdx * stringSpacing;
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
          x={cfg.padX - 1}
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
          x1={cfg.padX}
          y1={y(i)}
          x2={cfg.padX + innerW}
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

      {/* Position indicator (e.g. "3fr") */}
      {!isOpenPosition && (
        <text
          x={cfg.padX - 6}
          y={cfg.padTop + fretSpacing / 2 + 4}
          textAnchor="end"
          fontFamily="Inter"
          fontSize="10"
          fill="#9a9a9a"
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
