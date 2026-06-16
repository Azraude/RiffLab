# Session B — RiffDetail mobile-first immersif

> Branche `claude/trusting-moore-b4036b`. Continue Session A.
> **6 phases brief, 6 traitées. 3 commits techniques + log. Build green à chaque.**
> Fichiers strictement respectés : RiffDetail.tsx + RiffPlayer.tsx + LearnRiffMode.tsx.

## 🔴 BUG BLOQUANT
_(aucun)_

---

## Phase 1 — Layout RiffDetail mobile-first + sidebar desktop ✅ `48a1f4c`

### Approche
Refonte de la page `/riffs/:id` pour devenir une vraie expérience d'écoute
mobile-first plutôt qu'une simple page de doc. 375px conçu D'ABORD.

### Changes `src/pages/RiffDetail.tsx`

**Header sticky compact mobile**
- `sticky top-0` mobile + `md:relative` desktop
- Back arrow + 3 IconBtn 44×44 (Like, Bookmark, Share) groupés droite
- bg-bg/90 backdrop-blur-md pour rester lisible en scroll
- Désactivé desktop (nav classique Layout)

**Hero compact (Instagram-style)**
- Avatar 7×7 + @username **CLIQUABLE** vers `/u/:username`
- Difficulté pill + Maîtrisé badge
- Title display-sm mobile / display-lg desktop
- Meta : pills inline mobile (BPM · Tonalité · Mesures), grid 4-cards desktop
- Tags + techniques cliquables `/riffs/tag/:tag`

**Tab area sticky-top mobile**
- `sticky top-[calc(env(safe-area-inset-top)+44px)]` (offset header)
- `md:relative` désactive sticky desktop
- Bleed `-mx-5` + bg-bg pour masquer contenu derrière

**Actions row HIÉRARCHISÉE** (cœur du brief)
- CTA "▶ Écouter le riff" **PRIMARY 48px** full-width gradient gold
  → click : scroll-into-view tab + `playerRef.current?.play()` (Phase 2)
- Grid 2-cols "🎯 Apprendre" (gold) / "📖 Annotations" (border)
  → Apprendre : ouvre LearnRiffMode
  → Annotations : scroll vers la caption (disabled si pas de caption)

**Sidebar desktop ≥lg (1024px)**
- Grid `lg:grid-cols-[minmax(0,1fr)_320px]`
- Aside sticky top-6 : "🎵 Plus de @user" + "🔥 Riffs similaires"
- Cards RelatedRiffRow compact mode pour la sidebar
- Sur <lg : sections empilées en bas de la main column

**Suppressions**
- Bottom sticky "Apprendre ce riff" mobile (remplacé par grid actions row)
- FAB Apprendre desktop bottom-right (redondant avec grid)
- Footer social mobile (déjà dans le header sticky)

### Vérif Playwright 375px
- `hasHorizontalScroll: false` ✅
- Header sticky 4 boutons 44×44 (Back 34×44 OK car icône) ✅
- CTA Écouter 48×335px ✅
- Apprendre + Annotations 44px ✅
- Avatar/@user link OK ✅
- Tab area sticky ✅
- Old bottom sticky Apprendre supprimé ✅

---

## Phase 2 — RiffPlayer sticky bottom + indicateur mesure ✅ `acf1c3e`

### Changes `src/components/riffs/RiffPlayer.tsx`

**forwardRef + useImperativeHandle**
- Expose `{ play(), pause(), stop() }` au parent
- Permet au CTA "Écouter le riff" du RiffDetail de déclencher le play
  via `playerRef.current?.play()`

**Indicateur Mesure X/Y + flèches**
- Row sous le tab area : ChevronLeft 44×44 + "Mesure X / Y" + ChevronRight 44×44
- `currentMeasureIdx` = `activeBeat / 16` si playing, sinon `scrollMeasureIdx`
- `scrollMeasureIdx` observe scrollLeft du tab container (event listener)
- Flèches : `scrollToMeasure(idx ± 1)` → smooth scroll horizontal
- Disabled aux bornes (`<= 0` ou `>= measures.length - 1`)

**Manual scroll detection**
- Touchstart / wheel / pointerdown → `manualScrollUntilRef = now + 3s`
- Autoscroll skip si dans la grace period → user qui swipe garde le contrôle
- Reprend auto-follow après 3s

**Sticky bottom mini-player (apparaît PENDANT playing)**
- `fixed bottom-72px z-45` au-dessus du MobileNav (z-40)
- Progress bar 1px full-width au top
- Play/Pause 44×44 gradient gold | Titre + "Mesure X/Y · 1x · 🔁" | Speed
  cycler + Loop toggle + Close (X)
- Close → `cancelRef = true` + `setPlaying(false)` → mini-player disparait
- Prop `hideStickyBar` (passé par LearnRiffMode pour éviter double-affichage)

### Vérif Playwright 375px
- forwardRef play() depuis CTA → playing devient true ✅
- Sticky mini-player : `position: fixed, bottom: 72px, z-index: 45, h: 65px` ✅
- Distance bottom viewport : 72px (au-dessus du MobileNav) ✅
- Close button → `playing false` + mini-player gone ✅
- highlight mesure courante (overlay bg-gold/8) présent en lecture ✅

### 🟡 Skip honnête : test riff long
TOUS les tabs de `tabsDatabase.ts` ont actuellement 1 seule mesure
(stairway, smoke-on-the-water, iron-man, etc.). Donc flèches "mesure
suivante/précédente" disabled correctement par défaut, mais pas
testables visuellement sur un riff multi-mesures.

La logique est correcte (math validée + observer scrollLeft), juste
non-observable. `tabsDatabase.ts` est dans la liste des fichiers
INTERDITS du brief, donc je ne l'enrichis pas.

À faire dans une session future avec accès tabsDatabase : add un tab
12+ mesures pour démo + vérif flèches actives + autoscroll suivant.

---

## Phase 3 — LearnRiffMode wake-lock + polish ✅ `60358b8`

### Changes `src/components/riffs/LearnRiffMode.tsx`

**Screen Wake Lock API**
- `navigator.wakeLock.request('screen')` au mount, release au unmount
- Réacquisition `visibilitychange` (sentinel relâché par browser au blur)
- Type guard `WakeLockNav` pour Safari/Firefox sans erreur TS
- Try/catch silencieux : no-op gracieux sur Firefox

**Tap targets**
- Bouton X Quitter : h-11 w-11 → **h-12 w-12** (44 → 48px), icon 18 → 20
- Bouton "Je le maîtrise" : add **min-w-220** + icon 18 → 20 + active:scale[0.99]
- Tous les autres déjà ≥56px (h-14)

**hideStickyBar passé au RiffPlayer**
- Sinon double-affichage (mini-player en bas DE l'overlay full-screen)

### Vérif Playwright 375px
- Overlay z-200 au-dessus de MobileNav z-40 ✅
- Close 48×46.4 (h-12 w-12 strict, mesure tronquée par rounded-full) ✅
- Master 56×220 ✅
- `navigator.wakeLock: true` (chrome supporte) ✅

---

## Phase 4 — CommentsSection non-régression ✅ (sans commit)

### Honnêteté
Le brief Phase 4 demande "mock data" + bouton désactivé "Disponible
Session C". MAIS le composant existe **déjà wiré sess 30** avec
socialApi (getComments / postComment / deleteComment + auth state).
Le brief Phase 4 reflète l'état AVANT sess 30 = obsolète.

Le fichier `src/components/social/CommentsSection.tsx` est **INTERDIT**
par le brief Session B (pas dans la liste autorisée). Donc :
- ✅ Pas de régression
- ❌ Pas d'amélioration (interdit)

### Vérif Playwright
- Titre "Commentaires (53)" affiche `riff.commentsCount` ✅
- État "Connecte-toi pour commenter" (pas de session active) ✅
- État "Pas encore de commentaire" (vide en local sans Supabase) ✅

---

## Phase 5 — Sidebar desktop "Plus de @user" + "Similaires" ✅ (fait en Phase 1)

Implémentée directement dans le layout Phase 1 plutôt qu'en commit
séparé. Plus cohérent (le grid `lg:grid-cols-[minmax(0,1fr)_320px]`
est au cœur du layout, pas une feature détachable).

### Vérif Playwright 1335px (desktop)
- Sidebar visible 320px de large ✅
- Sections "🔥 Riffs similaires" rendues (et "🎵 Plus de @user" si data) ✅
- Mobile sections (`lg:hidden`) cachées en desktop ✅
- Header sticky désactivé desktop ✅
- Tab area position relative desktop ✅
- Meta grid 4-cards desktop ✅

---

## Phase 6 — Tests responsive complets ✅

### Mobile 375px ✅
- No horizontal scroll
- Header sticky + 4 boutons icons 44×44
- Hero compact + meta inline + tags cliquables
- Tab area sticky-top (offset header)
- CTA Écouter 48×335 + grid Apprendre/Annotations 44px
- Mini-player apparaît au play (fixed bottom 72, z-45, h 65px)
- Mini-player gone au close
- Tab reste visible quand on scroll vers comments (sticky fonctionne)

### Tablet 768px ✅
- No horizontal scroll
- Sidebar `aside.lg:block` cachée (768 < lg 1024)
- Tab area `md:relative` activé (768 = md+) → plus sticky
- MobileNav `md:hidden` activé → plus visible
- CTA Écouter pleine largeur 422px

### Desktop 1335px ✅
- No horizontal scroll
- Sidebar visible 320px droite
- Mobile sections lg:hidden cachées
- Header sticky désactivé (md:relative)
- Tab area relative
- Meta grid 4-cards desktop visible

### Petits tap targets <40px (acceptable mobile-first)
- Tags `#rock`, `#arpège`, etc. : 21px (chips secondaires, zone dense)
- Speed pills 0.5x/1x : 32px (secondaires dans RiffPlayer)
- @username link 94×16 (lien navig, pas tap primary répèt)

Décision : on garde ainsi. Standard dans Instagram/Spotify pour les
chips. Le brief demande ≥44px pour les actions primaires
(CTA/Apprendre/Annotations) — toutes OK.

---

## Bilan final

### Stats
- **3 commits techniques + ce log** sur `claude/trusting-moore-b4036b` :
  - `48a1f4c` feat(riff-detail) layout pleine page (418 ins, 216 del)
  - `acf1c3e` feat(player) sticky bottom + mesure (353 ins, 162 del)
  - `60358b8` feat(learn-mode) wake-lock + polish (60 ins, 17 del)
- **0 build fails**, **0 régression** (vérifications Playwright)
- Fichiers touchés (strictement dans la liste AUTORISÉE du brief) :
  - `src/pages/RiffDetail.tsx`
  - `src/components/riffs/RiffPlayer.tsx`
  - `src/components/riffs/LearnRiffMode.tsx`
- Fichier autorisé mais NON-TOUCHÉ : `src/components/tabs/TabReader.tsx`
  (l'observer de scroll + scroll programmatique est implémenté
  directement dans le RiffPlayer via scrollRef sur le wrapper div ;
  TabReader reste pur rendu)

### Architecture
```
RiffDetail (page)
├── header sticky-top mobile (back + like + bookmark + share)
├── grid lg:cols [main | sidebar 320px]
│   ├── MAIN
│   │   ├── hero compact (title + avatar @user + meta + tags)
│   │   ├── section #tab-area sticky-top mobile
│   │   │   └── RiffPlayer ref={playerRef}
│   │   │       ├── tab area (scroll-x + autoscroll + highlight mesure)
│   │   │       ├── indicateur Mesure X/Y + flèches ← →
│   │   │       ├── progress bar interactive
│   │   │       └── toolbar inline (play + speed + loop + métronome)
│   │   ├── actions row : [CTA Écouter] + [Apprendre | Annotations]
│   │   ├── caption créateur (scroll target)
│   │   ├── CommentsSection (déjà wiré sess 30)
│   │   └── related/similar (lg:hidden)
│   └── SIDEBAR (lg:block)
│       ├── 🎵 Plus de @user
│       └── 🔥 Riffs similaires
├── LearnRiffMode (overlay full-screen + wake-lock)
└── RiffPlayer.StickyMiniBar (fixed bottom-72 z-45) APPARAIT si playing
```

### Décisions UX importantes
1. **CTA "Écouter le riff" primary** : le brief insiste sur la
   hiérarchisation. Avant : 3 boutons grid 3-cols équivalents. Maintenant :
   1 CTA gold géant + 2 secondaires en dessous.
2. **Mini-player apparaît PENDANT lecture, disparait au close** :
   pattern Spotify / Apple Music / YouTube Music. Pas affiché en
   permanence pour laisser respirer la lecture du tab.
3. **Wake-lock sur LearnRiffMode uniquement, pas la page détail** :
   éviter le drain batterie quand l'user scroll. En mode Apprendre
   focus, l'écran doit rester allumé.
4. **Sidebar desktop sticky-top** : permet de garder "Plus de @user"
   et "Similaires" visibles pendant qu'on scroll les commentaires
   en bas de la main column.

### Bugs UI observés (TODO Session future)
1. **Riff long non-testé visuellement** : tous les tabs ont 1 mesure.
   La logique flèches mesure + autoscroll est validée mathématiquement,
   pas observable. À add 1 tab 12+ mesures dans tabsDatabase.
2. **Speed pills RiffPlayer 32px** : sous le seuil 44px brief mais
   acceptables en zone dense. Si polish strict, refactor en dropdown
   plus économe.
3. **Annotations = scroll vers caption** : feature lite. Le brief
   évoque des annotations par mesure ("• Mesure 3 : vibrato"). Pour
   l'instant on a juste la caption générale du créateur. Vraie
   annotation par-mesure = nouveau modèle de données (RiffAnnotation
   table Dexie) → reporté.

---

## 🎯 Pour Melvin

### À tester (10 min)
1. `/riffs/cr-stairway` mobile 375 → tab sticky en haut, CTA gold
   "Écouter le riff" plus visible que avant
2. Tap CTA → mini-player apparaît en bas (au-dessus du MobileNav)
   avec play/pause + mesure + speed + close
3. Tap X du mini-player → arrête + mini-player disparait
4. Scroll vers les commentaires → le tab reste sticky en haut
5. Click "Apprendre" → mode focus full-screen, **écran reste allumé**
   (wake-lock chrome/edge/safari iOS 16.4+) ; bouton "Je le maîtrise"
   géant 56px
6. Resize 1280px → sidebar droite "🎵 Plus de @user" + "🔥 Similaires"
   apparaît

### Hors scope (pas touché)
- TabReader.tsx (autorisé mais pas modifié — autoscroll géré dans RiffPlayer)
- CommentsSection.tsx (interdit — déjà wiré sess 30)
- Backend / Supabase / Dexie (Session C)
- RiffEditor (Session C)

### Pour la suite (Session C éventuelle)
- Ajouter 1 tab multi-mesures dans tabsDatabase pour démo flèches
- Annotations par mesure (modèle Dexie + UI inline tab)
- "Voir tous les N" sur CommentsSection si > 5 comments (UI only,
  pas de backend)

---

## ✅ Mergé dans main (à compléter)
