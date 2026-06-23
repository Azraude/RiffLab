import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from '@/app/layout/Layout';
import { Landing } from '@/pages/Landing';
import { Dashboard } from '@/pages/Dashboard';
import { Songs } from '@/pages/Songs';
import { SongNew } from '@/pages/SongNew';
import { SongDetail } from '@/pages/SongDetail';
import { Chords } from '@/pages/Chords';
import { Scales } from '@/pages/Scales';
import { Jam } from '@/pages/Jam';
import { Metronome } from '@/pages/Metronome';
import { Tuner } from '@/pages/Tuner';
import { Stats } from '@/pages/Stats';
import { Setlists } from '@/pages/Setlists';
import { SetlistDetail } from '@/pages/SetlistDetail';
import { SetlistPlay } from '@/pages/SetlistPlay';
import { Progressions } from '@/pages/Progressions';
import { Riffs } from '@/pages/Riffs';
import { EarTraining } from '@/pages/EarTraining';
import { StrumPatterns } from '@/pages/StrumPatterns';
import { PracticePlan } from '@/pages/PracticePlan';
import { SharePreview } from '@/pages/SharePreview';
import { RiffOfTheWeek } from '@/pages/RiffOfTheWeek';
import { Settings } from '@/pages/Settings';
import { Profile } from '@/pages/Profile';
import { Premium } from '@/pages/Premium';
import { Privacy } from '@/pages/Privacy';
import { Terms } from '@/pages/Terms';
// Composer fusionné dans Studio (sess PROG-STUDIO) — /composer redirige
// vers /progressions (qui rend le Studio multi-tabs)
import { About } from '@/pages/About';
import { LibraryHub } from '@/pages/hubs/LibraryHub';
import { ResourcesHub } from '@/pages/hubs/ResourcesHub';
import { CreateHub } from '@/pages/hubs/CreateHub';
import { ToolsHub } from '@/pages/hubs/ToolsHub';
import { FretboardLearner } from '@/pages/FretboardLearner';
import { RiffDetail } from '@/pages/RiffDetail';
import { RiffCollection } from '@/pages/RiffCollection';
import { UserProfile } from '@/pages/UserProfile';
import { Leaderboard } from '@/pages/Leaderboard';
import { Battle } from '@/pages/Battle';
import { RiffsByTag } from '@/pages/RiffsByTag';
import { EditorPicks } from '@/pages/EditorPicks';
import { Activity } from '@/pages/Activity';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },

      // ─── Hubs (refonte sidebar sess 26) ─────────────────────────
      { path: 'library', element: <LibraryHub /> },
      { path: 'resources', element: <ResourcesHub /> },
      { path: 'create', element: <CreateHub /> },
      { path: 'tools', element: <ToolsHub /> },

      // ─── Pages perso (anciennes URLs préservées) ────────────────
      { path: 'songs', element: <Songs /> },
      { path: 'songs/new', element: <SongNew /> },
      { path: 'songs/:id', element: <SongDetail /> },
      { path: 'setlists', element: <Setlists /> },
      { path: 'setlists/:id', element: <SetlistDetail /> },
      { path: 'setlists/:id/play', element: <SetlistPlay /> },
      { path: 'riffs', element: <Riffs /> },
      { path: 'riffs/collections/:slug', element: <RiffCollection /> },
      { path: 'riffs/editor-picks', element: <EditorPicks /> },
      { path: 'riffs/tag/:tag', element: <RiffsByTag /> },
      { path: 'riffs/:id', element: <RiffDetail /> },
      { path: 'riff-of-the-week', element: <RiffOfTheWeek /> },

      // ─── Bibliothèque (référence) ───────────────────────────────
      { path: 'chords', element: <Chords /> },
      { path: 'scales', element: <Scales /> },
      { path: 'progressions', element: <Progressions /> },
      { path: 'strum-patterns', element: <StrumPatterns /> },

      // ─── Création ───────────────────────────────────────────────
      // /composer redirige vers /progressions (Studio multi-tabs sess PROG-STUDIO)
      { path: 'composer', element: <Navigate to="/progressions" replace /> },

      // ─── Outils (URLs canoniques /tools/* + anciennes en alias) ─
      // Le hub /tools liste ces 4. Les anciennes URLs restent valides
      // pour pas casser les liens partagés / bookmarks.
      { path: 'tools/tuner', element: <Tuner /> },
      { path: 'tools/metronome', element: <Metronome /> },
      { path: 'tools/ear-training', element: <EarTraining /> },
      { path: 'tools/fretboard-learner', element: <FretboardLearner /> },
      { path: 'tuner', element: <Tuner /> },
      { path: 'metronome', element: <Metronome /> },
      { path: 'ear-training', element: <EarTraining /> },

      // ─── Quotidien & comptes ────────────────────────────────────
      { path: 'plan', element: <PracticePlan /> },
      { path: 'stats', element: <Stats /> },
      { path: 'jam', element: <Jam /> },
      { path: 'share/:encoded', element: <SharePreview /> },
      { path: 'settings', element: <Settings /> },
      { path: 'premium', element: <Premium /> },
      { path: 'privacy', element: <Privacy /> },
      { path: 'terms', element: <Terms /> },
      { path: 'profile', element: <Profile /> },

      // ─── Profils publics (sess 29) ─────────────────────────────
      { path: 'u/:username', element: <UserProfile /> },
      { path: 'leaderboard', element: <Leaderboard /> },
      { path: 'battle', element: <Battle /> },
      { path: 'activity', element: <Activity /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
