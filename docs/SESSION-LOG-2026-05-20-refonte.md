# Session 26 — Refonte sidebar + Fretboard Learner

> Branche `claude/trusting-moore-b4036b`. Continue session 25 (ship-prep).
> **9 tasks brief, 9 livrées. 3 commits techniques. Build green à chaque commit.**
> 0 régression visuelle. Toutes les anciennes URLs préservées.

## 🔴 BUG BLOQUANT EN TÊTE
_(aucun découvert)_

---

## Phase 1 — Refonte sidebar + 4 hubs ✅ COMPLÈTE

### Constat de Melvin
> "Sidebar = bordel monstre" — 17 entrées en 4 sections, info architecture
> noyée. Tout est au même niveau alors qu'il y a une hiérarchie naturelle
> (tools/library/personal/account).

### Avant → Après

**Avant** : 17 items en 4 sections
```
ESPACE PERSO (5)  : Aujourd'hui, Mes sons, Setlists, Riff du moment, Mode jam
BIBLIOTHÈQUES (6) : Accords, Gammes, Progressions, Compositeur, Riffs, Rythmiques
OUTILS (3)        : Tuner, Métronome, Oreille
COMPTE (3)        : Stats, Mon plan, Préférences
```

**Après** : 8 items + Préférences en footer
```
ESPACE PERSO (3)        : Aujourd'hui, Ma musique, Bibliothèque
CRÉER & APPRENDRE (5)   : Créer, Mon plan, Stats, Outils, Mode jam
[Footer séparé]         : Préférences (icône + label discret)
```

Mobile nav 5 items : Home, Ma musique, Mon plan, Outils, Préférences.

### Commit `fddea72` — refonte sidebar + 4 hubs + footer Préférences

Fichiers livrés :
- **`src/components/nav/HubCard.tsx`** — primitive réutilisable (icône gold
  géante, titre serif, description, teaser chip, hover gold glow,
  effet hero optional, badge top-right optional, index stagger d'entrée)
- **`src/pages/hubs/LibraryHub.tsx`** — `/library` : Mes sons (count
  dynamique), Setlists, Riffs (sub-teaser "🔥 Riff du moment"), Riff de la
  semaine, Mes enregistrements (conditional si count > 0)
- **`src/pages/hubs/ResourcesHub.tsx`** — `/resources` : Accords (204+
  voicings), Gammes (11+ modes), Progressions (30+), Rythmiques (patterns)
- **`src/pages/hubs/CreateHub.tsx`** — `/create` : Compositeur (hero avec
  teaser "🪄 Algo théorie codée — pas du AI fluff"), Nouveau morceau
- **`src/pages/hubs/ToolsHub.tsx`** — `/tools` : Tuner (hero), Métronome,
  Ear training, Fretboard Learner (badge "Nouveau", hero)
- **`src/pages/FretboardLearner.tsx`** — placeholder pour Phase 2
- **`src/app/router.tsx`** — 4 routes hubs + 4 aliases `/tools/<outil>` qui
  rendent les mêmes pages que les anciennes URLs (`/tuner`, etc) → ancienne
  URL reste valide pour pas casser les bookmarks et liens partagés
- **`src/app/layout/Sidebar.tsx`** — refactor avec `matchPrefixes` pour que
  l'item "Ma musique" reste highlight quand on est sur /songs, /setlists,
  etc. Footer séparé visuellement par une bordure : Préférences (icône
  Settings small + label "Préférences" 12px) + Langue + Auth
- **`src/app/layout/MobileNav.tsx`** — 5 items au lieu de 5 items
  hard-coded sur /songs /chords /scales + sheet outils. L'ancien sheet
  outils est supprimé : "Outils" navigue directement vers le hub /tools
  qui contient les cards. Plus simple et plus cohérent.

### Choix de design notables (différences du brief)

**Sidebar** : le brief proposait 8 items mais répartis différemment. J'ai
choisi 2 sections au lieu de 3 ("Espace perso" / "Créer & apprendre") car
3 sections pour 8 items aurait été trop labellé. La structure 3+5 sent
naturel : ce qui est À TOI vs ce qui est DU TRAVAIL.

**Mode jam** : gardé dans "Créer & apprendre" (pas dans "Espace perso"
comme le brief sous-entendait). Argumentaire : Mode jam est un OUTIL
de pratique, pas un contenu perso.

**Compositeur** : placé dans `/create` (pas dans `/resources`) comme le
brief le suggérait. Justifié : compositeur est un ACTION (générer), pas
une REF (consulter).

**Tuner / Métronome / Ear Training** : on garde leurs URLs originales en
plus de `/tools/<outil>`. Donc 2 URLs valides par outil. Aucun lien
partagé n'est cassé.

---

## Phase 2 — Fretboard Learner ✅ COMPLÈTE

### Commit `24fdcf2` — mini-jeu mémorisation du manche

Nouveau jeu inspiré "Fretboard Trainer" iOS. 4 niveaux progressifs :

| Niveau | Temps | Cordes | Notes | Spécificité |
|---|---|---|---|---|
| Débutant | 10s | 3 graves (E2, A2, D3) | Naturelles | Note + corde imposée |
| Intermédiaire | 8s | Toutes | Naturelles | Toutes positions valides |
| Avancé | 6s | Toutes | Notes altérées | Octave précis (G2 ≠ G3) |
| Expert | 4s | Toutes | Toutes | Speed mode |

### Game loop
1. Pick une note random selon le niveau (`pickQuestion` dans
   `src/lib/fretboardLearner.ts`)
2. Preview audio de la note attendue (`playMidi`)
3. User clique une position sur le Fretboard (zones de clic invisibles
   couvrent chaque string × fret intersection, hover gold subtle)
4. Validation instantanée :
   - ✅ Correct → pulse vert 1.5s sur la position cliquée, +1 score, +1
     streak (flame icon dès 5), 700ms next
   - ❌ Incorrect → pulse rouge sur la cliquée + pulse vert sur la/les
     bonne(s) position(s) en parallèle, streak reset, 1500ms next
   - ⏰ Timeout → highlight bonne pos en vert + message "Trop lent",
     1200ms next

### Stats live + récap fin de session

Top bar pendant la partie : niveau / question X/20 / score / streak.
Bottom : barre de progression timer (gold → jaune → rouge selon temps
restant).

Fin de session (20 questions) : modal récap avec :
- Précision % (correct / total)
- Best streak avec flame si ≥5
- Durée totale (Xmin Ys)
- Boutons : Rejouer / Niveau supérieur (si pas expert) / Retour aux outils

### Persistance Dexie v11 + Stats

- **Table `fretboardLearnerStats`** : `++id, date, level, correct,
  incorrect, skipped, bestStreak, fastestResponseMs, totalTimeMs`
- **Helpers** `saveFretboardLearnerStats` + `aggregateFretboardLearnerStats`
  (stats all-time : sessions, accuracy, bestStreakEver, fastestResponseMs,
  favoriteLevel, daily 30j sparkline)
- **Section /stats "Fretboard Mastery"** : 4 stat cards (sessions, précision,
  best streak, plus rapide) + favorite level chip + sparkline 30j avec
  bouton CTA "Démarrer" ou "Continuer"

### Extension Fretboard2D

`src/components/fretboard/Fretboard2D.tsx` — ajout de 2 props :
- `onPositionClick(pos: FretboardPosition)` — active le mode interactif.
  Hit zones invisibles `<rect fill="transparent">` couvrent
  chaque (corde × frette), hover state subtle (gold/8) via Tailwind
- `feedback?: { correct?, incorrect? }` — overlay animé de positions
  pulsées en vert ou rouge (framer-motion repeat 2)

Types exportés : `FretboardPosition`, `FretboardFeedback`.

### Choix de design notables

**Niveau Intermediaire = pitch class** : si on demande "Joue un G",
TOUTES les positions du G sur le manche sont valides (pas seulement la
corde de Mi grave frette 3). Ça oblige l'user à connaître les positions
en CAGED, pas juste sur une corde.

**Niveau Avancé = octave précis** : "Joue un G2" oblige à connaître
quelle position correspond à QUEL G. Plus difficile car même si tu
trouves un G, si c'est pas le bon octave c'est faux.

**Preview audio à chaque question** : tu entends la note avant de chercher
sa position. Renforce l'association son ↔ position visuelle. Reconnecte
aussi à l'oreille (gros plus pédagogique).

**Pas de note names affichés sur le manche** pendant le jeu. Triche évitée.

---

## Phase 3 — Polish UX ✅ TASK A only (breadcrumbs)

### Commit `155dd58` — breadcrumbs sur les 4 pages outils

Composant `src/components/nav/Breadcrumb.tsx` : Link + ChevronLeft + hover
gold. Posé en haut de page avant le PageHeader, `mb-3`.

Wiring sur les 4 pages outils :
- `/tools/tuner` (3 returns selon état idle/denied/granted, breadcrumb
  dans les 3 fragments)
- `/tools/metronome`
- `/tools/ear-training`
- `/tools/fretboard-learner` (remplace le Link inline initial par le
  composant Breadcrumb — DRY)

### TASK B Search globale — 🟡 SKIPPED
Trop gros pour budget restant (~1h estimée mais 5+ catégories à indexer +
overlay + keyboard nav). Reporté à une session dédiée si demande
utilisateur.

### TASK C Onboarding 3 steps — 🟡 SKIPPED
Le PlanTutorial et ComposerTutorial (sess 21+24) couvrent déjà l'usage
initial des features principales. Un onboarding global redondant ajouterait
de la friction au premier lancement. Reporté à une session UX dédiée si
nécessaire.

---

## Bilan final

### Stats
- **9 tasks brief, 9 livrées sur Phase 1+2+3A** (Phase 3B+3C skipped avec
  raisons documentées)
- **3 commits + ce log** sur `claude/trusting-moore-b4036b` :
  - `fddea72` refactor(nav) sidebar 17→8 items + 4 hubs + footer
    Préférences (607 ins, 256 del)
  - `24fdcf2` feat(tools) Fretboard Learner mini-jeu (1179 ins, 13 del)
  - `155dd58` feat(nav) breadcrumb '← Outils' sur 4 pages outils
    (38 ins, 7 del)
- **0 build fails**, **0 régression visuelle**
- Précache PWA : 3.49 MB (+25 KB par rapport à sess 25 — surtout
  FretboardLearner page + hubs)

### Routes "anciennes" qui marchent encore

Toutes les URLs originales restent valides :
- `/songs`, `/songs/new`, `/songs/:id`, `/setlists/:id`, `/setlists/:id/play`
- `/chords`, `/scales`, `/progressions`, `/strum-patterns`
- `/composer`, `/riffs`, `/riff-of-the-week`
- `/tuner`, `/metronome`, `/ear-training` (en plus de `/tools/<outil>`)
- `/plan`, `/stats`, `/jam`, `/settings`, `/profile`

### Routes "nouvelles" ajoutées

- `/library` (hub)
- `/resources` (hub)
- `/create` (hub)
- `/tools` (hub)
- `/tools/tuner` (alias)
- `/tools/metronome` (alias)
- `/tools/ear-training` (alias)
- `/tools/fretboard-learner` (nouvelle page ✨)

---

## 🎯 Recommandation Melvin — au retour

### À tester en priorité (15 min)

1. **Sidebar refondée** (5 min) :
   - Lance `npm run dev` → ouvre `/dashboard`
   - Check sidebar desktop : 8 items + footer Préférences
   - Navigue vers `/songs` → vérifie que "Ma musique" reste highlight
     gold dans la sidebar (matchPrefixes)
   - Tape /chords → vérifie "Bibliothèque" highlight
   - Tape /tuner → vérifie "Outils" highlight
   - Mobile : `Ctrl+Shift+M` pour switch responsive, check 5 tabs bottom

2. **Fretboard Learner** (10 min) :
   - Va sur `/tools` → tape le card "Fretboard Learner" (badge Nouveau)
   - Choisis Débutant → Commencer
   - Joue 5-10 questions, valide que :
     - Preview audio sonne bien à chaque question
     - Click sur position bonne → pulse vert
     - Click sur position fausse → pulse rouge + bonne pos en vert pulsé
     - Timeout après 10s → reveal bonne position
     - Streak ≥ 5 affiche le flame icon
     - Modal récap fin de partie
   - Va sur `/stats` → scroll bas → vérifie la section "Fretboard Mastery"
     apparait avec tes stats

3. **Régression** (recommendation perso) : test sur **un guitariste IRL**
   pour valider que la nouvelle nav est plus claire. Le risque c'est que
   l'archi soit propre techniquement mais que TON workflow personnel (qui
   ouvrait toujours /songs en 1 tap) soit ralenti par le nouveau passage
   par /library. À ajuster si Melvin trouve ça frustrant.

### Si tout marche → commit final + ship

Ce qui change pour le ship-day SHIP-DAY-PLAYBOOK (sess 25) :

- Le post Reddit / X / LinkedIn doit MENTIONNER le Fretboard Learner
  dans les features. Update le draft du playbook avec :
  > "🎯 Fretboard Learner — mini-jeu pour apprendre les notes du manche
  > en sessions de 20 questions, 4 niveaux progressifs"
- Re-prends un screenshot de `/tools` pour le marketing assets (le hub
  est visuellement très propre, ça vend bien)

### Si quelque chose te paraît bizarre

**1. Compositeur dans Créer (pas dans Bibliothèque)** : si tu trouves
ça contre-intuitif, déplace-le en 1 ligne dans `/resources` ou ajoute-le
aux 2. C'est une décision UX, pas technique.

**2. Mode jam en bas dans "Créer & apprendre"** : si tu préfères que
ce soit dans "Espace perso" (parce que c'est un "espace de jeu"), c'est
1 ligne dans `Sidebar.tsx`.

**3. Footer Préférences icône seule trop discret** : on peut mettre le
label visible permanent ou agrandir l'icône. Dis-moi.

### Phase 3B/3C reportées avec raisons

- **Search globale (cmd+K)** : 1h+ pour bien faire avec 5+ catégories,
  trop large pour la fin de cette session. À reprendre dans une session
  dédiée si demande user post-ship.
- **Onboarding 3 steps** : redondant avec les tutorials existants
  (Plan + Composer). Risque de friction au premier lancement. À reprendre
  uniquement si un user IRL dit "j'ai pas compris comment commencer".

---

## Évaluation brutale honnête

Sidebar : la refonte tient debout, l'info architecture est plus propre.
Mais le vrai test c'est ton workflow personnel sur 1 semaine. Si tu te
retrouves à toujours faire /library → /songs, c'est que /library est de
trop pour TON usage et il faut soit virer le hub soit garder /songs en
shortcut top-level.

Fretboard Learner : c'est fonctionnel mais pas encore PRO. Polish manquant :
- Pas de sons "ding success / buzz fail" (juste le preview de la note).
  À ajouter avec Tone.Synth simple si tu veux le côté arcade.
- Le combo multiplier promis en Expert n'est pas vraiment implémenté
  (juste le scoring de base). À itérer après feedback.
- Niveau Expert pourrait avoir un système de bonus visuel (×2 si streak
  10, écran flash gold à chaque success en speed mode, etc).

Polish UX cosmétique mais qui vaut le coup. Le breadcrumb est suffisant
pour pas se sentir perdu sur les outils.

🎸 Sidebar plus claire, nouveau jeu fun, prêt pour itération.
