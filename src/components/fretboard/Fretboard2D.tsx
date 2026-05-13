import { useMemo } from 'react';
import {
  NOTE_NAMES,
  TUNINGS,
  scaleNotes,
  pitchClass,
  type TuningId,
  type NoteName,
  type ScaleId,
} from '@/lib/theory';

interface Fretboard2DProps {
  tuning?: TuningId;
  numFrets?: number;
  scale?: { key: NoteName; scaleId: ScaleId };
  chord?: { frets: (number | null)[] }; // simple chord overlay (positions on strings)
  highlightNotes?: number[];            // pitch classes 0-11 to highlight
  tonic?: NoteName;
  showNoteNames?: boolean;
  className?: string;
}

export function Fretboard2D({
  tuning = 'standard',
  numFrets = 14,
  scale,
  chord,
  highlightNotes,
  tonic,
  showNoteNames = true,
  className,
}: Fretboard2DProps) {
  // Compute notes to display
  const tonicPC = useMemo(() => {
    if (tonic) return NOTE_NAMES.indexOf(tonic);
    if (scale) return NOTE_NAMES.indexOf(scale.key);
    return -1;
  }, [tonic, scale]);

  const noteSet = useMemo<Set<number>>(() => {
    if (scale) return new Set(scaleNotes(scale.key, scale.scaleId));
    if (highlightNotes) return new Set(highlightNotes);
    return new Set();
  }, [scale, highlightNotes]);

  // Geometry
  const STRING_COUNT = 6;
  const W = 880;
  const H = 168;
  const padL = 30;
  const padR = 20;
  const padT = 22;
  const padB = 22;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const stringSpacing = innerH / (STRING_COUNT - 1);
  const fretSpacing = innerW / numFrets;

  const x = (fret: number) => padL + fret * fretSpacing;
  const y = (stringIdx: number) => padT + (STRING_COUNT - 1 - stringIdx) * stringSpacing;
  // stringIdx 0 = low E, drawn at bottom

  const inlayFrets = [3, 5, 7, 9, 15, 17, 19, 21].filter((f) => f <= numFrets);

  const openTuning = TUNINGS[tuning];

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Fretboard background */}
      <rect x={padL} y={padT} width={innerW} height={innerH} fill="#1a120a" rx="3" />

      {/* Nut */}
      <rect x={padL - 4} y={padT} width={5} height={innerH} fill="#fafafa" />

      {/* Inlay dots */}
      {inlayFrets.map((f) => {
        const cx = x(f) - fretSpacing / 2;
        if (f === 12 || f === 24) {
          return (
            <g key={f}>
              <circle cx={cx} cy={padT + innerH * 0.32} r={4.5} fill="#3a2818" />
              <circle cx={cx} cy={padT + innerH * 0.68} r={4.5} fill="#3a2818" />
            </g>
          );
        }
        return <circle key={f} cx={cx} cy={padT + innerH / 2} r={5} fill="#3a2818" />;
      })}

      {/* Frets */}
      {Array.from({ length: numFrets }).map((_, i) => (
        <line
          key={`fret-${i}`}
          x1={x(i + 1)}
          y1={padT}
          x2={x(i + 1)}
          y2={padT + innerH}
          stroke="#888"
          strokeWidth={1.5}
        />
      ))}

      {/* Strings */}
      {Array.from({ length: STRING_COUNT }).map((_, i) => (
        <line
          key={`str-${i}`}
          x1={padL}
          y1={y(i)}
          x2={padL + innerW}
          y2={y(i)}
          stroke="#bdbdbd"
          strokeWidth={i < 3 ? 1 : 0.8}
        />
      ))}

      {/* Open string labels (left side) */}
      {openTuning.map((midi, i) => (
        <text
          key={`open-${i}`}
          x={padL - 12}
          y={y(i) + 4}
          textAnchor="middle"
          fontFamily="JetBrains Mono"
          fontSize={11}
          fill="#9a8454"
        >
          {NOTE_NAMES[pitchClass(midi)]}
        </text>
      ))}

      {/* Fret numbers below */}
      {Array.from({ length: numFrets }).map((_, i) => {
        const fret = i + 1;
        if (![3, 5, 7, 9, 12, 15, 17, 19, 21].includes(fret)) return null;
        return (
          <text
            key={`num-${fret}`}
            x={x(fret) - fretSpacing / 2}
            y={padT + innerH + 14}
            textAnchor="middle"
            fontFamily="Inter"
            fontSize={10}
            fill="#6a6a6a"
          >
            {fret}
          </text>
        );
      })}

      {/* Scale notes */}
      {scale &&
        openTuning.flatMap((openMidi, sIdx) =>
          Array.from({ length: numFrets + 1 }).map((_, f) => {
            const pc = pitchClass(openMidi + f);
            if (!noteSet.has(pc)) return null;
            const isTonic = pc === tonicPC;
            const cx = f === 0 ? padL - 12 : x(f) - fretSpacing / 2;
            if (f === 0) return null; // skip open string positions (already labeled on side)
            return (
              <g key={`note-${sIdx}-${f}`}>
                <circle
                  cx={cx}
                  cy={y(sIdx)}
                  r={9}
                  fill={isTonic ? '#d4b76a' : '#ffffff'}
                  stroke={isTonic ? '#9a8454' : '#404040'}
                  strokeWidth={0.5}
                />
                {showNoteNames && (
                  <text
                    x={cx}
                    y={y(sIdx) + 3.5}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono"
                    fontSize={9}
                    fontWeight="700"
                    fill="#0a0a0a"
                  >
                    {NOTE_NAMES[pc]}
                  </text>
                )}
              </g>
            );
          })
        )}

      {/* Chord overlay */}
      {chord &&
        chord.frets.map((f, sIdx) => {
          if (f == null || f === 0) return null;
          const cx = x(f) - fretSpacing / 2;
          return (
            <circle
              key={`chord-${sIdx}`}
              cx={cx}
              cy={y(sIdx)}
              r={10}
              fill="#4caf85"
              stroke="#0a0a0a"
              strokeWidth={1}
            />
          );
        })}
    </svg>
  );
}
