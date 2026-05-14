import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { useAudio } from '@/hooks/useAudio';
import {
  WEEKLY_RIFFS,
  getRiffOfTheWeek,
  getCurrentISOWeek,
  nextMondayMidnight,
  type WeeklyRiff,
} from '@/lib/riffOfTheWeek';
import { getPattern } from '@/lib/strumPatterns';
import { saveSong, newSongId, newSectionId, type Song } from '@/lib/db';
import {
  CalendarDays,
  Flame,
  Lightbulb,
  Pause,
  Play,
  Plus,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

/**
 * /riff-of-the-week — Riff curé rotatif basé sur la semaine ISO de l'année.
 * Stable toute la semaine, change auto lundi 00:00.
 *
 * - Affiche le riff actuel (chord chart + tip + difficulté)
 * - Bouton Play loop des accords (avec strum pattern conseillé si dispo)
 * - "Ajouter à mes sons" → crée un Song dans Dexie avec le riff comme section
 * - Petit teaser des riffs des semaines passées/futures
 */
export function RiffOfTheWeek() {
  const navigate = useNavigate();
  const riff = useMemo(() => getRiffOfTheWeek(), []);
  const week = useMemo(() => getCurrentISOWeek(), []);
  const countdown = useCountdown(nextMondayMidnight());

  const handleSaveAsSong = async () => {
    const now = Date.now();
    const song: Song = {
      id: newSongId(),
      title: riff.title,
      artist: riff.source,
      key: extractKey(riff.key),
      mode: riff.key.toLowerCase().includes('min') ? 'minor' : 'major',
      tempo: riff.bpm,
      capo: 0,
      tuning: 'standard',
      tags: ['riff-de-la-semaine', riff.genre.toLowerCase()],
      status: 'à bosser',
      sections: [
        {
          id: newSectionId(),
          name: 'Riff',
          chords: riff.chords,
        },
      ],
      notes: `${riff.pitch}\n\n💡 ${riff.tip}`,
      createdAt: now,
      updatedAt: now,
    };
    await saveSong(song);
    navigate(`/songs/${song.id}`);
  };

  return (
    <>
      <PageHeader
        title="Riff de la semaine"
        subtitle={`Semaine ${week} de l'année — change automatiquement lundi 00:00`}
      />

      {/* Hero card */}
      <Card glow className="mb-5">
        <div className="flex items-center gap-2 text-gold">
          <Sparkles size={16} />
          <span className="eyebrow !text-gold">Cette semaine</span>
        </div>
        <h2 className="display mt-2 text-display-md">{riff.title}</h2>
        <p className="mt-1 text-text-muted">{riff.source}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="chip">{riff.genre}</span>
          <span className="chip">{riff.bpm} BPM</span>
          <span className="chip">{riff.key}</span>
          <DifficultyBars difficulty={riff.difficulty} />
        </div>

        <p className="mt-5 text-base text-text">{riff.pitch}</p>

        {/* Tip box */}
        <div className="mt-4 flex gap-3 rounded-xl border border-border-gold bg-gold/5 p-4">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-gold" />
          <p className="text-sm text-text">{riff.tip}</p>
        </div>
      </Card>

      {/* Chord chart + player */}
      <Card className="mb-5">
        <RiffPlayer riff={riff} />
      </Card>

      {/* CTA — save as song */}
      <button
        type="button"
        onClick={handleSaveAsSong}
        className="mb-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gold font-semibold text-bg shadow-gold transition-all hover:bg-gold-bright hover:-translate-y-px"
      >
        <Plus size={18} />
        Ajouter à mes sons pour travailler
      </button>

      {/* Countdown */}
      <Card className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-gold-soft" />
            <span className="text-sm text-text-muted">Prochain riff dans</span>
          </div>
          <span className="font-mono text-base font-bold text-gold">{countdown}</span>
        </div>
      </Card>

      {/* Teaser : aperçu des autres riffs */}
      <div>
        <div className="eyebrow mb-3">Catalogue ({WEEKLY_RIFFS.length} riffs)</div>
        <p className="mb-3 text-sm text-text-muted">
          Tous les riffs disponibles, dans l'ordre où ils sortent au fil des semaines.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {WEEKLY_RIFFS.map((r) => {
            const isCurrent = r.id === riff.id;
            return (
              <div
                key={r.id}
                className={clsx(
                  'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5',
                  isCurrent
                    ? 'border-gold bg-gold/5'
                    : 'border-border bg-surface'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className={clsx('truncate text-sm font-semibold', isCurrent ? 'text-gold' : 'text-text')}>
                    {r.title}
                  </div>
                  <div className="truncate text-xs text-text-soft">
                    {r.source} · {r.genre}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <DifficultyBars difficulty={r.difficulty} compact />
                  {isCurrent && <Flame size={14} className="text-gold-bright" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Riff player ──────────────────────────────────────────────────────

function RiffPlayer({ riff }: { riff: WeeklyRiff }) {
  const { strum } = useAudio();
  const [playing, setPlaying] = useState(false);
  const [activeChordIdx, setActiveChordIdx] = useState<number | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (!playing) {
      cancelRef.current = true;
      setActiveChordIdx(null);
      return;
    }
    cancelRef.current = false;
    const beatMs = 60000 / riff.bpm;
    let idx = 0;

    (async () => {
      while (!cancelRef.current) {
        const c = riff.chords[idx % riff.chords.length];
        setActiveChordIdx(idx % riff.chords.length);
        void strum(c.name, 'down');
        await new Promise((r) => setTimeout(r, c.beats * beatMs));
        idx++;
        if (idx > riff.chords.length * 8) {
          setPlaying(false);
          break;
        }
      }
      setActiveChordIdx(null);
    })();

    return () => {
      cancelRef.current = true;
    };
  }, [playing, riff, strum]);

  const pattern = riff.strumPatternId ? getPattern(riff.strumPatternId) : undefined;

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="display text-display-sm">Chord chart</h3>
        {pattern && (
          <span className="chip text-[10px]">Pattern conseillé : {pattern.name}</span>
        )}
      </div>

      {/* Chord chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {riff.chords.map((c, i) => (
          <div
            key={i}
            className={clsx(
              'flex h-12 items-center gap-2 rounded-xl border px-3 transition-all',
              activeChordIdx === i
                ? 'border-gold bg-gold/15 text-gold-bright shadow-gold scale-105'
                : 'border-border bg-surface text-gold'
            )}
          >
            <span className="font-mono text-base font-bold">{c.name}</span>
            <span className="text-[10px] text-text-soft">{c.beats}t</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPlaying(!playing)}
        className={clsx(
          'mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold transition-all',
          playing
            ? 'border border-danger/40 bg-danger/15 text-danger hover:bg-danger/25'
            : 'bg-gold text-bg shadow-gold hover:bg-gold-bright hover:-translate-y-px'
        )}
      >
        {playing ? (
          <>
            <Pause size={18} fill="currentColor" /> Stop
          </>
        ) : (
          <>
            <Play size={18} fill="currentColor" /> Écouter en boucle
          </>
        )}
      </button>
    </>
  );
}

// ─── Difficulty bars ──────────────────────────────────────────────────

function DifficultyBars({
  difficulty,
  compact = false,
}: {
  difficulty: number;
  compact?: boolean;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-0.5',
        !compact && 'chip !gap-1'
      )}
      title={`Difficulté ${difficulty}/5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={clsx(
            'inline-block rounded-sm',
            compact ? 'h-2 w-1' : 'h-2.5 w-1.5',
            n <= difficulty ? 'bg-gold' : 'bg-border'
          )}
        />
      ))}
      {!compact && <span className="ml-1 font-mono text-[10px]">{difficulty}/5</span>}
    </span>
  );
}

// ─── Countdown hook ───────────────────────────────────────────────────

function useCountdown(target: Date): string {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000); // tick par minute
    return () => clearInterval(id);
  }, []);

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "Maintenant — recharge la page !";
  const totalMin = Math.floor(diffMs / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const minutes = totalMin % 60;
  if (days > 0) return `${days}j ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// ─── Helpers ──────────────────────────────────────────────────────────

import type { NoteName } from '@/lib/theory';
import { NOTE_NAMES } from '@/lib/theory';

/** Extrait la note racine ("C", "F#", etc.) depuis un libellé de clé libre. */
function extractKey(key: string): NoteName {
  // Cherche un nom de note au début, ex: "E minor", "F# minor (capo…)", "C major"
  const match = key.match(/^([A-G][#b]?)/);
  if (!match) return 'C';
  const raw = match[1];
  // Normalise les bémols vers le dièse équivalent
  const flatToSharp: Record<string, NoteName> = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
  };
  if (raw in flatToSharp) return flatToSharp[raw];
  if (NOTE_NAMES.includes(raw as NoteName)) return raw as NoteName;
  return 'C';
}
