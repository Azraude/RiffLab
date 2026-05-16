import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  deleteRecording,
  listRecordings,
  newRecordingId,
  saveRecording,
  type Recording,
} from '@/lib/db';
import { useRecorder } from '@/hooks/useRecorder';
import { WaveformView } from './WaveformView';
import { Mic, MicOff, Play, Pause, Trash2, Square, Share2 } from 'lucide-react';
import clsx from 'clsx';

/**
 * Section "Mes enregistrements" affichée sur SongDetail.
 *
 * - Bouton REC rond rouge pulsant pendant capture
 * - Timer mm:ss en live
 * - Visualisation niveau audio (waveform glissante via levels du hook)
 * - Liste des recordings du song : date, durée, play, delete
 */
export function RecorderSection({ songId }: { songId: string }) {
  const recordings = useLiveQuery(() => listRecordings(songId), [songId]);
  const recorder = useRecorder();

  // À l'arrêt du recorder, persister le blob
  useEffect(() => {
    if (recorder.blob && recorder.durationMs > 0) {
      void saveRecording({
        id: newRecordingId(),
        songId,
        blob: recorder.blob,
        mimeType: recorder.mimeType,
        durationMs: Math.round(recorder.durationMs),
        createdAt: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.blob]);

  const isRecording = recorder.state === 'recording';
  const isRequesting = recorder.state === 'requesting';
  const isDenied = recorder.state === 'denied' || recorder.state === 'error';

  return (
    <section className="mt-8">
      <h2 className="eyebrow mb-4">Mes enregistrements</h2>

      {/* Bouton REC + status */}
      <div className="rounded-2xl border border-border bg-surface-2 p-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={isRecording ? recorder.stop : recorder.start}
            disabled={isRequesting}
            aria-label={isRecording ? 'Arrêter' : 'Démarrer enregistrement'}
            className={clsx(
              'flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-all',
              isRecording
                ? 'bg-danger text-white animate-pulse shadow-[0_0_24px_rgba(212,104,94,0.6)]'
                : 'bg-danger/15 text-danger hover:bg-danger/25 hover:scale-105',
              isRequesting && 'opacity-60'
            )}
          >
            {isRecording ? (
              <Square size={22} fill="currentColor" />
            ) : (
              <Mic size={26} strokeWidth={2} />
            )}
          </button>

          <div className="min-w-0 flex-1">
            {isRecording ? (
              <>
                <div className="font-mono text-2xl font-bold text-danger">
                  {formatTime(recorder.durationMs)}
                </div>
                <div className="text-xs text-text-soft">En enregistrement…</div>
                {/* Live waveform */}
                <LiveLevels levels={recorder.levels} />
              </>
            ) : isDenied ? (
              <>
                <div className="flex items-center gap-2 text-sm font-semibold text-danger">
                  <MicOff size={14} /> Micro indisponible
                </div>
                <div className="mt-0.5 text-xs text-text-muted">{recorder.error}</div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-text">
                  {recordings && recordings.length > 0
                    ? `${recordings.length} essai${recordings.length > 1 ? 's' : ''} enregistré${recordings.length > 1 ? 's' : ''}`
                    : 'Aucun essai pour ce song'}
                </div>
                <div className="mt-0.5 text-xs text-text-soft">
                  Tap le micro pour démarrer. Le son est gardé en local (Dexie/IndexedDB).
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Liste */}
      {recordings && recordings.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {recordings.map((rec) => (
            <li key={rec.id}>
              <RecordingRow recording={rec} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────

function LiveLevels({ levels }: { levels: number[] }) {
  const max = Math.max(0.05, ...levels);
  return (
    <div className="mt-2 flex h-8 items-center gap-[2px]">
      {levels.map((l, i) => {
        const h = Math.max(2, (l / max) * 100);
        return (
          <div
            key={i}
            className="flex-1 rounded-full bg-danger/70"
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}

function RecordingRow({ recording }: { recording: Recording }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0-1
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(recording.blob);
    const a = new Audio(url);
    a.preload = 'metadata';
    setAudio(a);
    return () => {
      a.pause();
      URL.revokeObjectURL(url);
    };
  }, [recording.blob]);

  useEffect(() => {
    if (!audio) return;
    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    };
    const onEnd = () => {
      setPlaying(false);
      setProgress(0);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnd);
    };
  }, [audio]);

  const toggle = () => {
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer cet essai ?')) return;
    audio?.pause();
    await deleteRecording(recording.id);
  };

  const handleShare = async () => {
    try {
      if (navigator.share && navigator.canShare?.({ files: [new File([recording.blob], 'rec.webm', { type: recording.mimeType })] })) {
        await navigator.share({
          files: [new File([recording.blob], `rec-${recording.id}.webm`, { type: recording.mimeType })],
          title: 'Enregistrement RiffLab',
        });
      } else {
        // Fallback : download
        const url = URL.createObjectURL(recording.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rifflab-${recording.id}.webm`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Cancelled or unsupported
    }
  };

  const date = new Date(recording.createdAt);
  const dateLabel = date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? 'Pause' : 'Lecture'}
        className={clsx(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
          playing ? 'bg-gold text-bg' : 'bg-surface-2 text-gold hover:bg-gold/15'
        )}
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-text-muted">{dateLabel}</span>
          <span className="font-mono text-text-soft">{formatTime(recording.durationMs)}</span>
        </div>
        {/* Waveform interactive (click pour seek) */}
        <div className="mt-1.5">
          <WaveformView
            blob={recording.blob}
            progress={progress}
            onSeek={(ratio) => {
              if (!audio) return;
              audio.currentTime = ratio * audio.duration;
              setProgress(ratio);
            }}
            height={28}
            bars={100}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleShare}
        aria-label="Partager"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-soft hover:bg-surface-2 hover:text-gold"
      >
        <Share2 size={14} />
      </button>
      <button
        type="button"
        onClick={handleDelete}
        aria-label="Supprimer"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-soft hover:bg-danger/10 hover:text-danger"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}
