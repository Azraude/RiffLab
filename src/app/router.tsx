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
import { Settings } from '@/pages/Settings';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'songs', element: <Songs /> },
      { path: 'songs/new', element: <SongNew /> },
      { path: 'songs/:id', element: <SongDetail /> },
      { path: 'chords', element: <Chords /> },
      { path: 'scales', element: <Scales /> },
      { path: 'jam', element: <Jam /> },
      { path: 'metronome', element: <Metronome /> },
      { path: 'tuner', element: <Tuner /> },
      { path: 'settings', element: <Settings /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
