import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' (et NON 'autoUpdate') : le nouveau SW NE prend PAS le
      // contrôle tout seul. Sinon (hotfix bug écran noir) skipWaiting +
      // clientsClaim laissaient le nouveau SW purger les anciens chunks lazy
      // 3D pendant que la vieille page tournait encore → un import() de chunk
      // disparu throwait → écran noir. Ici on attend le clic « Recharger »
      // du PWAUpdateToast (qui appelle updateSW(true)).
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'RiffLab',
        short_name: 'RiffLab',
        description: 'Le carnet du guitariste moderne — sons, accords, gammes, riffs, plan de pratique.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // skipWaiting/clientsClaim FALSE : le SW entrant reste en "waiting"
        // jusqu'au reload explicite (clic « Recharger » du toast). Évite la
        // purge des anciens chunks sous les pieds de la page courante → fin
        // de l'écran noir à la nav après déploiement.
        skipWaiting: false,
        clientsClaim: false,
        // Purge les précaches périmés à l'activation (= au reload), pas avant.
        cleanupOutdatedCaches: true,
        // Cache global de tous les assets statics (CSS, JS, images, fonts).
        // Les .glb sont EXCLUS du precache (trop lourds : guitar-fender-rose
        // 22MB, amp 8.5MB) → ils passent par le runtimeCaching ci-dessous
        // qui les met en cache la 1ère fois qu'ils sont demandés.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,woff2}'],
        globIgnores: ['**/models/**'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          // Samples audio (CDN nbrosowsky) : cache-first 30 jours
          {
            urlPattern: /^https:\/\/nbrosowsky\.github\.io\/tonejs-instruments\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tonejs-samples',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Modèles 3D .glb locaux : cache-first 90 jours
          {
            urlPattern: /\.glb$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'rifflab-models',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 90,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts : cache-first 365 jours
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // évite le SW interférant en dev local
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
