import { useMemo, useState } from 'react';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { useAuth } from '@/stores/authStore';
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
import { Tutorial } from '@/components/onboarding/Tutorial';
import { pickGreeting, daysSinceLastSession } from '@/lib/greetings';

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

/**
 * Variants Framer Motion pour les cards du Dashboard (sess DASH-POLISH).
 * Le parent grid applique staggerChildren via `visible.transition` pour
 * faire apparaître la card "Accord du jour" puis "Streak" en cascade.
 */
const dashCardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] as const },
  },
};

export function Dashboard() {
  const { t } = useTranslation();
  const songs = useLiveQuery(() => db.songs.orderBy('updatedAt').reverse().limit(3).toArray(), []);
  const { chord, scale, key } = useMemo(pickOfTheDay, []);
  const weeklyRiff = useMemo(() => getRiffOfTheWeek(), []);
  const onboardingCompleted = usePrefs((s) => s.onboardingCompleted);
  const tutorialCompleted = usePrefs((s) => s.tutorialCompleted);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);
  const showOnboarding = !onboardingCompleted && !onboardingDismissed;
  // Tutorial s'affiche uniquement après onboarding terminé, sur Dashboard
  const showTutorial =
    onboardingCompleted &&
    !tutorialCompleted &&
    !tutorialDismissed &&
    !showOnboarding;
  const { strum } = useAudio();
  const fretboardSkin = usePrefs((s) => s.fretboardSkin);

  // Practice tracking : session du jour + streak + 7 derniers jours
  const today = useLiveQuery(() => todaysSession(), []);
  const streak = useLiveQuery(() => computeStreak(), [today]);
  const weekDays = useLiveQuery(() => lastSevenDays(), [today]);
  const practicedToday = today?.completed === true;

  // Data pour greeting hero dynamique : noms + total sessions + dernière
  // session pour calculer daysSinceLast.
  const authUser = useAuth((s) => s.user);
  const allSessionDates = useLiveQuery(
    () =>
      db.sessions
        .filter((s) => s.completed === true)
        .toArray()
        .then((rows) => rows.map((r) => r.date)),
    [],
  );
  const userName = useMemo(() => {
    if (authUser?.email) {
      const local = authUser.email.split('@')[0];
      if (local && local.length > 0) {
        // Capitalize première lettre
        return local.charAt(0).toUpperCase() + local.slice(1);
      }
    }
    return 'ami';
  }, [authUser?.email]);
  const greeting = useMemo(() => {
    const dates = allSessionDates ?? [];
    return pickGreeting({
      userName,
      daysSinceLast: daysSinceLastSession(dates),
      streak: streak ?? 0,
      totalSessions: dates.length,
      hour: new Date().getHours(),
    });
    // Random à chaque change → frais à chaque mount/refresh
  }, [userName, allSessionDates, streak]);

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
      <SEO title="Dashboard" description="Ton studio guitare personnel — accords du jour, gammes, stats et pratique quotidienne." />
      {showOnboarding && (
        <Onboarding onDone={() => setOnboardingDismissed(true)} />
      )}
      {showTutorial && <Tutorial onDone={() => setTutorialDismissed(true)} />}
      {/* Settings btn TOP-RIGHT supprimé (showSettingsLink=false) — déjà
          accessible via Sidebar/MobileNav, redondant ici. Hero phrase et
          subtitle dynamiques sess DASHBOARD via pickGreeting(). */}
      <PageHeader
        showSettingsLink={false}
        title={
          <DashboardGreeting
            title={greeting.title}
            name={userName}
            streak={streak ?? 0}
          />
        }
        subtitle={greeting.subtitle}
      />

      {/* Daily hero — anim séquentielle stagger (sess DASH-POLISH) :
          eyebrow → h1 → subtitle → cards apparaissent en cascade 80ms.
          Variants Framer Motion via staggerChildren sur le parent. */}
      <motion.div
        className="grid gap-5 md:grid-cols-[2fr_1fr]"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
        }}
      >
        <motion.div
          variants={dashCardVariants}
          className="daily-gold-sheen relative overflow-hidden rounded-3xl border border-border-gold p-4 md:p-8"
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
              contenu. Opacity 0.3, intensité subtle. Visible desktop seulement
              (card étroite en mobile + perf). */}
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
            <div className="eyebrow">{t('dashboard.dailyTraining')} · {todayLabel}</div>
            <h2 className="display mt-2 text-display-sm md:mt-3 md:text-display-lg">
              {t('dashboard.workChordPrefix')}{' '}
              <span className="text-gold">{chord.name}</span>
            </h2>

            {/* Mobile : layout compact 2 cols (chord+scale en haut, diagram à droite).
                Sess DASH-POLISH : refonte pour réduire hauteur card mobile.
                Avant : ChordDiagram size="lg" centré (110px+), 3 cards meta
                grid-cols-2, CTAs flex-wrap pouvant overflow. */}
            <div className="mt-3 grid grid-cols-[1fr_auto] gap-3 md:hidden">
              <div className="space-y-2">
                <p className="text-sm leading-relaxed text-text-muted">
                  {t('dashboard.combineWithScale', {
                    scale: scale.name,
                    key,
                    mood: scale.mood.toLowerCase(),
                  })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-text-soft">
                      {t('dashboard.scale')}
                    </div>
                    <div className="font-mono text-sm font-semibold text-gold">
                      {key} {scale.shortName}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-text-soft">
                      {t('dashboard.category')}
                    </div>
                    <div className="font-mono text-sm font-semibold text-gold">
                      {scale.category}
                    </div>
                  </div>
                </div>
              </div>
              {/* ChordDiagram à droite, size="sm" (96px) au lieu de "lg" → gain ~50px */}
              <ChordDiagram voicing={voicing} name={chord.name} size="sm" />
            </div>

            {/* Desktop : paragraphe pleine largeur + ChordDiagram inline droite (inchangé) */}
            <p className="mt-3 hidden max-w-xl text-base text-text-muted md:block">
              {t('dashboard.combineWithScale', {
                scale: scale.name,
                key,
                mood: scale.mood.toLowerCase(),
              })}
            </p>

            <div className="mt-5 hidden flex-wrap items-center gap-7 md:flex">
              <div>
                <div className="label-small">{t('dashboard.chord')}</div>
                <div className="mt-1 font-mono text-lg font-semibold">{chord.name}</div>
              </div>
              <div>
                <div className="label-small">{t('dashboard.scale')}</div>
                <div className="mt-1 font-mono text-lg font-semibold">
                  {key} {scale.shortName}
                </div>
              </div>
              <div>
                <div className="label-small">{t('dashboard.category')}</div>
                <div className="mt-1 font-mono text-lg font-semibold">{scale.category}</div>
              </div>

              <div className="ml-auto">
                <ChordDiagram voicing={voicing} name={chord.name} size="md" />
              </div>
            </div>

            {/* CTAs : stack full-width mobile (3 boutons h-11), flex-wrap desktop */}
            <div className="mt-4 flex flex-col gap-2 md:mt-6 md:flex-row md:flex-wrap md:gap-3">
              <button
                onClick={() => strum(chord.name)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:bg-gold-bright md:h-10 md:w-auto"
              >
                <Play size={14} /> {t('dashboard.hearChord')}
              </button>
              <Link
                to="/scales"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border-gold px-4 text-sm hover:bg-gold/5 md:h-10 md:w-auto"
              >
                {t('dashboard.viewScale')}
              </Link>
              <button
                type="button"
                data-tutorial-id="practice-button"
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
                {practicedToday ? t('dashboard.practicedToday') : t('dashboard.practicePrompt')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Streak card — trophée doré flamboyant (sess 17 + compactage mobile sess DASHBOARD).
            Mobile : padding p-4 + compteur 36px (vs 64px desktop) + week dots
            réduits. Garde l'aura "trophée" même condensé. */}
        <motion.div
          variants={dashCardVariants}
          data-tutorial-id="streak-card"
          className="relative overflow-hidden rounded-2xl border-2 border-gold bg-gradient-to-b from-surface to-bg p-4 text-center shadow-gold-strong streak-trophy-glow md:p-6"
        >
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
            <CardTitle>{t('dashboard.streak')}</CardTitle>
            <div className="mt-1 flex items-center justify-center gap-2">
              <motion.div
                key={streak ?? 0}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="display text-[36px] leading-none text-gold-bright text-gold-glow md:text-[64px]"
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
              {(streak ?? 0) > 1 ? t('dashboard.streakDaysOther') : t('dashboard.streakDaysOne')}
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
          {/* Lien discret mobile (sess DASHBOARD : avant 2 liens gros stats+plan,
              maintenant un seul "Voir mes stats →" subtil. Plan reste accessible
              via sidebar). */}
          <div className="mt-3 flex justify-center">
            <Link
              to="/stats"
              className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-bright"
            >
              {t('dashboard.viewStats')} →
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Daily Challenge — tab du jour pickée déterministe (TASK E).
          Wrap dans motion.div pour fade-in après le hero (delay 0.4s). */}
      <motion.div
        data-tutorial-id="daily-challenge"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: [0.25, 1, 0.5, 1] }}
      >
        <DailyChallengeCard />
      </motion.div>

      {/* Scale preview — fade-in stagger 0.6s après hero */}
      <motion.div
        className="mt-10"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
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
      </motion.div>

      {/* Riff du moment — widget communautaire avec tab reader + player.
          Fade-in stagger via whileInView (apparait quand on scroll dessus). */}
      <motion.div
        className="mt-12"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
      >
        <CommunityRiffCard />
      </motion.div>

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
 * Phrase hero dynamique (sess DASHBOARD) — la phrase entière vient de
 * `pickGreeting()` qui pick contextuellement (heure / streak / absence /
 * first visit). Le `name` (si trouvé dans la phrase) est highlight en
 * italic gold avec underline guitare SVG animé (6 cordes).
 *
 * Tous les autres mots animent stagger 60ms (fade + y + blur).
 * Espaces préservés via separator inline-block + mr-2 (fix sess LANDING
 * où un caractère espace dans une inline-block collapsait).
 */
function DashboardGreeting({
  title,
  name,
  streak,
}: {
  title: string;
  name: string;
  streak: number;
}) {
  void streak; // conservé pour évolution future (anim pulse si compteur)

  const words = title.split(' ');
  const cleanName = name.toLowerCase();

  return (
    <span className="display text-display-md inline-block">
      {words.map((word, i) => {
        const cleanWord = word.toLowerCase().replace(/[.,!?;:]$/, '');
        const trailing = word.match(/[.,!?;:]$/)?.[0] ?? '';
        const isName = cleanWord === cleanName;
        const isLast = i === words.length - 1;
        const spaceAfter = isLast ? '' : ' ';

        if (isName) {
          return (
            <span key={`${i}-${word}`} className="inline-block">
              <motion.span
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.06,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className="relative inline-block font-serif italic text-gold text-gold-glow"
              >
                {word.replace(/[.,!?;:]$/, '')}
                {/* Underline guitare : 6 cordes SVG, dessin gauche→droite,
                    micro-vibration sur les 3 graves. Utilise motion.path
                    (pathLength non supporté sur <line>). */}
                <GuitarStringsUnderline />
              </motion.span>
              {trailing && <span>{trailing}</span>}
              {spaceAfter && <span>{' '}</span>}
            </span>
          );
        }

        return (
          <span key={`${i}-${word}`} className="inline-block">
            <motion.span
              initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{
                duration: 0.5,
                delay: i * 0.06,
                ease: [0.25, 1, 0.5, 1],
              }}
              className="inline-block"
            >
              {word}
            </motion.span>
            {spaceAfter && <span>{' '}</span>}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Underline guitare 6 cordes — réutilisable. Trait du nom doré dans le
 * greeting. Cordes basses vibrent en boucle, aiguës fixes.
 */
function GuitarStringsUnderline() {
  return (
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
      {[
        { y: 1, w: 2, vibrate: true, delay: 0 },
        { y: 3.4, w: 1.8, vibrate: true, delay: 0.05 },
        { y: 5.8, w: 1.6, vibrate: true, delay: 0.1 },
        { y: 8.2, w: 1.3, vibrate: false, delay: 0.15 },
        { y: 10.4, w: 1, vibrate: false, delay: 0.2 },
        { y: 12.2, w: 0.8, vibrate: false, delay: 0.25 },
      ].map((str, i) => (
        <motion.path
          key={i}
          d={`M 0 ${str.y} L 100 ${str.y}`}
          stroke="url(#guitar-string-grad)"
          strokeWidth={str.w}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0, opacity: 0, y: 0 }}
          animate={{
            pathLength: 1,
            opacity: 1,
            ...(str.vibrate && { y: [0, 0.4, -0.4, 0] }),
          }}
          transition={{
            pathLength: {
              duration: 0.6,
              delay: 0.4 + str.delay,
              ease: [0.25, 1, 0.5, 1],
            },
            opacity: { duration: 0.2, delay: 0.4 + str.delay },
            ...(str.vibrate && {
              y: {
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
  );
}
