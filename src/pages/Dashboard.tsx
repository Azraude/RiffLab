import { useMemo, useState } from 'react';
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
import { CommunityRiffCard } from '@/components/dashboard/CommunityRiffCard';
import { DailyChallengeCard } from '@/components/dashboard/DailyChallengeCard';
import { Onboarding } from '@/components/onboarding/Onboarding';

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
  const onboardingCompleted = usePrefs((s) => s.onboardingCompleted);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const showOnboarding = !onboardingCompleted && !onboardingDismissed;
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
      {showOnboarding && (
        <Onboarding onDone={() => setOnboardingDismissed(true)} />
      )}
      <PageHeader title={<DashboardGreeting name="Melvin" />} />

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
                {practicedToday ? "Fait aujourd'hui" : "J'ai pratiqué aujourd'hui"}
              </button>
            </div>
          </div>
        </div>

        {/* Streak card — trophée doré flamboyant (TASK E session 17) */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-gold bg-gradient-to-b from-surface to-bg p-6 text-center shadow-gold-strong streak-trophy-glow">
          {/* Radial glow centrale + sparkles */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(circle at 50% 35%, rgb(var(--gold-glow) / 0.18) 0%, transparent 60%)',
            }}
          />
          <span
            className="pointer-events-none absolute left-3 top-3 text-gold-bright/60 streak-sparkle-1"
            aria-hidden
          >
            ✦
          </span>
          <span
            className="pointer-events-none absolute right-4 top-6 text-gold-bright/50 streak-sparkle-2"
            aria-hidden
          >
            ✦
          </span>
          <span
            className="pointer-events-none absolute left-5 bottom-8 text-gold-bright/40 streak-sparkle-3"
            aria-hidden
          >
            ✦
          </span>

          <div className="relative">
            <CardTitle>Série</CardTitle>
            <div className="mt-1 flex items-center justify-center gap-2">
              <motion.div
                key={streak ?? 0}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="display text-[40px] leading-none text-gold-bright text-gold-glow md:text-[64px]"
              >
                {streak ?? 0}
              </motion.div>
              {(streak ?? 0) > 0 && (
                <motion.div
                  animate={{ rotate: [-2, 2, -2] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  <Flame
                    size={28}
                    className="text-gold-bright md:h-9 md:w-9"
                    fill="currentColor"
                    style={{ filter: 'drop-shadow(0 0 6px rgb(var(--gold-glow) / 0.6))' }}
                  />
                </motion.div>
              )}
            </div>
            <div className="label-small mt-2">
              jour{(streak ?? 0) > 1 ? 's' : ''} d'affilée
            </div>
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
                      'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold md:h-7 md:w-7 md:text-[11px]',
                      d.practiced
                        ? 'border border-gold bg-gradient-to-b from-gold-bright to-gold text-bg shadow-[0_0_8px_rgb(var(--gold-glow)/0.5)]'
                        : 'border border-border/60 text-text-soft',
                      isToday && d.practiced && 'streak-trophy-glow',
                      isToday && !d.practiced && 'ring-2 ring-gold-soft/50 text-gold-soft'
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
        </div>
      </div>

      {/* Daily Challenge — tab du jour pickée déterministe (TASK E) */}
      <DailyChallengeCard />

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

      {/* Riff du moment — widget communautaire avec tab reader + player */}
      <div className="mt-12">
        <CommunityRiffCard />
      </div>

      {/* Compagnon : teaser vers la page Riff de la semaine (catalogue complet) */}
      <div className="mt-4">
        <Link
          to="/riff-of-the-week"
          className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text-muted transition-colors hover:border-gold-soft hover:text-text"
        >
          <span className="inline-flex items-center gap-2">
            <Sparkles size={14} className="text-gold-soft" />
            Catalogue complet — {weeklyRiff.title}
          </span>
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
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
        {/* Underline thème guitare : 6 cordes horizontales empilées sous le
            mot. Épaisseurs décroissantes top → bottom (mimant cordes wound
            graves → plain aigus). Stroke-dashoffset CSS pour dessin
            gauche→droite avec stagger 50ms. Les 3 cordes basses ont une
            micro vibration verticale ±0.5px infinite. */}
        <svg
          className="absolute -bottom-1.5 left-0 w-full"
          viewBox="0 0 100 14"
          preserveAspectRatio="none"
          fill="none"
          height={12}
          aria-hidden
        >
          <defs>
            <linearGradient id="guitar-string-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0.4" />
              <stop offset="20%" stopColor="rgb(var(--gold-bright))" />
              <stop offset="80%" stopColor="rgb(var(--gold-bright))" />
              <stop offset="100%" stopColor="rgb(var(--gold))" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {/* 6 cordes : épaisseurs 2 / 1.8 / 1.6 / 1.3 / 1 / 0.8 (top = bass) */}
          {[
            { y: 1, w: 2, vibrate: true, delay: 0 }, // E bass
            { y: 3.4, w: 1.8, vibrate: true, delay: 0.05 }, // A
            { y: 5.8, w: 1.6, vibrate: true, delay: 0.1 }, // D
            { y: 8.2, w: 1.3, vibrate: false, delay: 0.15 }, // G
            { y: 10.4, w: 1, vibrate: false, delay: 0.2 }, // B
            { y: 12.2, w: 0.8, vibrate: false, delay: 0.25 }, // E aigu
          ].map((str, i) => (
            <motion.line
              key={i}
              x1="0"
              y1={str.y}
              x2="100"
              y2={str.y}
              stroke="url(#guitar-string-grad)"
              strokeWidth={str.w}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity: 1,
                ...(str.vibrate && {
                  y1: [str.y, str.y + 0.4, str.y - 0.4, str.y],
                  y2: [str.y, str.y + 0.4, str.y - 0.4, str.y],
                }),
              }}
              transition={{
                pathLength: {
                  duration: 0.6,
                  delay: 0.4 + str.delay,
                  ease: [0.25, 1, 0.5, 1],
                },
                opacity: { duration: 0.2, delay: 0.4 + str.delay },
                ...(str.vibrate && {
                  y1: {
                    duration: 0.18,
                    delay: 1.2 + i * 0.4,
                    repeat: Infinity,
                    repeatType: 'reverse' as const,
                    repeatDelay: 2.5,
                  },
                  y2: {
                    duration: 0.18,
                    delay: 1.2 + i * 0.4,
                    repeat: Infinity,
                    repeatType: 'reverse' as const,
                    repeatDelay: 2.5,
                  },
                }),
              }}
              style={{ filter: 'drop-shadow(0 0 2px rgb(var(--gold-glow) / 0.5))' }}
            />
          ))}
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
