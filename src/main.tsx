import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { seedIfEmpty } from '@/lib/db';
import { usePrefs } from '@/stores/prefsStore';
import { applyTheme } from '@/lib/themes';
import { rebuildVoices } from '@/lib/audio';
import { PWAUpdateToast } from '@/components/pwa/PWAUpdateToast';
import '@/i18n'; // setup i18next FR/EN AVANT le render
import '@/styles/globals.css';

// Seed the local DB with example songs on first run (non-blocking).
seedIfEmpty().catch((err) => console.warn('seed failed', err));

// Apply persisted theme ASAP — avant le premier render pour éviter le flash
// d'un thème par défaut. Zustand persist a déjà rehydraté à ce stade.
applyTheme(usePrefs.getState().theme);
usePrefs.subscribe((state, prev) => {
  if (state.theme !== prev.theme) applyTheme(state.theme);
  // Hot-swap du timbre audio quand le user change dans Préférences.
  // No-op si l'audio n'est pas encore init (le timbre sera lu au prochain initAudio).
  if (state.strumSound !== prev.strumSound) void rebuildVoices(state.strumSound);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <PWAUpdateToast />
  </React.StrictMode>
);
