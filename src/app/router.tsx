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
import { Teleprompter } from '@/pages/Teleprompter';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  // Routes full-screen (hors Layout) — pas de sidebar
  { path: '/songs/:id/play', element: <Teleprompter /> },
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'songs', element: <Songs /> },
      { path: 'songs/new', element: <SongNew /> },
      { path: 'songs/:id', element: <SongDetail /> },
      { path: 'setlists', element: <Setlists /> },
      { path: 'setlists/:id', element: <SetlistDetail /> },
      { path: 'setlists/:id/play', element: <SetlistPlay /> },
      { path: 'chords', element: <Chords /> },
      { path: 'scales', element: <Scales /> },
      { path: 'progressions', element: <Progressions /> },
      { path: 'riffs', element: <Riffs /> },
      { path: 'ear-training', element: <EarTraining /> },
      { path: 'strum-patterns', element: <StrumPatterns /> },
      { path: 'plan', element: <PracticePlan /> },
      { path: 'share/:encoded', element: <SharePreview /> },
      { path: 'riff-of-the-week', element: <RiffOfTheWeek /> },
      { path: 'jam', element: <Jam /> },
      { path: 'metronome', element: <Metronome /> },
      { path: 'tuner', element: <Tuner /> },
      { path: 'stats', element: <Stats /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
