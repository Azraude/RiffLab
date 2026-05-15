# 🛠 Tech debt — à régler avant ship

> Liste de choses qu'on a sciemment laissées non-optimisées pour avancer
> sur les features. À traiter en fin de Phase 4 / début Phase 5 avant le
> deploy public.

---

## 🔴 Critique (bloquant si on garde tel quel en prod)

### Modèles 3D non optimisés (mai 2026)

Les 4 .glb dans `public/models/` sont des téléchargements bruts Sketchfab,
**non compressés** :

| Fichier | Taille actuelle | Cible | Notes |
|---|---|---|---|
| `studio-scene.glb` | **110 MB** | < 5 MB | Hero landing — critique, c'est ce qui s'affiche en premier |
| `guitar-fender-rose.glb` | 22 MB | < 2 MB | Décor Dashboard / Plan |
| `amp.glb` | 8.5 MB | < 1.5 MB | Décor Métronome |
| `guitar-fender-classic.glb` | 981 KB | ✅ OK | Pas besoin d'optimiser |

**Impact actuel** : un user en 4G attend ~2 min pour charger la landing
(110 MB). Tueur de conversion absolu.

**Comment optimiser** : passer chaque fichier dans
[gltf.report](https://gltf.report) → onglet Optimize → cocher :
- Draco geometry compression
- Meshopt compression
- Texture resize 1024 ou 2048 (Sketchfab pousse souvent du 4K inutile)
- WebP texture format

Replace dans `public/models/` sous le même nom, le code n'a pas à
bouger. Compter ~5 min de manip par fichier.

**Quand le faire** : avant le deploy public Phase 5, pas avant. En dev
local + Vercel preview ça marche, c'est juste qu'on flambe la bande
passante de Vercel sur les builds.

---

## 🟠 Important (à régler avant la promotion publique)

*(à compléter au fur et à mesure des découvertes)*

---

## 🟡 Nice-to-have

*(à compléter)*
