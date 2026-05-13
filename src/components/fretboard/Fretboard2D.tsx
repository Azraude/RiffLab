import { useId, useMemo } from 'react';
import {
  NOTE_NAMES,
  TUNINGS,
  scaleNotes,
  pitchClass,
  type TuningId,
  type NoteName,
  type ScaleId,
} from '@/lib/theory';

/**
 * Premium 2D fretboard — palette "Noir mat doré" (default skin).
 *
 * Layout : SVG 880×168 viewBox, scale via width="100%". Tokens visuels
 * définis dans <defs> ci-dessous. La Phase 2C remplacera ces tokens par
 * un système de skins (acoustique rosewood, électrique érable, etc.).
 *
 * Bug fix Phase 2B : la liste précédente des inlays omettait 12, donc
 * l'octave n'avait pas son double-dot et la fret 12 paraissait "vide".
 */

// Geometry
const W = 880;
const H = 168;
const PAD_L = 30;
const PAD_R = 20;
const PAD_T = 22;
const PAD_B = 22;
const INNER_W = W - PAD_L - PAD_R;
const INNER_H = H - PAD_T - PAD_B;
const STRING_COUNT = 6;
const STRING_SPACING = INNER_H / (STRING_COUNT - 1);

interface Fretboard2DProps {
  tuning?: TuningId;
  numFrets?: number;
  scale?: { key: NoteName; scaleId: ScaleId };
  chord?: { frets: (number | null)[] };
  highlightNotes?: number[];
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
  // Unique IDs prevent collisions if multiple fretboards live on the page.
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `fb-${name}-${uid}`;

  const fretSpacing = INNER_W / numFrets;
  const x = (fret: number) => PAD_L + fret * fretSpacing;
  const y = (stringIdx: number) => PAD_T + (STRING_COUNT - 1 - stringIdx) * STRING_SPACING;
  // stringIdx 0 = low E (bass, drawn at bottom), stringIdx 5 = high E (treble, top)

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

  // Inlay positions. 12 and 24 get a double-dot (octave markers).
  const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].filter((f) => f <= numFrets);

  const openTuning = TUNINGS[tuning];

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        {/* Board — noir mat avec léger éclairage haut */}
        <linearGradient id={id('board')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1c" />
          <stop offset="55%" stopColor="#101012" />
          <stop offset="100%" stopColor="#0a0a0c" />
        </linearGradient>

        {/* Frets — or brillant avec highlight central (effet métal poli) */}
        <linearGradient id={id('fret')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8a7548" />
          <stop offset="50%" stopColor="#f5d97a" />
          <stop offset="100%" stopColor="#8a7548" />
        </linearGradient>

        {/* Nut — os crème */}
        <linearGradient id={id('nut')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#c4b596" />
          <stop offset="50%" stopColor="#fff5dc" />
          <stop offset="100%" stopColor="#9a8966" />
        </linearGradient>

        {/* Pearl inlay — nacre iridescente */}
        <radialGradient id={id('pearl')} cx="0.35" cy="0.35" r="0.75">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
          <stop offset="55%" stopColor="#dee0eb" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#7a7a85" stopOpacity="0.75" />
        </radialGradient>

        {/* Bass strings — bronze / or chaud */}
        <linearGradient id={id('str-bass')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5a4828" />
          <stop offset="50%" stopColor="#d4b76a" />
          <stop offset="100%" stopColor="#3a2c18" />
        </linearGradient>

        {/* Treble strings — argent / chrome clair */}
        <linearGradient id={id('str-treble')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7a7a82" />
          <stop offset="50%" stopColor="#f0f0f4" />
          <stop offset="100%" stopColor="#5a5a62" />
        </linearGradient>

        {/* Note non-tonique — blanc avec ombrage subtil */}
        <radialGradient id={id('note')} cx="0.35" cy="0.3">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c8c8d0" />
        </radialGradient>

        {/* Note tonique — or avec halo */}
        <radialGradient id={id('tonic')} cx="0.35" cy="0.35">
          <stop offset="0%" stopColor="#fbe89a" />
          <stop offset="55%" stopColor="#d4b76a" />
          <stop offset="100%" stopColor="#7a623c" />
        </radialGradient>

        {/* Ombre portée des notes */}
        <filter id={id('note-shadow')} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.8" stdDeviation="1.3" floodOpacity="0.55" />
        </filter>

        {/* Halo doré autour de la tonique */}
        <filter id={id('tonic-glow')} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Légère ombre sous les inlays pour leur donner du relief */}
        <filter id={id('inlay-shadow')} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Board background */}
      <rect
        x={PAD_L}
        y={PAD_T}
        width={INNER_W}
        height={INNER_H}
        fill={`url(#${id('board')})`}
        rx={2}
      />

      {/* Subtle bindings (top : or atténué, bottom : noir profond pour la profondeur) */}
      <rect x={PAD_L} y={PAD_T} width={INNER_W} height={1.3} fill="rgba(212, 183, 106, 0.32)" />
      <rect
        x={PAD_L}
        y={PAD_T + INNER_H - 1.3}
        width={INNER_W}
        height={1.3}
        fill="rgba(0, 0, 0, 0.6)"
      />

      {/* Nut */}
      <rect x={PAD_L - 4} y={PAD_T} width={5} height={INNER_H} fill={`url(#${id('nut')})`} rx={0.5} />

      {/* Pearl inlays (12 et 24 = double-dot octave) */}
      {inlayFrets.map((f) => {
        const cx = x(f) - fretSpacing / 2;
        if (f === 12 || f === 24) {
          return (
            <g key={f} filter={`url(#${id('inlay-shadow')})`}>
              <circle cx={cx} cy={PAD_T + INNER_H * 0.3} r={4.6} fill={`url(#${id('pearl')})`} />
              <circle cx={cx} cy={PAD_T + INNER_H * 0.7} r={4.6} fill={`url(#${id('pearl')})`} />
            </g>
          );
        }
        return (
          <circle
            key={f}
            cx={cx}
            cy={PAD_T + INNER_H / 2}
            r={5}
            fill={`url(#${id('pearl')})`}
            filter={`url(#${id('inlay-shadow')})`}
          />
        );
      })}

      {/* Frets (or métallique) */}
      {Array.from({ length: numFrets }).map((_, i) => (
        <rect
          key={`fret-${i}`}
          x={x(i + 1) - 1}
          y={PAD_T}
          width={2}
          height={INNER_H}
          fill={`url(#${id('fret')})`}
        />
      ))}

      {/* Strings — bass (0-2) en bronze, treble (3-5) en argent */}
      {Array.from({ length: STRING_COUNT }).map((_, i) => {
        const isBass = i < 3;
        // Plus grave = plus épaisse
        const sw = isBass ? 1.7 - i * 0.25 : 1 - (i - 3) * 0.15;
        return (
          <line
            key={`str-${i}`}
            x1={PAD_L}
            y1={y(i)}
            x2={PAD_L + INNER_W}
            y2={y(i)}
            stroke={isBass ? `url(#${id('str-bass')})` : `url(#${id('str-treble')})`}
            strokeWidth={sw}
          />
        );
      })}

      {/* Open string labels (left of nut) */}
      {openTuning.map((midi, i) => (
        <text
          key={`open-${i}`}
          x={PAD_L - 12}
          y={y(i) + 4}
          textAnchor="middle"
          fontFamily="JetBrains Mono"
          fontSize={11}
          fontWeight={700}
          fill="#9a8454"
        >
          {NOTE_NAMES[pitchClass(midi)]}
        </text>
      ))}

      {/* Fret number labels (12 = doré en gras pour rappeler l'octave) */}
      {Array.from({ length: numFrets }).map((_, i) => {
        const fret = i + 1;
        if (![3, 5, 7, 9, 12, 15, 17, 19, 21].includes(fret)) return null;
        return (
          <text
            key={`num-${fret}`}
            x={x(fret) - fretSpacing / 2}
            y={PAD_T + INNER_H + 14}
            textAnchor="middle"
            fontFamily="Inter"
            fontSize={10}
            fontWeight={fret === 12 ? 700 : 400}
            fill={fret === 12 ? '#d4b76a' : '#6a6a6a'}
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
            if (f === 0) return null; // open positions are shown as side labels
            const isTonic = pc === tonicPC;
            const cx = x(f) - fretSpacing / 2;
            return (
              <g key={`note-${sIdx}-${f}`}>
                <circle
                  cx={cx}
                  cy={y(sIdx)}
                  r={isTonic ? 9.5 : 9}
                  fill={isTonic ? `url(#${id('tonic')})` : `url(#${id('note')})`}
                  filter={isTonic ? `url(#${id('tonic-glow')})` : `url(#${id('note-shadow')})`}
                />
                {showNoteNames && (
                  <text
                    x={cx}
                    y={y(sIdx) + 3.5}
                    textAnchor="middle"
                    fontFamily="JetBrains Mono"
                    fontSize={9}
                    fontWeight={700}
                    fill="#0a0a0a"
                  >
                    {NOTE_NAMES[pc]}
                  </text>
                )}
              </g>
            );
          })
        )}

      {/* Chord overlay (positions de l'accord) */}
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
              filter={`url(#${id('note-shadow')})`}
            />
          );
        })}
    </svg>
  );
}
