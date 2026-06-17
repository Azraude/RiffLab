# Session 2026-06-17 — Refonte copy + mobile-first Landing

> Objectif : virer la copy générique "carnet du guitariste", recadrer sur
> l'axe actuel (plateforme sociale guitare + studio de compo + bibliothèques
> + pratique quotidienne), puis refonte mobile-first.
> Branche worktree `claude/elated-babbage-797ecf` → merge `main` en fin de session.

---

## Audit copy actuelle (constat)

Copy **hybride et incohérente** :
- `landing.kicker` (i18n) = "Le carnet du guitariste moderne" → **générique, à virer**
- `landing.headline` (i18n) = "Pratique.Compose.Joue." → ok mais le `HeroTitle`
  dore le mot `'Compose'` en cherchant dans une string i18n (fragile).
- Le body (subtitle, CTAs, features) est **déjà en dur** dans `Landing.tsx`,
  plus récent que l'i18n → les deux sources divergent.
- Angle entièrement "carnet perso" : zéro mention du **feed social de riffs**,
  du **studio de compo (lock accord → suggestion)**, du **mode jam**. C'est
  pourtant le cœur de l'app maintenant.

Décision : copy hardcodée FR dans `Landing.tsx` (app francophone), clés i18n
`landing.*` mises à jour en miroir (FR + EN) pour cohérence. Le `HeroTitle`
arrête de deviner le mot doré → on lui passe explicitement le segment à dorer.

---

## PHASE 1 — Nouvelle copy (brouillon)

### HERO

**Pre-title (gold, petit)**
> Pour les guitaristes qui veulent vraiment progresser

**Title H1 — ✅ VALIDÉ par Melvin (option 3) :**

> **« L'app guitare que tu attendais. »** — mot doré : **guitare**

*(options écartées : "Compose, joue, partage. Tout au même endroit." /
"Ton studio guitare, dans ton navigateur.")*

**Subtitle (1 phrase concrète) — validé avec le H1 :**
> Studio de compo, feed de riffs, accords & gammes, mode jam, pratique trackée.
> Le tout sans pub.

**CTA primaire** → `/dashboard`
> Commencer — gratuit, sans inscription

**CTA secondaire** → `/riffs`
> Voir le feed de riffs

**Micro-copy sous les CTAs**
> 100 % local par défaut. Tes données restent sur ton téléphone.

---

### SECTION « Ce que tu peux faire » (remplace les features génériques)

Titre : **Tout ce qu'il te faut, rien que tu paies en double.**
Sous-titre : *Pensé pour le téléphone sur le stand : lisible à 50 cm, tout au pouce.*

| Icône | Nom | Ligne |
|---|---|---|
| 🎯 | **Pratique quotidienne** | Coche tes séances, regarde ta série grandir, repère les accords que tu fuis. |
| 🎼 | **Studio de compo** | Bloque un accord, l'algo propose la suite qui sonne. Des progressions sans prise de tête théorique. |
| 🎸 | **Feed de riffs** | Joue les riffs des autres, like ceux qui claquent, publie les tiens. Une commu, pas un catalogue. |
| 🎹 | **Accords & gammes** | Toute la bibliothèque sur un manche interactif. Voicings, gammes, transpose en un tap. |
| 🥁 | **Mode jam** | Batterie, basse et accords qui te suivent. Jamme comme si t'avais un groupe derrière. |
| 📊 | **Stats & streak** | Ton année de guitare en chiffres : temps joué, accords bossés, courbe de progression. |

---

### SECTION « Pourquoi pas Ultimate Guitar / Songsterr / Yousician »

Titre : **Pourquoi pas juste Ultimate Guitar ?**
3 colonnes, honnête (promesses concrètes, pas "on est meilleurs") :

1. **Pas de pub qui clignote**
   Tu lis tes accords, tu joues. Rien ne s'agite, rien ne te coupe en plein riff.

2. **Pas de paywall sur les bases**
   Accords, gammes, riffs, tuner, métronome : gratuits, et ça le reste. On ne
   te fait pas payer pour voir un Do majeur.

3. **Tes données restent chez toi**
   Tout vit en local sur ton tél par défaut. Pas de compte obligatoire, pas de
   revente de données.

---

### SECTION « Sons & visuels » (garde la 3D qui marche)

Titre : **Des vraies guitares, pas des bips.**
> Samples HQ de vraies guitares, 5 amplis modélisés, et un manche interactif
> que tu peux lire à bout de bras en pleine répèt.

*(visuel : on garde `HeroScene3D` desktop / fallback gradient mobile)*

---

### FOOTER CTA

Titre : **Prends ta guitare.**
> Le carnet démarre vide ou avec quelques exemples. Tout reste sur ton tél —
> pas de cloud tant que tu ne le décides pas.

CTA → `/dashboard`
> Ouvrir mon carnet

**Footer bas** : RiffLab v0.4 · local-first · open source — liens : À propos · GitHub

---

## PHASE 2 — Mobile-first ✅

- Hero refait en `min-h-[88vh] md:min-h-[90vh]` flex-col : kicker + H1 +
  subtitle + 2 CTAs **above-the-fold** sur 375px, 3D reléguée en background
  absolu de la moitié basse (`top-[52%]`), spacer flex en bas.
- CTAs `h-12` (≥44px), empilés en colonne sur mobile (`flex-col`), en ligne
  ≥sm. Bouton header `h-11`.
- Sections en 1 colonne mobile → grille `sm:grid-cols-2 lg:grid-cols-3`
  (features) et `sm:grid-cols-3` (comparatif). Aucun scroll horizontal.
- Body remonté à `text-base` (16px) mobile, captions `text-xs`/`text-sm`.
- 3D : `HeroScene3DLazy` déjà gated par `useCanRender3D` → fallback gradient
  sur mobile / low-end / reduced-motion. Rien à changer.

## PHASE 3 — Polish visuel ✅

- Stagger reveal au scroll via Framer `whileInView` + `staggerChildren` sur
  les 3 grilles (features, comparatif).
- Halos gold radiaux (hero, sons, footer CTA), gradient fade bas du hero.
- Footer enrichi : logo flame `RiffLabLogo` + version + liens À propos/GitHub.
- `HeroTitle` refactoré : prend un prop `goldWord` explicite ("guitare") au
  lieu de deviner "Compose" dans la string i18n.

## PHASE 3.5 — Accessibilité reduced-motion ✅

- `HeroTitle` : branche statique si `useReducedMotion()` (mot doré conservé,
  zéro stagger/blur).
- `FloatingDots` : `@media (prefers-reduced-motion: reduce)` coupe l'animation
  et masque les dots.

## PHASE 4 — Tests responsive ✅

- `npm run build` : ✅ passe (tsc strict + vite, built in 1m10s).
- Imports lucide neufs (`Target`, `Wand2`, `Users`, `Drum`, `Check`) résolus.
- 375 / 768 / 1280 : layout flex + grilles responsive, CTAs `h-12` au pouce,
  pas d'overflow horizontal (sections `max-w-*` + `px-5`).
- ⚠️ Pas de screenshot preview (headless = #root vide, cf. mémoire projet) —
  vérif via build conformément à la note de session précédente.

---

## Fichiers touchés

- `src/pages/Landing.tsx` — refonte complète copy + layout.
- `src/i18n/locales/fr.json` + `en.json` — `landing.kicker` + `landing.headline`
  recadrés (FR + EN).
- `docs/SESSION-LOG-2026-06-17-landing.md` — ce log.
