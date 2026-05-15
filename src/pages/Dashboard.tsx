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
import { Play, Check, Flame, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { getRiffOfTheWeek } from '@/lib/riffOfTheWeek';
import { SongTileSkeleton } from '@/components/ui/Skeleton';
import { FloatingGuitar3DLazy } from '@/components/three/FloatingGuitar3DLazy';

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
  const weeklyRiff = useMemo(() => getRiffOfTheWeek(), []);
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
      <PageHeader title={<DashboardGreeting name="Melvin" />}>
        <Link
          to="/songs/new"
          className="group relative hidden h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px md:inline-flex"
        >
          <span className="pointer-events-none absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 group-hover:left-full" />
          <span className="relative inline-flex items-center gap-2">
            <span className="font-serif italic text-base leading-none transition-transform group-hover:rotate-90">+</span>
            Nouveau son
          </span>
        </Link>
      </PageHeader>

      {/* Daily hero */}
      <div className="grid gap-5 md:grid-cols-[2fr_1fr]">
        <div
          className="daily-gold-sheen relative overflow-hidden rounded-3xl border border-border-gold p-5 md:p-8"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--surface)) 0%, rgb(var(--bg)) 60%)',
          }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-40 h-[400px] w-[400px] rounded-full opacity-60"
            style={{
              background:
                'radial-gradient(circle, rgba(245,217,122,0.12) 0%, transparent 60%)',
            }}
          />
          {/* Fender Rose 3D décoratif : à droite de la card, derrière le
              contenu. Opacity 0.3, intensité subtle pour ne pas distraire
              du training info. Visible desktop seulement (card étroite
              en mobile). */}
          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[50%] opacity-30 md:block">
            <FloatingGuitar3DLazy
              model="rose"
              intensity="subtle"
              rotationSpeed={0.0015}
              cameraDistance={4.2}
              cameraY={0.1}
            />
          </div>
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
            <AnimatePresence>
              {(weekDays ?? []).map((d) => {
                const isToday = d.date === todayKey();
                return (
                  <motion.div
                    key={d.date}
                    title={d.date}
                    // Layout pour permettre l'animation de la cellule "aujourd'hui"
                    // qui passe de neutre à pratiqué (scale pop + glow).
                    layout
                    initial={false}
                    animate={
                      isToday && d.practiced
                        ? {
                            scale: [1, 1.3, 1],
                            boxShadow: [
                              '0 0 0 rgb(var(--gold-glow) / 0)',
                              '0 0 18px rgb(var(--gold-glow) / 0.55)',
                              '0 0 0 rgb(var(--gold-glow) / 0)',
                            ],
                          }
                        : { scale: 1 }
                    }
                    transition={{ duration: 0.6, ease: [0.25, 1, 0.5, 1] }}
                    className={clsx(
                      'flex h-6 w-6 items-center justify-center rounded-full text-[10px] md:h-7 md:w-7 md:text-[11px]',
                      d.practiced
                        ? 'border border-gold-soft bg-gold/20 font-semibold text-gold'
                        : 'border border-border text-text-soft',
                      isToday && !d.practiced && 'ring-1 ring-gold-soft/50'
                    )}
                  >
                    {d.weekday}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <Link
              to="/stats"
              className="inline-block text-xs text-gold hover:text-gold-bright"
            >
              Voir mes stats →
            </Link>
            <Link
              to="/plan"
              className="inline-block text-xs text-gold hover:text-gold-bright"
            >
              Mon plan →
            </Link>
          </div>
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

      {/* Riff de la semaine — teaser */}
      <div className="mt-12">
        <Link
          to="/riff-of-the-week"
          className="group block rounded-2xl border border-border-gold bg-gradient-to-br from-surface to-surface-2 p-5 transition-all hover:-translate-y-0.5 hover:border-gold hover:shadow-gold"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-gold bg-gold/10 text-gold">
              <Sparkles size={22} strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="eyebrow !text-gold-soft">Riff de la semaine</div>
              <div className="display mt-1 text-display-sm">{weeklyRiff.title}</div>
              <div className="mt-1 text-sm text-text-muted">
                {weeklyRiff.source} · {weeklyRiff.genre} · {weeklyRiff.bpm} BPM
              </div>
            </div>
            <ArrowRight
              size={20}
              className="mt-1 shrink-0 text-text-soft transition-transform group-hover:translate-x-1 group-hover:text-gold"
            />
          </div>
        </Link>
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
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SongTileSkeleton key={i} />
            ))}
          </div>
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

// ─── Dashboard greeting ───────────────────────────────────────────────

/**
 * "Bon retour, <name>." — animation entrée word-by-word (stagger 60ms,
 * fade + slide-up + blur résorption), nom en italic gold avec un
 * underline SVG manuscrit qui se dessine en sweep gauche-droite.
 */
function DashboardGreeting({ name }: { name: string }) {
  const words = ['Bon', 'retour,'];
  return (
    <span className="display text-display-md inline-block">
      {words.map((w, i) => (
        <motion.span
          key={w}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.5,
            delay: i * 0.06,
            ease: [0.25, 1, 0.5, 1],
          }}
          className="mr-2 inline-block"
        >
          {w}
        </motion.span>
      ))}
      <motion.span
        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{
          duration: 0.5,
          delay: words.length * 0.06,
          ease: [0.25, 1, 0.5, 1],
        }}
        className="relative inline-block font-serif italic text-gold text-gold-glow"
      >
        {name}
        {/* Underline SVG manuscrit, pathLength animé en sweep gauche-droite */}
        <svg
          className="absolute -bottom-1 left-0 w-full"
          viewBox="0 0 100 8"
          preserveAspectRatio="none"
          fill="none"
          height={6}
          aria-hidden
        >
          <motion.path
            d="M 2 4 Q 25 1, 50 4 T 98 4"
            stroke="rgb(var(--gold-bright))"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { duration: 0.8, delay: 0.5, ease: [0.25, 1, 0.5, 1] },
              opacity: { duration: 0.2, delay: 0.5 },
            }}
            style={{ filter: 'drop-shadow(0 0 4px rgb(var(--gold-glow) / 0.6))' }}
          />
        </svg>
      </motion.span>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.1 }}
      >
        .
      </motion.span>
    </span>
  );
}
