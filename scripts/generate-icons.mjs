/**
 * Génère toutes les icônes PNG pour la PWA RiffLab
 * à partir du SVG source public/favicon.svg.
 *
 * Usage : node scripts/generate-icons.mjs
 * (ou npm run generate-icons)
 *
 * Output : public/icons/*
 *   - favicon-16.png / favicon-32.png
 *   - icon-72/96/128/144/152/192/384/512.png
 *   - apple-touch-icon-167.png (iPad Pro)
 *   - apple-touch-icon-180.png (iPhone)
 *   - icon-maskable-192.png / icon-maskable-512.png (Android)
 *   - splash-*.png (iOS splash screens 5 sizes)
 */

import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ICONS_DIR = path.join(ROOT, 'public', 'icons');
const SVG_PATH = path.join(ROOT, 'public', 'favicon.svg');

mkdirSync(ICONS_DIR, { recursive: true });

const svgBuffer = readFileSync(SVG_PATH);
const BG = { r: 10, g: 10, b: 10, alpha: 1 }; // #0a0a0a

// ── 1. Icônes standard (logo sur fond noir plein) ──────────────────────────

const standardSizes = [
  { size: 16,  name: 'favicon-16.png' },
  { size: 32,  name: 'favicon-32.png' },
  { size: 72,  name: 'icon-72.png' },
  { size: 96,  name: 'icon-96.png' },
  { size: 128, name: 'icon-128.png' },
  { size: 144, name: 'icon-144.png' },
  { size: 152, name: 'icon-152.png' },
  { size: 167, name: 'apple-touch-icon-167.png' },
  { size: 180, name: 'apple-touch-icon-180.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 384, name: 'icon-384.png' },
  { size: 512, name: 'icon-512.png' },
];

for (const { size, name } of standardSizes) {
  // Rasterise le SVG à la taille exacte
  const logoBuffer = await sharp(svgBuffer)
    .resize(size, size, { fit: 'contain', background: BG })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(ICONS_DIR, name));

  console.log(`  ✓ ${name}`);
}

// ── 2. Icônes maskable (safe zone = 80 % du canvas) ───────────────────────

for (const size of [192, 512]) {
  const logoSize = Math.round(size * 0.72); // 72 % → safe zone confortable
  const logoBuffer = await sharp(svgBuffer)
    .resize(logoSize, logoSize, { fit: 'contain', background: BG })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: BG },
  })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(ICONS_DIR, `icon-maskable-${size}.png`));

  console.log(`  ✓ icon-maskable-${size}.png`);
}

// ── 3. Splash screens iOS ─────────────────────────────────────────────────

const splashes = [
  { w: 750,  h: 1334, name: 'splash-750x1334.png'   }, // iPhone SE / 8
  { w: 1242, h: 2208, name: 'splash-1242x2208.png'  }, // iPhone 8 Plus
  { w: 1125, h: 2436, name: 'splash-1125x2436.png'  }, // iPhone X / 11 Pro
  { w: 1170, h: 2532, name: 'splash-1170x2532.png'  }, // iPhone 12/13/14
  { w: 1290, h: 2796, name: 'splash-1290x2796.png'  }, // iPhone 14 Pro Max
];

const LOGO_SPLASH = 240; // px — taille du logo dans le splash

for (const { w, h, name } of splashes) {
  // Logo rasterisé
  const logoBuffer = await sharp(svgBuffer)
    .resize(LOGO_SPLASH, LOGO_SPLASH, { fit: 'contain', background: BG })
    .png()
    .toBuffer();

  // Texte "RiffLab" rendu via SVG inline (pas de dépendance fontconfig)
  const fontSize = Math.round(LOGO_SPLASH * 0.35);
  const textW = Math.round(LOGO_SPLASH * 2.4);
  const textH = Math.round(fontSize * 1.6);
  const textSvg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${textW}" height="${textH}">
      <text
        x="${textW / 2}" y="${Math.round(textH * 0.72)}"
        font-family="Georgia, 'Times New Roman', serif"
        font-size="${fontSize}"
        font-weight="600"
        fill="#d4b76a"
        text-anchor="middle"
        letter-spacing="3"
      >RiffLab</text>
    </svg>`
  );
  const textBuffer = await sharp(textSvg).png().toBuffer();

  // Positionnement centré (logo + 16px gap + texte)
  const totalH = LOGO_SPLASH + 20 + textH;
  const logoLeft = Math.round((w - LOGO_SPLASH) / 2);
  const logoTop  = Math.round((h - totalH) / 2);
  const textLeft = Math.round((w - textW) / 2);
  const textTop  = logoTop + LOGO_SPLASH + 20;

  await sharp({
    create: { width: w, height: h, channels: 4, background: BG },
  })
    .composite([
      { input: logoBuffer, left: logoLeft, top: logoTop },
      { input: textBuffer, left: textLeft, top: textTop },
    ])
    .png({ compressionLevel: 9 })
    .toFile(path.join(ICONS_DIR, name));

  console.log(`  ✓ ${name}  (${w}×${h})`);
}

console.log('\n✅ Icônes générées dans public/icons/');
