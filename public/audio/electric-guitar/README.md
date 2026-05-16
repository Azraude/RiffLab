# Electric guitar samples — session 18 : passé en CDN

## Status : 🌐 hébergé sur CDN public, plus besoin de drop local

Depuis la session 18, le timbre `electric-real-sampled` (Préférences →
Son de strum → "Électrique réelle 🎸") charge les samples depuis le
pack open-source **`nbrosowsky/tonejs-instruments`** via GitHub Pages.

- Code : `src/lib/strumSounds.ts` (case `electric-real-sampled`)
- baseUrl : `https://nbrosowsky.github.io/tonejs-instruments/samples/guitar-electric/`
- Pack : https://github.com/nbrosowsky/tonejs-instruments
- 13 samples ancres (A2 → A5 par tierces), Tone.Sampler interpole
  pour toutes les notes intermédiaires

## Pourquoi le CDN

- ✅ Zéro fichier dans le repo (gain de poids)
- ✅ Zéro étape manuelle pour Melvin
- ✅ Le pack est éprouvé, samples bien normalisés
- ✅ Si une note manque, Tone.Sampler interpole depuis l'ancre la plus
  proche → toujours du son, jamais de blocage

## Si le CDN tombe

Le `onerror` du Sampler log un warn explicite mais Tone continue de
fonctionner avec ce qui est déjà en cache. Si la situation persiste,
on peut soit :
1. Bascule explicite vers `electric-clean` dans Préférences
2. Mirror les samples dans ce dossier et changer le `baseUrl` pour
   `/audio/electric-guitar/`

## Si tu veux drop des samples locaux quand même

(par exemple pour le offline-first ou parce que tu n'aimes pas le
pack actuel)

Format requis : `.mp3` mono ou stereo, 44.1 kHz, 50-200 KB.
Notes ancres recommandées :
- `A2.mp3` `C3.mp3` `Ds3.mp3` `Fs3.mp3` `A3.mp3`
- `C4.mp3` `Ds4.mp3` `Fs4.mp3` `A4.mp3`
- `C5.mp3` `Ds5.mp3` `Fs5.mp3` `A5.mp3`

Sources libres :
- Philharmonia : https://samples.philharmonia.co.uk/instruments-2/
- freepats : https://freepats.zenvoid.org/Guitar/index.html
- VSCO-2 CE : https://github.com/sgossner/VSCO-2-CE

Drop ici puis change `baseUrl` dans strumSounds.ts vers
`/audio/electric-guitar/`.
