# Marketing assets — guide de capture & usage

> Tous les screenshots, OG images, et assets dont tu as besoin pour le ship-day.
> URLs Vercel directes pour partage embed Reddit/Discord/X.

---

## OG image (déjà prête ✅)

- `public/og-image.png` (1200×630, 105 KB) — généré sess 24 via sharp
- URL prod : https://riff-lab-sigma.vercel.app/og-image.png
- Source SVG éditable : `public/og-image.svg`
- Test rendering : https://www.opengraph.xyz/url/https%3A%2F%2Friff-lab-sigma.vercel.app

Si tu changes l'OG : édite le SVG → `node -e "require('sharp')('public/og-image.svg').png().toFile('public/og-image.png')"` → commit + push → l'OG est mise à jour sur Vercel auto.

---

## Screenshots app (à capturer)

Le script `scripts/screenshots.mjs` les capture en batch via Playwright.

### Procédure (10 min)

```bash
# Une seule fois (download Chromium ~150 MB)
npx playwright install chromium

# Terminal 1 : dev server
npm run dev

# Terminal 2 : capture (lit http://localhost:5173 par défaut)
node scripts/screenshots.mjs

# Ou contre la prod :
RIFFLAB_URL=https://riff-lab-sigma.vercel.app node scripts/screenshots.mjs
```

Output : `public/screenshots/*.png` en x2 retina (1440×900 desktop, 393×852 mobile).

### Pages capturées (11 total)

| Fichier | URL | Format | Usage prévu |
|---|---|---|---|
| `landing.png` | `/` | Desktop 1440×900 | README hero, Reddit cover, X tweet 1 |
| `dashboard.png` | `/dashboard` | Desktop | README, X tweet 2 (streak) |
| `chords.png` | `/chords` | Desktop | README, Discord teaser |
| `scales.png` | `/scales` | Desktop | README, fretboard demo |
| `composer.png` | `/composer` | Desktop | X tweet 3 (compo generated) |
| `plan.png` | `/plan` | Desktop | LinkedIn (Duolingo-like wow) |
| `stats.png` | `/stats` | Desktop | LinkedIn (heatmap analytics) |
| `setlists.png` | `/setlists` | Desktop | README PDF export demo |
| `mobile-landing.png` | `/` | Mobile 393×852 | App Store-style mockup, Discord |
| `mobile-dashboard.png` | `/dashboard` | Mobile | "On en répèt" pitch |
| `mobile-chords.png` | `/chords` | Mobile | Mobile-first proof |

### Tips capture qualité

- **Préchauffer la session locale** : ouvre le navigateur, fais une session de pratique fake pour avoir un streak 3-7 jours sur Dashboard / heatmap remplie sur /stats
- **Daily challenge actif** : trigger le daily challenge avant le shot Dashboard
- **/composer** : génère 2-3 progressions différentes avant capture (sinon page vide)
- **/chords** : scroll en bas pour montrer la diversité, ou screenshot full-page (édite le script `fullPage: true`)
- **Dark mode default** : OK pour la signature visuelle gold-on-noir

---

## Posts pré-écrits (drafts)

→ Voir [`SHIP-DAY-PLAYBOOK.md`](SHIP-DAY-PLAYBOOK.md) pour les drafts Reddit / X / LinkedIn / Discord.

---

## Logo / branding

- Favicon : `public/favicon.svg`
- Pas de logo PNG dédié — l'OG image fait office de "logo + tagline"
- Si besoin d'un logo carré pour Discord serveur / pp réseaux : tu peux extraire le "RL" de l'OG via Figma ou Inkscape

---

## GIFs / vidéos demo

Pas encore prioritaires pour le ship-day. Si Reddit / r/guitar demande une vidéo :

1. OBS Studio (gratuit) — record 720p 30fps
2. Démo 60s : Landing → Dashboard → /composer → génère une prog → click un accord → /plan
3. Export MP4 puis convert en GIF via [ezgif.com](https://ezgif.com) (max 10 MB pour Reddit)

À faire **post-ship**, après les premiers feedbacks.

---

## Checklist usage rapide

Pour un post Reddit r/guitar :
- [ ] Title sous 100 chars, descriptif honnête (pas clickbait)
- [ ] Cover image : `landing.png` (auto-thumb)
- [ ] Body : 200 mots max, mentionne "no ads, local-first, free"
- [ ] 2-3 screenshots inline (`![alt](url Vercel directe)`)
- [ ] Lien `riff-lab-sigma.vercel.app` à la fin
- [ ] Disable "send replies to inbox" → off pour gérer notif

Pour un thread X :
- [ ] Tweet 1 : pitch + `landing.png`
- [ ] Tweet 2 : feature wow 1 + GIF si possible
- [ ] Tweet 3 : feature wow 2 + screenshot
- [ ] Tweet 4 : stack tech (intéresse devs) + lien repo GitHub
- [ ] Tweet 5 : CTA "essaie + DM-moi tes feedbacks" + lien app

Pour LinkedIn :
- [ ] Tone pro mais pas corporate
- [ ] Focus tech + apprentissage (passe au public dev, pas guitariste)
- [ ] 1 visuel : carousel 3 slides via Canva (landing / stats heatmap / composer)
