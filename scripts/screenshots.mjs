#!/usr/bin/env node
/**
 * Capture beauty shots Playwright pour le README + posts social.
 *
 * Usage :
 *   1. Lance le dev server dans un autre terminal : `npm run dev`
 *   2. Dans un nouveau terminal : `node scripts/screenshots.mjs`
 *      → écrit les PNG dans public/screenshots/
 *
 * Prérequis :
 *   npx playwright install chromium     (~150 MB, à faire une seule fois)
 *
 * Pas d'install permanente de Playwright (utilise `npx playwright`),
 * donc zero impact sur la prod / devDependencies.
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'screenshots');
const BASE = process.env.RIFFLAB_URL || 'http://localhost:5173';

// Viewports communs (desktop 1440 + mobile iPhone 14 Pro)
const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 393, height: 852 };

/**
 * Pages à capturer. `wait` = sélecteur à attendre avant capture
 * (assure que la page a fini son render principal).
 */
const SHOTS = [
  { name: 'landing', path: '/', wait: 'h1', viewport: DESKTOP },
  { name: 'dashboard', path: '/dashboard', wait: 'main', viewport: DESKTOP },
  { name: 'chords', path: '/chords', wait: 'main', viewport: DESKTOP },
  { name: 'scales', path: '/scales', wait: 'main', viewport: DESKTOP },
  { name: 'composer', path: '/composer', wait: 'main', viewport: DESKTOP },
  { name: 'plan', path: '/plan', wait: 'main', viewport: DESKTOP },
  { name: 'stats', path: '/stats', wait: 'main', viewport: DESKTOP },
  { name: 'setlists', path: '/setlists', wait: 'main', viewport: DESKTOP },
  // Mobile equivalents
  { name: 'mobile-landing', path: '/', wait: 'h1', viewport: MOBILE },
  { name: 'mobile-dashboard', path: '/dashboard', wait: 'main', viewport: MOBILE },
  { name: 'mobile-chords', path: '/chords', wait: 'main', viewport: MOBILE },
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  let success = 0;
  let fail = 0;

  for (const shot of SHOTS) {
    const context = await browser.newContext({
      viewport: shot.viewport,
      deviceScaleFactor: 2, // retina
      colorScheme: 'dark',
    });
    const page = await context.newPage();
    try {
      const url = `${BASE}${shot.path}`;
      console.log(`📸  ${shot.name.padEnd(20)} ← ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      if (shot.wait) await page.waitForSelector(shot.wait, { timeout: 10000 });
      await page.waitForTimeout(800); // anims framer-motion settle
      await page.screenshot({
        path: resolve(OUT, `${shot.name}.png`),
        fullPage: false,
      });
      success++;
    } catch (err) {
      console.error(`❌  ${shot.name}: ${err.message}`);
      fail++;
    } finally {
      await context.close();
    }
  }
  await browser.close();
  console.log(`\nDone: ${success} ok / ${fail} fail → public/screenshots/`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
