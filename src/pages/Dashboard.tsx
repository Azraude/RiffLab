import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Card, CardTitle } from '@/components/ui/Card';
import { ChordDiagram } from '@/components/chord/ChordDiagram';
import { Fretboard2D } from '@/components/fretboard/Fretboard2D';
import {
  db,
  logSession,
  todaysSession,
  computeStreak,
  lastSevenDays,
  todayKey,
} from '@/lib/db';
import { CHORDS, getDefaultVoicing } from '@/lib/chordDatabase';
import { SCALES } from '@/lib/scaleDatabase';
import { NOTE_NAMES, type NoteName, type ScaleId } from '@/lib/theory';
import { useAudio } from '@/hooks/useAudio';
import { usePrefs } from '@/stores/prefsStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Play, Check, Flame } from 'lucide-react';
import clsx from 'clsx';

/**
 * Pseudo-random daily picks based on the date.
 * Same day → same chord/scale, so the user sees stable content all day.
 */
function dailyHash(salt: string): number {
  const day = new Date().toISOString().slice(0, 10) + salt;
  let h = 0;
  for (let i = 0; i < day.length; i++) h = (h * 31 + day.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickOfTheDay() {
  const chord = CHORDS[dailyHash('chord') % CHORDS.length];
  const scale = SCALES[dailyHash('scale') % SCALES.length];
  const key = NOTE_NAMES[dailyHash('key') % NOTE_NAMES.length] as NoteName;
  return { chord, scale, key };
}

export function Dashboard() {
  const songs = useLiveQuery(() => db.songs.orderBy('updatedAt').reverse().limit(3).toArray(), []);
  const { chord, scale, key } = useMemo(pickOfTheDay, []);
  const { strum } = useAudio();
  const fretboardSkin = usePrefs((s) => s.fretboardSkin);

  // Practice tracking : session du jour + streak + 7 derniers jours
  const today = useLiveQuery(() => todaysSession(), []);
  const streak = useLiveQuery(() => computeStreak(), [today]);
  const weekDays = useLiveQuery(() => lastSevenDays(), [today]);
  const practicedToday = today?.completed === true;

  const markPracticed = async () => {
    if (practicedToday) return;
    await logSession({
      date: todayKey(),
      chord: chord.name,
      scale: scale.id,
      progression: [],
      completed: true,
    });
  };

  const todayLabel = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const voicing = chord.voicings[0];

  return (
    <>
      <PageHeader title="Bon retour, Melvin.">
        <Link
          to="/songs/new"
          className="hidden h-10 items-center justify-center rounded-xl bg-gold px-4 text-sm font-semibold text-bg transition-all hover:bg-gold-bright md:inline-flex"
        >
          + Nouveau son
        </Link>
      </PageHeader>

      {/* Daily hero */}
      <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
        <div
          className="relative overflow-hidden rounded-3xl border border-border-gold p-5 md:p-8"
          style={{
            background: 'linear-gradient(135deg, #1a1812 0%, #141414 60%)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-40 h-[400px] w-[400px] rounded-full opacity-60"
            style={{
              background:
                'radial-gradient(circle, rgba(245,217,122,0.12) 0%, transparent 60%)',
            }}
          />
          <div className="relative">
            <div className="eyebrow">Entraînement du jour · {todayLabel}</div>
            <h2 className="display mt-3 text-display-sm md:text-display-lg">
              Travaille l'accord <span className="text-gold">{chord.name}</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm text-text-muted md:text-base">
              Combine-le avec la gamme <strong className="text-text">{scale.name}</strong> en{' '}
              <strong className="text-text">{key}</strong> pour {scale.mood.toLowerCase()}.
            </p>

            {/* Mobile : ChordDiagram dominant in lg, centered under the title */}
            <div className="mt-6 flex justify-center md:hidden">
              <ChordDiagram voicing={voicing} name={chord.name} size="lg" />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 md:flex md:flex-wrap md:items-center md:gap-7">
              <div>
                <div className="label-small">Accord</div>
                <div className="mt-1 font-mono text-lg font-semibold">{chord.name}</div>
              </div>
              <div>
                <div className="label-small">Gamme</div>
                <div className="mt-1 font-mono text-lg font-semibold">
                  {key} {scale.shortName}
                </div>
              </div>
              <div>
                <div className="label-small">Catégorie</div>
                <div className="mt-1 font-mono text-lg font-semibold">{scale.category}</div>
              </div>

              {/* Desktop : ChordDiagram inline right */}
              <div className="ml-auto hidden md:block">
                <ChordDiagram voicing={voicing} name={chord.name} size="md" />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => strum(chord.name)}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:bg-gold-bright md:h-10"
              >
                <Play size={14} /> Entendre l'accord
              </button>
              <Link
                to="/scales"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border-gold px-4 text-sm hover:bg-gold/5 md:h-10"
              >
                Voir la gamme sur le manche
              </Link>
              <button
                type="button"
                onClick={markPracticed}
                disabled={practicedToday}
                className={clsx(
                  'inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition-all md:h-10',
                  practicedToday
                    ? 'cursor-default border border-success/40 bg-success/10 text-success'
                    : 'border border-border-gold text-text hover:bg-gold/5'
                )}
              >
                <Check size={16} />
                {practicedToday ? 'Fait ✓ aujourd\'hui' : "J'ai pratiqué aujourd'hui"}
              </button>
            </div>
          </div>
        </div>

        {/* Streak card — vraies données depuis sessions Dexie */}
        <Card className="text-center">
          <CardTitle>Série</CardTitle>
          <div className="mt-1 flex items-center justify-center gap-2">
            <div className="display text-[40px] leading-none text-gold md:text-[64px]">
              {streak ?? 0}
            </div>
            {(streak ?? 0) > 0 && (
              <Flame size={28} className="text-gold-bright md:h-9 md:w-9" />
            )}
          </div>
          <div className="label-small mt-2">
            jour{(streak ?? 0) > 1 ? 's' : ''} d'affilée
          </div>
          <div className="mt-4 flex justify-center gap-1.5">
            {(weekDays ?? []).map((d) => {
              const isToday = d.date === todayKey();
              return (
                <div
                  key={d.date}
                  title={d.date}
                  className={clsx(
                    'flex h-6 w-6 items-center justify-center rounded-full text-[10px] md:h-7 md:w-7 md:text-[11px]',
                    d.practiced
                      ? 'border border-gold-soft bg-gold/20 font-semibold text-gold'
                      : 'border border-border text-text-soft',
                    isToday && !d.practiced && 'ring-1 ring-gold-soft/50'
                  )}
                >
                  {d.weekday}
                </div>
              );
            })}
          </div>
          <Link
            to="/stats"
            className="mt-3 inline-block text-xs text-gold hover:text-gold-bright"
          >
            Voir mes stats →
          </Link>
        </Card>
      </div>

      {/* Scale preview */}
      <div className="mt-10">
        <h2 className="eyebrow mb-3">Gamme du jour — {key} {scale.name}</h2>
        <Card>
          <div className="relative -mx-2 overflow-x-auto">
            <Fretboard2D
              numFrets={12}
              scale={{ key, scaleId: scale.id as ScaleId }}
              skin={fretboardSkin}
              className="min-w-[640px]"
            />
            {/* Mobile scroll hint: fade right edge so user sees content continues */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-surface to-transparent md:hidden" />
          </div>
        </Card>
      </div>

      {/* Recent songs */}
      <div className="mt-12">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="display text-display-sm">Tes sons récents</h2>
          <Link to="/songs" className="text-sm text-gold hover:text-gold-bright">
            Voir tout →
          </Link>
        </div>

        {!songs ? (
          <div className="text-text-soft">Chargement…</div>
        ) : songs.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-text-muted">Pas encore de sons. Ajoute ton premier !</p>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {songs.map((s) => {
              const chords = Array.from(
                new Set(s.sections.flatMap((sec) => sec.chords.map((c) => c.name)))
              ).slice(0, 5);
              return (
                <Link key={s.id} to={`/songs/${s.id}`}>
                  <Card hover className="cursor-pointer">
                    <h3 className="display text-[22px] leading-tight">{s.title}</h3>
                    {s.artist && <p className="mt-0.5 text-sm text-text-muted">{s.artist}</p>}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {chords.map((c) => (
                        <span key={c} className="chip">
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-text-soft">
                      <span>♩ {s.tempo} BPM</span>
                      <span>● {s.status}</span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
