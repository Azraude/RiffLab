# Recovery 2026-05-18 — Session 20.1

> Réparation des dommages de la session 20 nuit avant push sur main.
> 1 seul commit "fix(session-20-recovery)" pour squash tout d'un coup.

## 🔴 Vrai bug critique trouvé

**`ConvolverNode: buffer sample rate 44100 does not match context rate 48000`**

Cause : dans `src/lib/ampChain.ts`, je hardcodais `const sr = 44100` pour l'OfflineAudioContext qui génère les IRs cabinet. Mais sur la plupart des setups modernes (Chrome desktop notamment), l'AudioContext tourne à 48000 Hz. Quand `buildAmpChain` essayait d'assigner le buffer généré au `Tone.Convolver`, Web Audio API throw `NotSupportedError`.

Effet en cascade :
1. `buildVoices()` crash sur le premier preset sampler (5 sur 11 timbres)
2. `voices = []` après le throw silencieux (caught dans le useLiveQuery / hook)
3. Toutes les API audio (`playNote`, `strumChord`) renvoient silence parce que `voices[0]` est undefined
4. → **Symptôme côté Melvin : TabPlayer pas de son, Settings switch ne marche pas**
5. → /chords semblait marcher uniquement à cause d'un retry magique ou parce que le crash était silencieux après le premier rebuild

## ✅ Fixes audio (4 patches)

1. **`getCabIR`** utilise maintenant `Tone.getContext().sampleRate` au lieu de 44100 hardcodé → buffer et destination context au même SR.
2. **`getCabIRSync`** invalide le cache si la SR ne match plus (rare mais possible si user change de device output mid-session).
3. **`buildAmpChain`** wrap le `convolver.buffer = ...` dans un try/catch, avec fallback **fakecab** (Tone.Filter lowpass à `cabProfile.highCut`) pour ne PAS crasher `buildVoices` même si l'IR rejette pour une raison X. Le fakecab sonne moins "convolvé" mais audible.
4. **`initAudio`** await `prewarmCabinets()` AVANT `buildVoices` au lieu de fire-and-forget. Coût : ~80ms au premier init, totalement acceptable.
5. **`rebuildVoices`** devient `async` et await `prewarmCabinets()` aussi (idempotent — cache hit instant après le premier init). Garantit que le switch dans Settings est audible immédiatement sur le preview Em qui suit.

## 🎨 Fixes visuels (2 patches préventifs)

Melvin signalait "glossy/glassy retiré" mais audit confirme : **rien n'a été retiré**. Landing.tsx n'a même pas été touché pendant la nuit. Dashboard diff = uniquement additif. Le diagnostic réel = ma CSS `prefers-reduced-motion` était trop agressive :

1. **Reduced-motion** : avant je faisais `* { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important }` global → si l'OS de Melvin a "reduced motion" activé dans Accessibilité Windows, ÇA tuerait toutes les framer-motion entrances + tous les hover transitions. Maintenant je coupe uniquement les anims permanentes nommées (sheen, sparkles, trophy pulse, flicker, skeleton shimmer). Hover/focus/page transitions intacts.
2. **Focus-visible border-radius** : `:focus-visible { border-radius: 4px }` global forçait un focus ring rectangulaire 4px sur les boutons arrondis. Supprimé — les navigateurs modernes font suivre l'outline au border-radius natif de l'élément.

## ✨ Tutorial outro step (TASK demandée)

Ajout d'un 5e step au Tutorial overlay :
- `targetId: null` → pas de spotlight, modal centré
- Titre : "C'est parti !"
- Body : "T'as toutes les clés. Joue, explore, kiffe — RiffLab est un terrain de jeu, pas un cours."
- CTA : "Allez régale-toi 🎸"
- Au click → 24 particules **gold confetti** qui s'éparpillent en cercle (delay 700ms avant la fermeture)

## 📋 Vérifs faites en preview

| Check | Résultat |
|---|---|
| `npm run build` | ✓ pass 23s |
| Landing : glassy backdrop-blur | ✓ 10 éléments |
| Landing : border-gold | ✓ 15 éléments |
| Landing : flame flicker animation | ✓ running 2.4s infinite |
| Dashboard : streak-trophy-glow animation | ✓ running 3s infinite |
| Dashboard : daily-gold-sheen | ✓ présent |
| `initAudio('electric-real-sampled')` | ✓ ready=true, **0 erreur console** (avant : NotSupportedError ConvolverNode) |
| `rebuildVoices` switch 3 presets enchaînés | ✓ 0 erreur, activeTimbre OK |
| `ctx.sampleRate` | 48000 (et IR maintenant générée à 48000) |

## 🚫 Pas de fallback à session 18

L'audio Neural-like marche maintenant en hot-swap. Pas besoin de désactiver TASK A, juste corriger le SR mismatch. La chaîne ampChain reste live + le fakecab couvre le cas edge où l'IR ne loadrait pas.

## 📦 Format de push

1 seul commit final : `fix(recovery-20.1): audio SR mismatch + relax reduced-motion + tutorial outro`
- Squash de tous les patches recovery
- À pousser quand Melvin valide le test audio à l'oreille sur /chords + /riffs + Settings switch
