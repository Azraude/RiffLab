import { defineConfig, devices } from '@playwright/test';

/**
 * Config Playwright E2E pour RiffLab.
 *
 * - testDir: ./tests
 * - 2 projets : desktop (Chrome) + mobile (iPhone 13) — l'app est
 *   mobile-first, on vérifie les deux viewports.
 * - webServer : lance `npm run dev` (Vite, port 5173) et le réutilise en
 *   local s'il tourne déjà.
 * - reporter html avec open:'never' pour ne jamais bloquer le terminal
 *   (le rapport reste consultable via `npx playwright show-report`).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/.report' }]],
  // Artefacts (traces, captures) confinés sous tests/ (gitignorés) pour ne
  // pas polluer la racine du repo.
  outputDir: 'tests/.results',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // iPhone 13 viewport mais moteur Chromium (on n'installe que chromium —
    // devices['iPhone 13'] vise WebKit par défaut). Suffisant pour des tests
    // DOM mobile-first basés sur le viewport, pas sur les quirks WebKit.
    {
      name: 'mobile',
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
