# Phase 6 — Extension Chrome "Capture dans RiffLab"

> **Statut** : spec (pas implémenté). Prérequis : Phase 5.2 sync cloud livrée.
> **Effort estimé** : **8–10h** (4h MV3 + 3h capture logic + 2h pub/distrib + 1h tests).
> **Pourquoi** : hack viral. Si 100 guitaristes installent ça, RiffLab devient le go-to "j'apprends sur YouTube" tool.

---

## 1. Use case principal

Un guitariste regarde un tuto YouTube ("How to play Wonderwall — chord by chord"). Il identifie 3-4 moments clés :

- 0:42 — "voici le chord shape Em7"
- 1:18 — "voici la progression du verse"
- 2:50 — "voici le strum pattern"

Sans l'ext : il met YouTube en pause, alt-tab vers RiffLab, copie-colle à la main les accords, fait des allers-retours pour caler les timecodes. → **30 min de friction par tuto**.

Avec l'ext :
1. Clic bouton "📥 Capturer dans RiffLab" (injecté à côté du bouton like)
2. Popup s'ouvre : titre vidéo auto, timecode actuel auto, champ "Ce que tu apprends" pré-rempli avec le titre, transcript chord names si l'IA Phase 5.3 a detecté
3. Clic "Sauvegarder" → un nouveau song apparaît dans RiffLab avec le timecode embed + lien YouTube + caption

Différenciateur : **fait gagner 25 min par tuto**, transforme le workflow YouTube → RiffLab d'effort en réflexe.

---

## 2. Manifest V3 squelette

```jsonc
// manifest.json
{
  "manifest_version": 3,
  "name": "RiffLab — Capture YouTube",
  "version": "0.1.0",
  "description": "Capture des moments de tutos guitare YouTube directement dans ton RiffLab.",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://www.youtube.com/*",
    "https://music.youtube.com/*",
    "https://riff-lab-sigma.vercel.app/*"
  ],
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "Capturer dans RiffLab"
  },
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["https://www.youtube.com/watch*", "https://music.youtube.com/watch*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "web_accessible_resources": [
    {
      "resources": ["styles.css"],
      "matches": ["https://www.youtube.com/*"]
    }
  ]
}
```

---

## 3. Architecture composants

```
extension/
├── manifest.json
├── icons/                          # 16/48/128 PNG (logo RiffLab fond noir + or)
├── background.js                   # Service worker : auth state, deep link router
├── content.js                      # Inject le bouton "📥 RiffLab" sur YouTube
├── content.css                     # Style du bouton injecté (match YouTube)
├── popup.html + popup.js + popup.css   # UI popup quand on clique le bouton
└── lib/
    ├── youtube.js                  # Parse title / channel / timecode depuis DOM
    ├── api.js                      # POST vers Supabase (créer le song)
    └── deeplink.js                 # Fallback : ouvrir l'app web avec params URL
```

### 3.1 content.js — injecter le bouton

```javascript
// Observer le DOM pour catch le bouton like de YouTube
// (parce que YouTube charge en SPA, le bouton n'existe pas immédiatement)
const obs = new MutationObserver(() => {
  const likeBtn = document.querySelector(
    'ytd-watch-flexy ytd-menu-renderer #top-level-buttons-computed > yt-button-shape'
  );
  if (likeBtn && !document.getElementById('rifflab-capture-btn')) {
    injectButton(likeBtn);
  }
});
obs.observe(document.body, { childList: true, subtree: true });

function injectButton(anchor) {
  const btn = document.createElement('button');
  btn.id = 'rifflab-capture-btn';
  btn.innerHTML = `<span>📥</span> Capturer dans RiffLab`;
  btn.className = 'rifflab-btn-inline';
  btn.addEventListener('click', openPopup);
  anchor.parentElement.insertBefore(btn, anchor.nextSibling);
}
```

### 3.2 popup.html — UI capture

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="popup.css" />
</head>
<body class="rifflab-popup">
  <header>
    <img src="icons/icon-48.png" width="32" />
    <h1>Capturer ce moment</h1>
  </header>

  <div class="field">
    <label>Titre de la vidéo</label>
    <input type="text" id="video-title" />
  </div>

  <div class="field">
    <label>Ce que tu apprends (riff name)</label>
    <input type="text" id="riff-name" placeholder="ex: Verse Wonderwall chord shapes" />
  </div>

  <div class="field">
    <label>Timecode actuel</label>
    <span id="timecode">00:42</span>
    <button id="save-tc">Enregistrer ce moment</button>
  </div>

  <div class="field" id="chord-suggestions">
    <label>Accords détectés (auto Phase 5.3)</label>
    <div id="chord-chips"><!-- chips dynamiques --></div>
  </div>

  <button id="save-btn" class="primary">Sauvegarder dans RiffLab</button>

  <footer>
    <a href="https://riff-lab-sigma.vercel.app" target="_blank">Ouvrir RiffLab</a>
    <span id="auth-status">Connecté en tant que melvin@gmail.com</span>
  </footer>
</body>
</html>
```

---

## 4. Communication ext ↔ app

### Option A — Deep link via URL (MVP)

L'ext n'a pas accès direct à l'IndexedDB du domaine `riff-lab-sigma.vercel.app`. Solution simple : ouvrir une URL avec params, l'app web la parse et crée le song.

```javascript
// Dans l'ext, au save :
const params = new URLSearchParams({
  source: 'youtube',
  videoId: 'AbCdEfGh',
  videoTitle: 'How to play Wonderwall',
  channel: 'JustinGuitar',
  timecode: '42',
  riffName: 'Verse chord shapes',
  chords: 'Em7,G,Dsus,A7sus4',
});
chrome.tabs.create({
  url: `https://riff-lab-sigma.vercel.app/capture?${params}`,
});
```

Côté app web, ajouter route `/capture` qui parse les params et :
1. Si user pas loggé → LoginModal puis retry
2. Sinon créer le song avec metadata YouTube + redirect `/songs/:id`

Avantages : 0 perm cross-domain, fonctionne tout de suite.

### Option B — Via Supabase channel (post-Phase 5.2)

Si Phase 5.2 sync cloud livrée :
1. Ext insert directement dans Supabase songs (avec auth token user qui s'est loggé via popup)
2. Le sync cloud côté app web pull le song en arrière-plan → apparait sans rechargement

Avantages : feel "magic", song apparait dans l'app sans ouvrir un nouvel onglet.
Coûts : il faut que l'ext sache l'auth token user → flow OAuth Supabase dans popup, plus complexe.

**Reco : démarrer Option A en MVP (1 semaine), passer Option B Phase 6.1.**

---

## 5. UI ext popup

### Design

Réutilise le design system RiffLab :
- Background noir `#0a0a0a`
- Bordure or chaud `#d4b76a` sur boutons primaires
- Font Inter pour body, Cormorant Garamond pour le h1
- Pas de Tailwind dans l'ext (overhead pour un popup 320px) → CSS vanilla qui mirror les tokens

### Mobile-style 360×480

```css
body.rifflab-popup {
  width: 360px;
  min-height: 480px;
  background: #0a0a0a;
  color: #ffffff;
  font-family: 'Inter', system-ui, sans-serif;
  margin: 0;
  padding: 16px;
}
header h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  color: #d4b76a;
}
.primary {
  background: linear-gradient(180deg, #f5d97a, #d4b76a);
  color: #0a0a0a;
  font-weight: 600;
  height: 44px;
  border-radius: 12px;
  width: 100%;
}
```

---

## 6. Distribution Chrome Web Store

### Process review : ~ 1-2 semaines

1. Créer un compte développeur Chrome ($5 one-time fee)
2. Bundle : `zip -r rifflab-ext.zip extension/`
3. Upload sur https://chrome.google.com/webstore/devconsole
4. Remplir : description, screenshots 1280×800 (3-5), promo tile, privacy policy URL
5. Submit → review (souvent ~3-7 jours pour ext simple, peut prendre 2 semaines en cas de question)
6. Pub auto si accepté, ou refus avec raison à corriger

### Privacy policy nécessaire

L'ext ne tracke rien mais il **lit le titre de la vidéo YouTube** et **stocke local le riff name + chords**. Privacy policy en 1 page sur le site (page `/privacy-extension` à créer Phase 6).

### Marketing du listing

- Title : "RiffLab — Capture YouTube tutos guitare"
- Tagline : "Save the moment that taught you the chord. Direct to your RiffLab notebook."
- Screenshots : 1) bouton injecté near like / 2) popup ouvert / 3) song créé dans l'app web

---

## 7. Étapes d'implémentation (8-10h)

| # | Étape | Temps |
|---|---|---|
| 1 | Setup repo `rifflab-extension/` (séparé du repo app) + manifest v3 | 0.5h |
| 2 | `content.js` : MutationObserver + inject bouton à côté du like YouTube | 1h |
| 3 | `popup.html + popup.js` : UI capture form | 2h |
| 4 | `lib/youtube.js` : parse title/channel/duration/currentTime | 0.5h |
| 5 | Deep link `/capture?...` côté app web + route + parse + create song | 2h |
| 6 | Auto-detection chords (placeholder pour Phase 5.3 IA) | 0.5h |
| 7 | Bundle + zip + Chrome Web Store submit (compte + assets + descriptif) | 1.5h |
| 8 | Privacy policy page `/privacy-extension` côté app web | 0.5h |
| 9 | Tests : tuto JustinGuitar / Marty Music / Paul Davids | 1h |

**Total : 8–10h** dont 1.5h gestion Chrome Web Store (non-codable).

---

## 8. Risques

1. **YouTube change son DOM** — content.js sélecteurs cassent → bouton disparait. Mitigation : 3 sélecteurs fallback + monitoring via télémétrie (mais on track rien → reporting user only).
2. **Manifest V3 quotas** — service worker max 30s d'exécution, IndexedDB pas dispo dans le SW. Pour nous OK (rien de long, juste open tab).
3. **Auth state ext ↔ app** — si user logout dans l'app, l'ext garde l'ancien state. Solution : popup checke `chrome.storage.session` qui invalide après 1h, force re-auth.
4. **Multi-langue** — l'ext démarre FR par défaut, EN si user nav en EN. Reuse les locales fr.json / en.json du main repo via build step.
5. **YouTube Music** — `music.youtube.com` a un autre DOM → 2 content scripts ou un selector unifié.
6. **Mobile Chrome** — les ext ne sont PAS supportées sur mobile Chrome. C'est du desktop-only. Doc clair côté listing.

---

## 9. Pas dans cette phase

- Détection automatique des accords (audio MP3) → Phase 5.3 IA
- Capture autre que YouTube (SoundCloud, Bandcamp) → Phase 6.1
- Sync directe via channel Supabase → Phase 6.1 si Phase 5.2 livrée
- Firefox / Edge / Safari support → Phase 6.2

---

## 10. Décisions ouvertes

1. **Sélecteur YouTube** : viser le bouton like ou un menu "Share" ? → Reco : à côté du like (plus visible).
2. **Auth flow popup** : Magic link via Supabase ? Ou exiger d'être logged sur l'app web et lire le cookie ? → Reco : magic link (l'app web n'expose pas son cookie cross-domain).
3. **Free ou Premium ?** → Reco : free Phase 6, devient un cosmetic premium (skin / custom icon) Phase 5.4.
4. **Naming** : "Capture", "Grab", "Save to RiffLab" ? → Reco : "Capturer dans RiffLab" FR / "Save to RiffLab" EN.
