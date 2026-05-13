import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/app/router';
import { seedIfEmpty } from '@/lib/db';
import '@/styles/globals.css';

// Seed the local DB with example songs on first run (non-blocking).
seedIfEmpty().catch((err) => console.warn('seed failed', err));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
