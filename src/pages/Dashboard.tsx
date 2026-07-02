/**
 * /dashboard — écran de reprise quotidien (refonte home mobile 2026-06-25).
 *
 * Grille verticale mobile-first, colonne centrée (desktop hérite, cards
 * élargies max-w-2xl/3xl — pas de layout desktop distinct) :
 *   1. HelloHero — salutation dynamique + prénom or italique + badge plan
 *   2. StreakBanner — flamme progressive + pastilles 7 jours
 *   3. SessionOfTheDay — accord du jour + ChordDiagram + "J'ai pratiqué"
 *   4. DailyChallengeCard — défi tab du jour (ancre tutorial conservée)
 *   5. Reprendre — carrousel horizontal snap des derniers sons
 *   6. Riff du jour — CommunityRiffCard + lien feed
 *
 * "J'ai pratiqué" → logSession Dexie + célébration (bordure embrasée +
 * particules 🔥 sur le StreakBanner + vibration).
 *
 * Sections retirées vs ancienne version : PageHeader greeting (remplacé par
 * HelloHero), card "Gamme du jour" Fretboard2D, teaser riff-of-the-week,
 * FloatingGuitar3D décoratif, liste "Tes sons récents" (remplacée par le
 * carrousel Reprendre).
 */
import { useMemo, useRef, useState } from 'react';
import { SEO } from '@/components/SEO';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  db,
  logSession,
  todaysSession,
  computeStreak,
  lastSevenDays,
  todayKey,
  type Song,
} from '@/lib/db';
import { CHORDS } from '@/lib/chordDatabase';
import { SCALES } from '@/lib/scaleDatabase';
import { NOTE_NAMES, type NoteName } from '@/lib/theory';
import { useAudio } from '@/hooks/useAudio';
import { usePrefs } from '@/stores/prefsStore';
import { useAuth } from '@/stores/authStore';
import { getCurrentDayNumber } from '@/lib/practicePlan';
import { Check, ArrowRight } from 'lucide-react';
import clsx from 'clsx';
import { SongTileSkeleton } from '@/components/ui/Skeleton';
import { HelloHero } from '@/components/dashboard/HelloHero';
import { StreakBanner } from '@/components/dashboard/StreakBanner';
import { SessionOfTheDay } from '@/components/dashboard/SessionOfTheDay';
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

export function Dashboard() {
  const songs = useLiveQuery(() => db.songs.orderBy('updatedAt').reverse().limit(8).toArray(), []);
  const { chord, scale, key } = useMemo(pickOfTheDay, []);
  const onboardingCompleted = usePrefs((s) => s.onboardingCompleted);
  const tutorialCompleted = usePrefs((s) => s.tutorialCompleted);
  const practicePlan = usePrefs((s) => s.practicePlan);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [tutorialDismissed, setTutorialDismissed] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const showOnboarding = !onboardingCompleted && !onboardingDismissed;
  // Tutorial s'affiche uniquement après onboarding terminé, sur Dashboard
  const showTutorial =
    onboardingCompleted && !tutorialCompleted && !tutorialDismissed && !showOnboarding;
  const { strum } = useAudio();

  // Practice tracking : session du jour + streak + 7 derniers jours
  const today = useLiveQuery(() => todaysSession(), []);
  const streak = useLiveQuery(() => computeStreak(), [today]);
  const weekDays = useLiveQuery(() => lastSevenDays(), [today]);
  const practicedToday = today?.completed === true;

  // Badge "Mon plan" : jour courant du VRAI parcours 28j si un plan actif
  // existe. Plan absent, expiré ou pas encore démarré → placeholder 4
  // (fallback demandé par Melvin). TODO: retirer le placeholder quand tous
  // les users passeront par l'onboarding plan.
  const planDay = useMemo(() => {
    const day = practicePlan ? getCurrentDayNumber(practicePlan) : null;
    return day ?? 4; // placeholder
  }, [practicePlan]);

  // Greeting hero dynamique
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

  // Guard synchrone anti double-tap : practicedToday vient d'un useLiveQuery
  // async — deux taps rapides passeraient tous les deux le check et
  // écriraient 2 sessions pour la même date.
  const savingRef = useRef(false);
  const markPracticed = async () => {
    if (practicedToday || savingRef.current) return;
    savingRef.current = true;
    try {
      await logSession({
        date: todayKey(),
        chord: chord.name,
        scale: scale.id,
        progression: [],
        completed: true,
      });
      // Célébration : bordure embrasée + particules sur le StreakBanner
      setCelebrate(true);
      if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
      window.setTimeout(() => setCelebrate(false), 1500);
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <>
      <SEO
        title="Dashboard"
        description="Ton studio guitare personnel — session du jour, streak et pratique quotidienne."
      />
      {showOnboarding && <Onboarding onDone={() => setOnboardingDismissed(true)} />}
      {showTutorial && <Tutorial onDone={() => setTutorialDismissed(true)} />}

      {/* Colonne verticale centrée — mobile-first, desktop élargit juste */}
      <div className="mx-auto w-full max-w-2xl lg:max-w-3xl">
        <HelloHero
          title={greeting.title}
          subtitle={greeting.subtitle}
          userName={userName}
          planDay={planDay}
        />

        <StreakBanner streak={streak ?? 0} weekDays={weekDays ?? []} triggerCelebration={celebrate} />

        <SessionOfTheDay
          chord={chord}
          scaleLabel={scale.name}
          keyName={key}
          practicedToday={practicedToday}
          onListen={() => strum(chord.name)}
          onMarkPracticed={() => void markPracticed()}
        />

        {/* Défi du jour (tab) — ancre tutorial conservée */}
        <div data-tutorial-id="daily-challenge" className="my-4">
          <DailyChallengeCard />
        </div>

        {/* === Reprendre — carrousel horizontal snap === */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="display text-lg text-text">Reprendre</h3>
            <Link
              to="/songs"
              className="flex h-11 items-center gap-1 text-sm text-text-muted transition-colors hover:text-gold"
            >
              Tout voir <ArrowRight size={14} />
            </Link>
          </div>

          {songs === undefined ? (
            <div className="grid grid-cols-2 gap-3">
              <SongTileSkeleton />
              <SongTileSkeleton />
            </div>
          ) : songs.length > 0 ? (
            <div
              className={clsx(
                '-mx-5 overflow-x-auto px-5 pb-2 snap-x md:mx-0 md:px-0',
                'snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
              )}
            >
              <div className="flex gap-3">
                {songs.map((song) => (
                  <SongTileHoriz key={song.id} song={song} />
                ))}
              </div>
            </div>
          ) : (
            <Link
              to="/songs/new"
              className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-sm text-text-muted transition-colors hover:border-gold-soft hover:text-gold"
            >
              Pas encore de sons — ajoute ton premier !
            </Link>
          )}
        </section>

        {/* === Riff du jour === */}
        <section className="mt-6 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="display text-lg text-text">Riff du jour</h3>
            <Link
              to="/riffs"
              className="flex h-11 items-center gap-1 text-sm text-text-muted transition-colors hover:text-gold"
            >
              Voir le feed <ArrowRight size={14} />
            </Link>
          </div>
          <CommunityRiffCard />
        </section>
      </div>
    </>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

/** Progression affichée par statut de son (pas de % réel en data). */
const STATUS_PROGRESS: Record<Song['status'], number> = {
  'à bosser': 25,
  'intermédiaire': 65,
  'maîtrisé': 100,
};

/** Tuile compacte du carrousel "Reprendre". */
function SongTileHoriz({ song }: { song: Song }) {
  const isMastered = song.status === 'maîtrisé';
  const progress = STATUS_PROGRESS[song.status] ?? 25;

  return (
    <Link
      to={`/songs/${song.id}`}
      className="w-[180px] shrink-0 snap-start rounded-xl border border-border bg-surface p-3 transition-colors hover:border-gold-soft"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="display truncate text-sm text-text">{song.title}</h4>
          <p className="mt-0.5 truncate text-xs text-text-muted">{song.artist ?? '—'}</p>
        </div>
        {isMastered && (
          <span className="shrink-0 rounded-full bg-success/15 p-1">
            <Check size={12} className="text-success" strokeWidth={3} />
          </span>
        )}
      </div>

      {/* Progress bar (mappée sur le statut du son) */}
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-border">
        <div
          className={clsx(
            'h-full rounded-full transition-all',
            isMastered ? 'bg-success' : 'bg-gradient-to-r from-gold to-gold-bright'
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[10px]">
        <span className={clsx('font-mono', isMastered ? 'text-success' : 'text-gold')}>
          {song.status}
        </span>
        <span className="font-mono text-text-soft">♩ {song.tempo}</span>
      </div>
    </Link>
  );
}
