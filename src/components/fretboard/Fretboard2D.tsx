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
import {
  getSkin,
  type FretboardSkin,
  type FretboardSkinId,
  type HeadstockType,
} from '@/lib/fretboardSkins';

/**
 * Premium 2D fretboard. Couleurs pilotées par un skin (Phase 2C).
 *
 * Bugs fixés :
 *  - Fret 12 (octave) avait perdu son double-dot car 12 manquait dans
 *    la liste des inlays. Corrigé.
 *  - Les cordes disparaissaient sur mobile à cause du sub-pixel scaling
 *    (viewBox 880 scale à ~0.38x sur 375px → strokes < 1px = invisibles).
 *    Corrigé avec `vectorEffect="non-scaling-stroke"` : les cordes
 *    gardent leur épaisseur écran peu importe le zoom du SVG.
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
  skin?: FretboardSkinId;
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
  skin = 'noir-mat',
  className,
}: Fretboard2DProps) {
  // Unique IDs prevent collisions if multiple fretboards live on the page.
  const uid = useId().replace(/:/g, '');
  const id = (name: string) => `fb-${name}-${uid}`;

  const s = getSkin(skin);
  // Headstock désactivée volontairement (le rendu n'est pas au niveau, on y
  // reviendra plus tard). Les tokens skin.headstock et skin.peg restent dans
  // le type pour préserver l'archi.
  const headstockWidth = 0;

  const fretSpacing = INNER_W / numFrets;
  const x = (fret: number) => PAD_L + fret * fretSpacing;
  const y = (stringIdx: number) => PAD_T + (STRING_COUNT - 1 - stringIdx) * STRING_SPACING;
  // stringIdx 0 = low E (bass, drawn at bottom), 5 = high E (treble, top)

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

  // Inlays — 12 et 24 ont un double-dot (marqueurs d'octave).
  const inlayFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].filter((f) => f <= numFrets);

  const openTuning = TUNINGS[tuning];

  return (
    <svg
      width="100%"
      viewBox={`${-headstockWidth} 0 ${W + headstockWidth} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={id('board')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={s.board[0]} />
          <stop offset="55%" stopColor={s.board[1]} />
          <stop offset="100%" stopColor={s.board[2]} />
        </linearGradient>

        <linearGradient id={id('fret')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={s.fret[0]} />
          <stop offset="50%" stopColor={s.fret[1]} />
          <stop offset="100%" stopColor={s.fret[2]} />
        </linearGradient>

        <linearGradient id={id('nut')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={s.nut[0]} />
          <stop offset="50%" stopColor={s.nut[1]} />
          <stop offset="100%" stopColor={s.nut[2]} />
        </linearGradient>

        <radialGradient id={id('pearl')} cx="0.35" cy="0.35" r="0.75">
          <stop offset="0%" stopColor={s.pearl[0]} stopOpacity="0.96" />
          <stop offset="55%" stopColor={s.pearl[1]} stopOpacity="0.88" />
          <stop offset="100%" stopColor={s.pearl[2]} stopOpacity="0.78" />
        </radialGradient>

        {/* Tuning pegs gradient — fallback sur pearl si le skin ne le surcharge pas */}
        <radialGradient id={id('pegs')} cx="0.3" cy="0.3" r="0.7">
          <stop offset="0%" stopColor={s.peg?.[0] ?? s.pearl[0]} />
          <stop offset="55%" stopColor={s.peg?.[1] ?? s.pearl[1]} />
          <stop offset="100%" stopColor={s.peg?.[2] ?? s.pearl[2]} />
        </radialGradient>

        {/*
          Strings — gradientUnits="userSpaceOnUse" avec coords absolues.
          Crucial : sur <line> horizontale, la bounding box a height=0
          donc objectBoundingBox (défaut) rend des coords dégénérées et
          Chrome ne dessine rien (cordes invisibles). userSpaceOnUse
          utilise le système de coords du SVG (en pixels viewBox), ce qui
          fonctionne quelle que soit la forme de la bbox. Le commit
          d2747d5 (vertical → horizontal) n'a pas suffi car c'était
          l'unit qui posait problème, pas la direction.
        */}
        <linearGradient
          id={id('str-bass')}
          gradientUnits="userSpaceOnUse"
          x1={PAD_L}
          y1={0}
          x2={PAD_L + INNER_W}
          y2={0}
        >
          <stop offset="0%" stopColor={s.bassString[0]} />
          <stop offset="50%" stopColor={s.bassString[1]} />
          <stop offset="100%" stopColor={s.bassString[2]} />
        </linearGradient>

        <linearGradient
          id={id('str-treble')}
          gradientUnits="userSpaceOnUse"
          x1={PAD_L}
          y1={0}
          x2={PAD_L + INNER_W}
          y2={0}
        >
          <stop offset="0%" stopColor={s.trebleString[0]} />
          <stop offset="50%" stopColor={s.trebleString[1]} />
          <stop offset="100%" stopColor={s.trebleString[2]} />
        </linearGradient>

        <radialGradient id={id('note')} cx="0.35" cy="0.3">
          <stop offset="0%" stopColor={s.note[0]} />
          <stop offset="100%" stopColor={s.note[1]} />
        </radialGradient>

        <radialGradient id={id('tonic')} cx="0.35" cy="0.35">
          <stop offset="0%" stopColor={s.tonic[0]} />
          <stop offset="55%" stopColor={s.tonic[1]} />
          <stop offset="100%" stopColor={s.tonic[2]} />
        </radialGradient>

        <filter id={id('note-shadow')} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1.8" stdDeviation="1.3" floodOpacity="0.55" />
        </filter>

        <filter id={id('tonic-glow')} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={id('inlay-shadow')} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodOpacity="0.45" />
        </filter>
      </defs>

      {/* Headstock désactivée — voir commentaire dans le corps du composant.
          Le composant HeadstockSvg reste défini en bas du fichier pour usage
          futur. */}

      {/* Board */}
      <rect
        x={PAD_L}
        y={PAD_T}
        width={INNER_W}
        height={INNER_H}
        fill={`url(#${id('board')})`}
        rx={2}
      />

      {/* Bindings (top : ton skin, bottom : profondeur sombre) */}
      <rect x={PAD_L} y={PAD_T} width={INNER_W} height={1.3} fill={s.bindingTop} />
      <rect
        x={PAD_L}
        y={PAD_T + INNER_H - 1.3}
        width={INNER_W}
        height={1.3}
        fill={s.bindingBottom}
      />

      {/* Nut */}
      <rect x={PAD_L - 4} y={PAD_T} width={5} height={INNER_H} fill={`url(#${id('nut')})`} rx={0.5} />

      {/* Inlays */}
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

      {/* Frets */}
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

      {/* Strings — vectorEffect non-scaling-stroke pour rester visibles
          quand le SVG est compressé sur mobile (sinon < 1px = sub-pixel). */}
      {Array.from({ length: STRING_COUNT }).map((_, i) => {
        const isBass = i < 3;
        // Différenciation par épaisseur écran (pas par échelle SVG).
        const sw = isBass ? 2.2 - i * 0.3 : 1.3 - (i - 3) * 0.15;
        return (
          <line
            key={`str-${i}`}
            x1={PAD_L}
            y1={y(i)}
            x2={PAD_L + INNER_W}
            y2={y(i)}
            stroke={isBass ? `url(#${id('str-bass')})` : `url(#${id('str-treble')})`}
            strokeWidth={sw}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}

      {/* Open string labels — toujours juste avant le nut (entre la dernière
          colonne de pegs et le nut, lisible sur tous les skins). */}
      {openTuning.map((midi, i) => (
        <text
          key={`open-${i}`}
          x={PAD_L - 12}
          y={y(i) + 4}
          textAnchor="middle"
          fontFamily="JetBrains Mono"
          fontSize={11}
          fontWeight={700}
          fill={s.openLabel}
        >
          {NOTE_NAMES[pitchClass(midi)]}
        </text>
      ))}

      {/* Fret number labels */}
      {Array.from({ length: numFrets }).map((_, i) => {
        const fret = i + 1;
        if (![3, 5, 7, 9, 12, 15, 17, 19, 21].includes(fret)) return null;
        const isOctave = fret === 12;
        return (
          <text
            key={`num-${fret}`}
            x={x(fret) - fretSpacing / 2}
            y={PAD_T + INNER_H + 14}
            textAnchor="middle"
            fontFamily="Inter"
            fontSize={10}
            fontWeight={isOctave ? 700 : 400}
            fill={isOctave ? s.fret12Label : '#6a6a6a'}
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
            if (f === 0) return null;
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
              filter={`url(#${id('note-shadow')})`}
            />
          );
        })}
    </svg>
  );
}

/**
 * Headstock épurée à gauche du nut. Stylisée (pas hyper-réaliste) :
 * juste assez pour donner le contexte instrument.
 *
 *  - dreadnought : forme trapézoïdale + 6 pegs nacre disposés 3+3
 *  - strat       : forme allongée + 6 pegs chrome en ligne sur le haut
 */
function HeadstockSvg({
  type,
  width,
  skin,
  boardFill,
  pegsFill,
  nutFill,
}: {
  type: HeadstockType;
  width: number;
  skin: FretboardSkin;
  boardFill: string;
  pegsFill: string;
  nutFill: string;
}) {
  const tipX = -width;
  const baseX = PAD_L - 6; // s'arrête juste avant le nut (qui démarre à PAD_L - 4)
  const yTop = PAD_T;
  const yBot = PAD_T + INNER_H;

  if (type === 'dreadnought') {
    // Paddle arrondie symétrique. Les 2 coins gauches sont des quarts de cercle
    // (SVG arc). Réminescent d'une dreadnought ou classique.
    const r = 18;
    const boardPath =
      `M ${baseX} ${yTop}` +
      ` L ${tipX + r} ${yTop}` +
      ` A ${r} ${r} 0 0 0 ${tipX} ${yTop + r}` +
      ` L ${tipX} ${yBot - r}` +
      ` A ${r} ${r} 0 0 0 ${tipX + r} ${yBot}` +
      ` L ${baseX} ${yBot}` +
      ` Z`;
    const bindingTopPath =
      `M ${baseX} ${yTop}` +
      ` L ${tipX + r} ${yTop}` +
      ` A ${r} ${r} 0 0 0 ${tipX} ${yTop + r}`;
    const bindingBotPath =
      `M ${tipX} ${yBot - r}` +
      ` A ${r} ${r} 0 0 0 ${tipX + r} ${yBot}` +
      ` L ${baseX} ${yBot}`;
    // 3 pegs top + 3 pegs bottom, étalés sur la largeur disponible
    const pegStartX = tipX + 18;
    const pegSpacing = (baseX - 40 - pegStartX) / 2;
    return (
      <g>
        <path d={boardPath} fill={boardFill} />
        <path
          d={bindingTopPath}
          stroke={skin.bindingTop}
          strokeWidth={1.3}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={bindingBotPath}
          stroke={skin.bindingBottom}
          strokeWidth={1.3}
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {[0, 1, 2].map((i) => (
          <circle
            key={`peg-top-${i}`}
            cx={pegStartX + i * pegSpacing}
            cy={yTop + 14}
            r={3.4}
            fill={pegsFill}
          />
        ))}
        {[0, 1, 2].map((i) => (
          <circle
            key={`peg-bot-${i}`}
            cx={pegStartX + i * pegSpacing}
            cy={yBot - 14}
            r={3.4}
            fill={pegsFill}
          />
        ))}
        {/* Subtle nut-tone strip on the tip pour suggérer le bord sculpté */}
        <rect
          x={tipX + 0.5}
          y={yTop + r}
          width={2}
          height={yBot - yTop - 2 * r}
          fill={nutFill}
          opacity={0.6}
          rx={1}
        />
      </g>
    );
  }

  // Strat : forme paddle asymétrique allongée. Bord haut court, bord bas
  // plus prononcé qui se courbe → vibe Strat 6-in-line.
  const rTop = 12;
  const rBot = 28;
  const boardPath =
    `M ${baseX} ${yTop}` +
    ` L ${tipX + rTop} ${yTop}` +
    ` A ${rTop} ${rTop} 0 0 0 ${tipX} ${yTop + rTop}` +
    ` L ${tipX} ${yBot - rBot}` +
    ` A ${rBot} ${rBot} 0 0 0 ${tipX + rBot} ${yBot}` +
    ` L ${baseX} ${yBot}` +
    ` Z`;
  const bindingTopPath =
    `M ${baseX} ${yTop}` +
    ` L ${tipX + rTop} ${yTop}` +
    ` A ${rTop} ${rTop} 0 0 0 ${tipX} ${yTop + rTop}`;
  const bindingBotPath =
    `M ${tipX} ${yBot - rBot}` +
    ` A ${rBot} ${rBot} 0 0 0 ${tipX + rBot} ${yBot}` +
    ` L ${baseX} ${yBot}`;
  // 6 pegs in-line le long du bord haut, étalés
  const pegStartX = tipX + 16;
  const pegEndX = baseX - 30;
  const pegSpacing = (pegEndX - pegStartX) / 5;
  return (
    <g>
      <path d={boardPath} fill={boardFill} />
      <path
        d={bindingTopPath}
        stroke={skin.bindingTop}
        strokeWidth={1.3}
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={bindingBotPath}
        stroke={skin.bindingBottom}
        strokeWidth={1.3}
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={`peg-${i}`}
          cx={pegStartX + i * pegSpacing}
          cy={yTop + 14}
          r={2.8}
          fill={pegsFill}
        />
      ))}
      <rect
        x={tipX + 0.5}
        y={yTop + rTop}
        width={2}
        height={yBot - yTop - rTop - rBot}
        fill={nutFill}
        opacity={0.6}
        rx={1}
      />
    </g>
  );
}
