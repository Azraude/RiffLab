#!/usr/bin/env node
/**
 * Génère des PNG placeholders pour public/screenshots/ — utilisés
 * par le README en attendant que Melvin lance `screenshots.mjs` avec
 * Playwright.
 *
 * Style noir+or signature, dimensions exactes des captures cibles.
 * Lancé manuellement via `node scripts/screenshot-placeholders.mjs`
 * (pas dans le build).
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '..', 'public', 'screenshots');

const SHOTS = [
  { name: 'landing', label: 'Landing — hero 3D + pitch', w: 1440, h: 900 },
  { name: 'dashboard', label: 'Dashboard — daily challenge + streak', w: 1440, h: 900 },
  { name: 'chords', label: 'Chord library — 50+ voicings CAGED', w: 1440, h: 900 },
  { name: 'scales', label: 'Scales — visualiseur fretboard SVG', w: 1440, h: 900 },
  { name: 'composer', label: 'Composer — progressions théorie-validées', w: 1440, h: 900 },
  { name: 'plan', label: 'Plan — path Duolingo + streak', w: 1440, h: 900 },
  { name: 'stats', label: 'Stats — heatmap calendaire 90j', w: 1440, h: 900 },
  { name: 'setlists', label: 'Setlists — chord chart PDF imprimable', w: 1440, h: 900 },
  { name: 'mobile-landing', label: 'Mobile landing', w: 393, h: 852 },
  { name: 'mobile-dashboard', label: 'Mobile dashboard', w: 393, h: 852 },
  { name: 'mobile-chords', label: 'Mobile chords', w: 393, h: 852 },
];

function svg({ label, w, h }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#141414"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#9a8454"/>
      <stop offset="50%" stop-color="#f5d97a"/>
      <stop offset="100%" stop-color="#d4b76a"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <g opacity="0.06" stroke="#d4b76a" stroke-width="1" fill="none">
    ${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${(h / 12) * i}" x2="${w}" y2="${(h / 12) * i}"/>`).join('')}
  </g>
  <text x="${w / 2}" y="${h / 2 - 40}" text-anchor="middle" font-family="Georgia, serif" font-size="${Math.round(w / 24)}" font-weight="600" fill="url(#gold)">
    🎸 RiffLab
  </text>
  <text x="${w / 2}" y="${h / 2 + 10}" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="${Math.round(w / 60)}" fill="#9a9a9a">
    ${label}
  </text>
  <text x="${w / 2}" y="${h / 2 + 50}" text-anchor="middle" font-family="ui-monospace, monospace" font-size="${Math.round(w / 90)}" fill="#6a6a6a">
    [ Placeholder · capture via scripts/screenshots.mjs avant ship ]
  </text>
  <rect x="20" y="${h - 30}" width="80" height="10" rx="2" fill="#d4b76a" opacity="0.4"/>
</svg>`;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const shot of SHOTS) {
    const buf = Buffer.from(svg(shot));
    await sharp(buf).png({ quality: 80 }).toFile(resolve(OUT, `${shot.name}.png`));
    console.log(`✓ ${shot.name}.png (${shot.w}×${shot.h})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
