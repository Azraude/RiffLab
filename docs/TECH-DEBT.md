# 🛠 Tech debt — à régler avant ship

> Liste de choses qu'on a sciemment laissées non-optimisées pour avancer
> sur les features. À traiter en fin de Phase 4 / début Phase 5 avant le
> deploy public.

---

## ✅ Résolu — Compression modèles 3D (sess 24)

Pipeline `@gltf-transform/cli optimize --texture-compress webp --texture-size 1024` :

| Fichier | Avant | Après | Réduction |
|---|---|---|---|
| `guitar-fender-rose.glb` | 22 MB | **244 KB** | -98.9% |
| `amp.glb` | 8.5 MB | **216 KB** | -97.5% |
| `guitar-fender-classic.glb` | 981 KB | **131 KB** | -86.7% |
| **Total** | **~31.5 MB** | **~591 KB** | **-98.1%** |

Pipeline complet (flatten / join / weld / simplify / resample / prune /
sparse / textureCompress webp 1024 / meshopt) tourne en ~1.5s par modèle.
`@gltf-transform/cli` ajouté dans devDependencies pour re-compression
future si un modèle est remplacé.

Commande pour re-compresser un modèle :
```bash
npx gltf-transform optimize public/models/X.glb public/models/X.optim.glb --texture-compress webp --texture-size 1024
mv public/models/X.optim.glb public/models/X.glb
```

**`studio-scene.glb` (110 MB)** : reste blacklisted dans `.gitignore` —
jamais loadé en prod (fallback gradient en place dans HeroScene3D). À
compresser et whitelister Phase 5+ si on veut le hero studio plein.

---

## 🔴 Critique (bloquant si on garde tel quel en prod)

_(plus rien — compression .glb résolue sess 24)_

---

## 🟠 Important (à régler avant la promotion publique)

### OG image PNG (vs SVG actuel)
SVG en place mais Twitter/Discord rendent mal → preview cassé pour ces
plateformes. Cible : générer PNG 1200×630 via sharp ou script offscreen
canvas. ~30 min.

### Vercel env vars Supabase
À setup dans Vercel dashboard avant que `VITE_SUPABASE_*` marchent en
prod. Sans ça l'auth fail silencieusement. 5 min.

### Mode Lecture teleprompter (Phase 3.5)
Sur branche `feature/teleprompter`, 70% fait. Mapping chord/syllabe à
trancher (3 options dans le code). ~4h pour merger + finir.

---

## 🟡 Nice-to-have

### Audio Neural-quality / IR cabinets réels
WebAudioFont GM (sess 21) suffit pour v1. Upgrade Phase 5+ si Pro tier
le justifie (IR files licensing à clarifier d'abord).

### i18n traductions incomplètes
Nav full + Dashboard hero migré, le reste FR hardcoded.
Songs/Chords/Scales/Stats/Tuner/Composer/Quiz pas encore. Bloque
l'audience EN. ~4h sweep complet.

### SetlistDetail loading vs not-found
Affiche "Setlist introuvable" pendant le load Dexie initial (UX subtle
bug, pas critique). Fix avec local state + useEffect. ~15 min.
