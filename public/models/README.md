# 3D models

## Modèle de prod : `guitar-fender-classic.glb` (~1 MB)

Utilisé par `src/components/three/HeroGuitar3D.tsx` sur la landing.
C'est le seul `.glb` versionné — voir `.gitignore` qui blacklist les
autres `*.glb` du dossier pour ne pas bloater le repo.

Si tu déposes d'autres modèles ici (`guitar-fender-rose.glb`,
`amp.glb`, `studio-scene.glb`, etc.), ils restent **locaux uniquement** —
parfait pour expérimenter sans push.

### Sources CC0 / CC BY conseillées

- **Quaternius** — https://quaternius.com/ → packs Music / Stylized Instruments
- **Poly Haven** — https://polyhaven.com/models
- **Sketchfab** — filtre `CC0` ou `CC BY` + "guitar low poly"
- **Polypizza** — https://poly.pizza/u/Quaternius

### Critères

| Critère | Valeur cible |
|---|---|
| Format | `.glb` (binary glTF 2.0) |
| Poids max | 2 MB |
| Triangles | < 30k (low-poly) |
| Y-up, échelle ~1 unité = ~10 cm |
| Origine au centre du body |

### Workflow

1. Télécharge le `.glb`
2. (Optionnel) Compresse avec [gltf-transform](https://gltf-transform.dev/) :
   ```
   npx @gltf-transform/cli optimize input.glb output.glb --texture-compress webp
   ```
3. Renomme en `guitar.glb` et dépose dans ce dossier
4. Recharge le dev server — la guitare apparaît sur la landing

### Licence

Si le modèle est en CC BY (attribution requise), ajoute la mention
dans le footer de la landing (`src/pages/Landing.tsx`).
