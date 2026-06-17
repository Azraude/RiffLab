# Session Log — PWA iOS + Install Experience
**Date :** 2026-06-18  
**Branch :** claude/compassionate-shtern-a54977  
**Durée estimée :** ~2h  

---

## Objectif

Rendre RiffLab installable sur iPhone (Safari → écran d'accueil) avec icône PNG propre, splash screens et mode standalone. Plus un prompt d'install custom Android/iOS via `beforeinstallprompt`.

---

## Ce qui a été fait

### Phase 1 — Icônes PNG (Sharp)

**Script :** `scripts/generate-icons.mjs`  
**Commande :** `npm run generate-icons`

Génère dans `public/icons/` :
- `favicon-16.png` / `favicon-32.png`
- `icon-72/96/128/144/152/192/384/512.png` (app icons standards)
- `apple-touch-icon-167.png` (iPad Pro)
- `apple-touch-icon-180.png` (iPhone)
- `icon-maskable-192.png` / `icon-maskable-512.png` (Android maskable, safe zone 72%)
- 5 splash screens iOS (`splash-750x1334.png` → `splash-1290x2796.png`)

Base SVG : `public/favicon.svg` (flamme gold sur fond `#0a0a0a`).  
Splash screens : logo 240px + texte "RiffLab" en Georgia bold, centré sur fond noir.

### Phase 2 — Meta tags `index.html`

Ajout dans `<head>` :
- `<meta name="background-color">` 
- `<link rel="apple-touch-icon">` pour 180px et 167px (PNG, pas SVG)
- 5 `<link rel="apple-touch-startup-image">` avec media queries par device
- `<link rel="icon">` PNG 32px et 16px

### Phase 3 — Manifest `vite.config.ts`

Mise à jour du manifest généré par vite-plugin-pwa :
- `name` : "RiffLab — Le studio guitare"
- `start_url` : `/dashboard` (pas `/`)
- `display_override` : `['window-controls-overlay', 'standalone']`
- `categories` : `['music', 'education', 'entertainment']`
- 10 icônes PNG explicites (8 `any` + 2 `maskable`)
- `includeAssets` étendu à `icons/*.png`

### Phase 4 — InstallPrompt `src/components/pwa/InstallPrompt.tsx`

Nouveau composant (monté dans `src/main.tsx`) :
- Détection iOS (UA + `navigator.maxTouchPoints` pour iPads récents)
- Détection mode standalone (déjà installé → pas de prompt)
- Logique "actif depuis > 2 jours" via `localStorage` (clé `rifflab-first-visit`)
- Cooldown dismiss 14 jours (clé `rifflab-install-dismissed`)
- **Android/Chrome** : écoute `beforeinstallprompt` → toast → `event.prompt()`
- **iOS** : toast après 4s → bottom sheet guide "Partager → Sur l'écran d'accueil"
- Framer Motion (spring animations), z-index 75 (sous PWAUpdateToast à 80)
- Positionné à `bottom: max(5.5rem, env(safe-area-inset-bottom) + 5rem)` pour passer au-dessus de la MobileNav

---

## Tests à faire (Melvin)

- [ ] **Vrai iPhone / Safari** : aller sur riff-lab-sigma.vercel.app, puis "Partager → Sur l'écran d'accueil". Vérifier :
  - Icône flamme gold visible (pas le favicon.svg générique)
  - Splash screen noir + logo au lancement
  - Mode standalone (pas de barre URL Safari)
  - Titre "RiffLab" sur l'icône
- [ ] **Attendre 2 jours** (ou forcer via DevTools : `localStorage.setItem('rifflab-first-visit', Date.now() - 3*86400000)`) → le prompt doit apparaître
- [ ] **Android Chrome** : vérifier le prompt natif d'install
- [ ] **Lighthouse PWA** : viser 100/100 dans Chrome DevTools

---

## Fichiers modifiés/créés

| Fichier | Action |
|---|---|
| `scripts/generate-icons.mjs` | CRÉÉ |
| `public/icons/*` (19 fichiers) | CRÉÉ |
| `index.html` | MODIFIÉ (meta tags + splash links) |
| `vite.config.ts` | MODIFIÉ (manifest étendu) |
| `src/components/pwa/InstallPrompt.tsx` | CRÉÉ |
| `src/main.tsx` | MODIFIÉ (mount InstallPrompt) |
| `package.json` | MODIFIÉ (script generate-icons) |
| `docs/SESSION-LOG-2026-06-17-pwa-ios.md` | CRÉÉ |

---

✅ Mergé dans main (SHA 97f8955)
