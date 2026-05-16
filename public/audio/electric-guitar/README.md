# Electric guitar samples — TODO Melvin

## Status : à uploader

Le timbre `electric-real-sampled` (Préférences → Son de strum →
"Électrique réelle 🎸") attend 6 fichiers `.mp3` ici. Tant qu'ils ne
sont pas en place, le sampler ne produit aucun son — `console.warn`
explicite + le fallback est de rebasculer sur `electric-clean` dans
Préférences.

## Fichiers requis

```
public/audio/electric-guitar/
├── E2.mp3   (low E, ~82 Hz)
├── A2.mp3   (A, ~110 Hz)
├── D3.mp3   (D, ~147 Hz)
├── G3.mp3   (G, ~196 Hz)
├── B3.mp3   (B, ~247 Hz)
└── E4.mp3   (high E, ~330 Hz)
```

Format : `.mp3` mono ou stereo, 44.1 kHz, taille idéale 50-200 KB par
fichier. Tone.Sampler pitch-shift automatiquement pour les notes
intermédiaires à partir de l'ancre la plus proche.

## Sources libres recommandées

Par ordre de priorité :

1. **Philharmonia Orchestra Samples** — https://samples.philharmonia.co.uk/instruments-2/
   → filtre "Electric Guitar", individual notes long sustain
2. **freepats** — https://freepats.zenvoid.org/Guitar/index.html
3. **VSCO-2 Community Edition** — https://github.com/sgossner/VSCO-2-CE
4. **Spitfire LABS** (free, registration required)
5. **Plogue Sforzando** + free sfz banks

## Workflow

1. Télécharge 6 notes ancres E2/A2/D3/G3/B3/E4 jouées en clean
   (pas d'effet, pas de palm mute). Durée ~2-3s avec release naturel.
2. Convertis en `.mp3` 128-192 kbps (taille raisonnable pour le web)
3. Normalise les volumes (Audacity → Effects → Normalize -3dB)
4. Renomme exactement `E2.mp3`, `A2.mp3`, etc.
5. Drop dans ce dossier
6. Recharge le dev server → le `onload` du Sampler log
   "Electric guitar samples loaded ✓" dans la console

## Optionnel : autres timbres futurs

L'archi `electric-real-sampled` peut être dupliquée pour d'autres
timbres samplés :
- `acoustic-real-sampled` → `public/audio/acoustic-guitar/`
- `nylon-real-sampled` → `public/audio/nylon-guitar/`
- etc.

Chacun se branche dans `src/lib/strumSounds.ts` via une nouvelle case
dans `buildVoices()`.

## Licence

Si les samples sont en CC BY (attribution requise), ajoute la mention
dans `docs/CREDITS.md` (à créer) et linke dans le footer de la landing.
