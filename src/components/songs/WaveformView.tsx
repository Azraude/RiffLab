import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';

/**
 * WaveformView — affiche la forme d'onde d'un blob audio en SVG bars.
 *
 * Au mount : décode le blob via OfflineAudioContext.decodeAudioData,
 * downsample en N peaks (max abs sur les samples d'un bucket), render
 * une suite de barres verticales SVG.
 *
 * Progress (0-1) anime la couleur des barres : passées en gold solide,
 * non-passées en gold-soft transparent. Curseur vertical optionnel.
 *
 * Click → onSeek(0-1) pour permettre le jump au timestamp.
 */
interface WaveformViewProps {
  blob: Blob;
  /** Position de lecture 0-1. Défaut 0. */
  progress?: number;
  /** Callback quand l'user click pour seek. */
  onSeek?: (ratio: number) => void;
  /** Nombre de barres dans la waveform. Défaut 120. */
  bars?: number;
  /** Hauteur de la SVG en px. Défaut 36. */
  height?: number;
  className?: string;
}

export function WaveformView({
  blob,
  progress = 0,
  onSeek,
  bars = 120,
  height = 36,
  className,
}: WaveformViewProps) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    setLoading(true);
    setPeaks(null);

    decodeBlobToPeaks(blob, bars)
      .then((p) => {
        if (cancelledRef.current) return;
        setPeaks(p);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[WaveformView] decode failed', err);
        setPeaks(null);
        setLoading(false);
      });

    return () => {
      cancelledRef.current = true;
    };
  }, [blob, bars]);

  const handleClick = (e: React.MouseEvent<SVGElement>) => {
    if (!onSeek) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)));
  };

  // Fallback affichage pendant le décodage : barres uniformes
  const displayPeaks = useMemo(() => {
    if (peaks) return peaks;
    return Array.from({ length: bars }, () => 0.4);
  }, [peaks, bars]);

  const cursorIdx = Math.floor(progress * bars);

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${bars} ${height}`}
      preserveAspectRatio="none"
      className={clsx('cursor-pointer', loading && 'opacity-60', className)}
      onClick={handleClick}
      aria-label="Forme d'onde"
    >
      {displayPeaks.map((peak, i) => {
        const barHeight = Math.max(2, peak * height);
        const y = (height - barHeight) / 2;
        const isPast = i < cursorIdx;
        return (
          <rect
            key={i}
            x={i + 0.15}
            y={y}
            width={0.7}
            height={barHeight}
            fill={
              isPast
                ? 'rgb(var(--gold-bright))'
                : 'rgb(var(--gold) / 0.35)'
            }
            rx={0.3}
          />
        );
      })}
      {/* Curseur vertical au position progress */}
      {progress > 0 && progress < 1 && (
        <rect
          x={cursorIdx - 0.5}
          y={0}
          width={1}
          height={height}
          fill="rgb(var(--gold-bright))"
          opacity={0.9}
        />
      )}
    </svg>
  );
}

// ─── Decoder helper ────────────────────────────────────────────────────

/**
 * Décode un blob audio en N peaks. Use AudioContext.decodeAudioData puis
 * downsample : pour chaque bucket de samples, prend la valeur max abs.
 *
 * Note : decodeAudioData attend un ArrayBuffer mutable, donc on slice
 * le blob.
 */
async function decodeBlobToPeaks(blob: Blob, n: number): Promise<number[]> {
  const arrayBuffer = await blob.arrayBuffer();
  // Utilise un AudioContext temporaire jetable (le navigateur le ferme à GC)
  const Ctx = window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) throw new Error('AudioContext not supported');
  const ctx = new Ctx();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
  } finally {
    void ctx.close();
  }
  // Mix-down stereo → mono en moyennant les canaux
  const channelCount = audioBuffer.numberOfChannels;
  const channels: Float32Array[] = [];
  for (let c = 0; c < channelCount; c++) {
    channels.push(audioBuffer.getChannelData(c));
  }
  const totalSamples = channels[0].length;
  const bucketSize = Math.max(1, Math.floor(totalSamples / n));
  const peaks: number[] = [];
  for (let i = 0; i < n; i++) {
    const start = i * bucketSize;
    const end = Math.min(start + bucketSize, totalSamples);
    let maxAbs = 0;
    for (let s = start; s < end; s++) {
      let avg = 0;
      for (let c = 0; c < channelCount; c++) {
        avg += channels[c][s];
      }
      avg /= channelCount;
      const abs = Math.abs(avg);
      if (abs > maxAbs) maxAbs = abs;
    }
    peaks.push(maxAbs);
  }
  // Normalise : le pic max = 1.0 (pour bien voir les détails même si le
  // recording est faible en volume)
  const max = Math.max(...peaks, 0.001);
  return peaks.map((p) => Math.min(1, p / max));
}
