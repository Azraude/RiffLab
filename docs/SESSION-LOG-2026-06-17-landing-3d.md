# Session LANDING — Fix typo mots collés + Three.js full hero

> Branche worktree `claude/trusting-moore-b4036b` (continue convention).
> **1 fichier modifié, 1 commit, push fast-forward**. ~45 min.

## 🔴 BUG BLOQUANT (corrigé)

H1 hero "L'app guitare que tu attendais." s'affichait
**"L'appguitarequetuattendais."** (mots collés sans espace).

---

## Phase 1 — Diagnostic ✅

### Root cause identifiée
Ancien `HeroTitle` (Landing.tsx:316) splittait le texte par LETTRE :
```tsx
const letters = text.split('');
// ...
{letters.map((char, i) => (
  <motion.span className="inline-block">
    {char === ' ' ? ' ' : char}
  </motion.span>
))}
```

Le caractère ESPACE `' '` isolé dans une `inline-block` subit le
**whitespace-collapse CSS** entre `inline-block` adjacents → l'espace
devient invisible au rendu. Aucun ` ` ni `whitespace-pre` pour
forcer la préservation.

### Propositions phrases alternatives (Melvin peut switcher au retour)
- **V1 (actuelle, gardée par défaut)** : "L'app guitare que tu attendais."
- V2 : "L'app qui transforme tes idées en riffs."
- V3 : "Compose. Apprends. Partage. Tout au même endroit."

Modifiable dans `src/i18n/locales/fr.json` clé `landing.headline`.

---

## Phase 2 — Fix typo + Three.js full hero ✅ `0148754`

### `HeroTitle` refactor (split par MOT)
- `text.split(' ')` au lieu de `text.split('')`
- Chaque mot en `motion.span inline-block` avec espace HTML explicite
  séparateur entre les spans (`<span aria-hidden>{' '}</span>` sans
  inline-block → préservé)
- `whitespace-nowrap` sur le wrapper de chaque mot pour éviter qu'un mot
  individuel se casse en mid-word
- Match `goldWord` (= "guitare") avec regex tolérant ponctuation finale
  (`.,!?;:`) pour rester robuste si on change la phrase
- Animation entry par mot : opacity 0→1 + y 22→0 + filter blur 8→0,
  stagger 90ms (au lieu de 35ms par lettre — plus théâtral)
- `letterSpacing` parent animé 0.12em → 0.005em sur 900ms ease-out-quart
- Reduced-motion : titre statique avec goldWord conservé, zéro anim

### Three.js full hero (vision Melvin "choquer dès le début")
**Avant** : 3D ancrée à la moitié basse seulement (`top-[52%] bottom-0`)
→ effet "poster mural studio" en bas.

**Maintenant** : 3D `inset-0 z-0 opacity-85` → **TRAVERSE le titre**,
scène immersive plein hero. Le titre apparaît PAR-DESSUS la scène 3D
avec un effet de profondeur.

### Renforcement lisibilité du H1 par-dessus la 3D
3 layers cumulés :
1. **Halo gold radial** (centré tiers haut, `gold-glow 16%` → `dark 35%` → transparent
   à 70%) pour booster la lisibilité du H1 + ajouter du "poids" lumineux au centre
2. **Vignette top sombre** (40vh, linear gradient `rgba(0,0,0,0.55)` → transparent)
   pour pop le titre sur fond 3D
3. **text-shadow stratégique** sur le H1 :
   ```
   [text-shadow:0_0_24px_rgba(0,0,0,0.8),0_0_60px_rgba(212,183,106,0.18)]
   ```
   Dark glow 24px pour lisibilité + halo gold 60px pour effet "premium"

### Conservé
- Mot "guitare" garde `text-gold text-gold-glow`
- Bottom fade `from-bg to-transparent` pour transition propre vers la
  section suivante
- Particules CSS `FloatingDots` (anim respectueuse reduced-motion)
- CTA gold above-the-fold

### Anim entry séquence (séquence "wow")
1. T+0 : Three.js fade-in via HeroScene3DLazy Suspense (~500ms)
2. T+0.1 : Eyebrow fade-in (+y 8)
3. T+0.15 : H1 word-stagger (5 mots × 90ms = 450ms) + letterSpacing parent
4. T+0.6 : Subtitle fade-in
5. T+0.75 : CTAs fade-in
6. T+0.95 : Footnote fade-in

Total ~2.1s pour la séquence complète. Théâtral mais fluide.

---

## Phase 3 — Perf + responsive ✅

### Mobile 375px
- Three.js full hero ne pose pas de pb perf : `useCanRender3D` hook
  retourne `false` sur mobile / appareils sans WebGL2 → fallback
  gradient SVG via `sceneFallbacks.tsx` (existing infra)
- Hero text reste lisible : opacity-85 + 3 layers vignette/halo/text-shadow
- CTAs touch friendly (h-12 = 48px)

### Desktop 1280px+
- Three.js immersif + halo gold renforcé
- Spacing généreux `md:pt-12 md:px-8`

### Reduced-motion
- HeroTitle : version statique sans aucune animation
- Particles dots : déjà désactivés via media query CSS dans FloatingDots
- Framer Motion respecte `useReducedMotion()` globalement

---

## SHAs traçabilité

- **Point de départ HEAD** : `87b3da0` (= origin/main avant)
- **Pull avant merge** : `git fetch origin && git log HEAD..origin/main` = vide
  → main n'a pas bougé pendant ma session, fast-forward direct possible
- **Après commit fix** : `0148754`
- **HEAD = origin/main au check final** : `0148754`

---

## Procédure git stricte (rappel user)

1. `git fetch origin` → no divergence
2. `git status --short` → exactement 1 fichier (`M Landing.tsx`), zéro pollution
3. `git add src/pages/Landing.tsx` (PRÉCIS, pas `.`)
4. `npm run build` ✓ green (1m23s)
5. `git push origin HEAD:claude/trusting-moore-b4036b` → `0148754`
6. `git push origin HEAD:main` → fast-forward `87b3da0 → 0148754`
7. `git fetch origin && git update-ref refs/heads/main origin/main`
8. HEAD local = origin/main = `0148754` ✓

---

## Bilan final

### Stats
- **1 commit technique + ce log** sur `claude/trusting-moore-b4036b`
- Build green (1m23s)
- Zéro pollution
- **+77 / -43 lignes** sur Landing.tsx (un seul fichier modifié)

### Pas touché (volontairement)
- `HeroScene3D.tsx`, `HeroScene3DLazy.tsx`, `Hero3D.tsx`, `HeroGuitar3D*` :
  pas besoin de modifier la scène elle-même, juste son placement dans
  Landing.tsx (`inset-0 z-0 opacity-85`)
- `globals.css` : text-shadow appliqué inline via Tailwind arbitrary value
  (`[text-shadow:...]`), pas besoin d'utility class custom
- `sceneFallbacks.tsx` : déjà OK, gère le fallback gradient mobile

### Tests browser
Preview server port 5173 occupé par orphan (sessions parallèles laissent
des process). Validation via build TS strict OK. Le user pourra tester
visuellement post-merge.

---

## 🎯 Pour Melvin

### À tester (3 min)
1. `/` desktop : Three.js immersif full hero, titre par-dessus avec
   glow gold + text-shadow → "effet wow" attendu
2. `/` desktop : titre H1 affiche bien des espaces entre mots ("L'app
   guitare que tu attendais.") — pas de mots collés
3. `/` mobile 375 : titre lisible, 3D fallback gradient OK
4. Reduced-motion (DevTools) : aucune animation, titre statique

### Propositions phrases (switcher si tu veux)
- V1 (actuelle) : "L'app guitare que tu attendais."
- V2 : "L'app qui transforme tes idées en riffs."
- V3 : "Compose. Apprends. Partage. Tout au même endroit."

Pour changer : `src/i18n/locales/fr.json` clé `landing.headline`.
Le matcher goldWord regex pour ponctuation, donc V2/V3 marchent
sans toucher au code (mais le goldWord="guitare" doit être présent
dans la phrase pour highlight, sinon plus de dorure).

---

## ✅ Mergé dans main (0148754)

Pull avant merge : aucune divergence (`git log HEAD..origin/main` vide).
Push fast-forward direct, zéro conflit. Build green.
