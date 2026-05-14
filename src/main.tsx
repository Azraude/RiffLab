import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { seedIfEmpty } from '@/lib/db';
import { usePrefs } from '@/stores/prefsStore';
import { applyTheme } from '@/lib/themes';
import '@/styles/globals.css';

// Seed the local DB with example songs on first run (non-blocking).
seedIfEmpty().catch((err) => console.warn('seed failed', err));

// Apply persisted theme ASAP — avant le premier render pour éviter le flash
// d'un thème par défaut. Zustand persist a déjà rehydraté à ce stade.
applyTheme(usePrefs.getState().theme);
usePrefs.subscribe((state, prev) => {
  if (state.theme !== prev.theme) applyTheme(state.theme);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
