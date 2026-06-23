# AdSense Integration — Swap des placeholders

Le système pub est déjà câblé en mode **placeholder** (cross-promo RiffLab+).
Tant que `VITE_ADSENSE_CLIENT_ID` est vide, `isAdSenseEnabled()` renvoie
`false` et tous les `<AdSlot>` affichent le placeholder. Aucune dépendance
externe chargée. Voici comment passer aux vraies pubs une fois AdSense validé.

## Étapes

1. **Obtiens ton Client ID** AdSense (format `ca-pub-XXXXXXXXXXXXXXXX`).

2. **Env var Vercel** (et `.env.local` en dev) :
   ```
   VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
   ```
   > C'est tout pour activer le mode AdSense : `src/lib/ads/adsense.ts` lit
   > déjà cette variable (`ADSENSE_CLIENT_ID`). Pas de modif de code requise
   > pour le client ID.

3. **Crée un ad unit par emplacement** dans le dashboard AdSense
   (Ads → By ad unit → Create) et copie chaque `data-ad-slot` :
   - Bannière (display, responsive)
   - In-feed (native / in-feed)
   - Interstitielle (display, square 250×250 ou responsive)

4. **Renseigne les `adSlot` dans le code** (actuellement `adSlot=""`) :
   - `src/components/premium/AdBanner.tsx` → `<AdSlot format="banner" adSlot="XXXXXXXXXX" />`
   - `src/pages/Riffs.tsx` → `<AdSlot format="native" adSlot="YYYYYYYYYY" ... />`
   - `src/components/ads/InterstitialAd.tsx` → `<AdSlot format="square" adSlot="ZZZZZZZZZZ" />`

5. **Initialise le script** au boot (si pas premium). Dans `src/main.tsx`
   ou un effet de `Layout`, appelle `initAdSense()` :
   ```ts
   import { initAdSense } from '@/lib/ads/adsense';
   // au boot, hors premium :
   initAdSense();
   ```
   (no-op tant que l'env var est vide, donc on peut l'ajouter dès maintenant.)

6. **Push + redéploie.**

## Conditions de validation AdSense (1–14 j)

- Site en production (Vercel OK).
- Pages **`/privacy` et `/terms` accessibles** (déjà en place — cette session).
- Suffisamment de contenu (les riffs publiés comptent comme des pages).
- Aucun contenu interdit AdSense.

## Architecture côté code (rappel)

- `src/lib/ads/adsense.ts` — `ADSENSE_CLIENT_ID`, `isAdSenseEnabled`, `initAdSense`, `pushAd`.
- `src/components/ads/AdSlot.tsx` — placeholder ↔ `<ins adsbygoogle>` selon config ; `null` si premium.
- `src/components/ads/InterstitialAd.tsx` — interstitielle plein écran (skip 5 s), pilotée par `adStore`.
- `src/stores/adStore.ts` — frequency cap : pop-up après 10 riffs visités ; interstitielle sur action avec cooldown 5 min + min 3 actions.
- Tous les `AdSlot`/bannières/interstitielles renvoient `null` si `isPremium` → **RiffLab+ = zéro pub**.
