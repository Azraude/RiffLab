# 🎸 RiffLab — Roadmap v2

> Source de vérité pour les phases à venir. Phase 1 (MVP) est livrée.
> Cette roadmap intègre toutes les features brainstormées en session.

---

## ✅ Phase 1 — MVP utilisable (DONE)

- Setup Vite + React + TS + Tailwind + routing
- Design system noir/or/blanc
- Layout responsive desktop + mobile bottom nav
- CRUD songs (Dexie IndexedDB)
- Formulaire d'ajout avec sections + accords
- 43 accords précodés, ChordDiagram SVG
- 11 gammes, Fretboard2D
- Audio Tone.js (6 PluckSynth + reverb)
- Préférences persistées (Zustand)
- Seed DB avec 3 morceaux d'exemple

---

## ✅ Phase 2 — Mobile + fondations (livrée)

### Mobile-first audit (BLOQUANT)
- [ ] Audit complet 375-768px de toutes les pages
- [ ] Bottom nav optimisée, tap targets ≥ 44px
- [ ] Pas de scroll horizontal
- [ ] Formulaire SongNew utilisable au pouce

### Redesign du manche
- [ ] Nouveau Fretboard2D premium (textures wood, frets brillantes, inlays nacre)
- [ ] OU passage à un Fretboard 3D léger en composant (Three.js intégré, pas full screen)
- [ ] Mockups des 2 directions à valider avant code

### Skins de manche
- [x] Skin "Acoustique rosewood" (manche naturel, dots simples)
- [x] Skin "Électrique Strat" (érable clair, dots noirs)
- [x] Skin "Électrique LP" (palissandre foncé, trapèzes) — session 15
- [x] Skin "Classique nylon" (manche large, cordes blanches) — session 15
- [ ] Skin "Bass" (4 cordes, frets espacées) — reporté
- [x] Skin "Néon arty" (premium) — session 15
- [x] Skin "Vintage gold" (premium) — session 15
- [x] Sélecteur dans Préférences + switch live sur page Gammes
- [x] Persistance dans prefsStore

### Outils essentiels (manquants vs Ultimate Guitar)
- [ ] **Tuner intégré** : micro phone/laptop, FFT, indicateur visuel précis, choix de l'accordage (lire prefs)
- [ ] **Métronome dans l'UI** : déjà codé dans `audio.ts`, juste à brancher. Slider BPM 40-220, accent sur le 1, LED visuelle, mode silent (vibration sur mobile)
- [ ] **Capo intelligent** : sur une chanson, bouton "Suggérer un capo" qui analyse les accords et propose la meilleure position pour les jouer dans une forme familière

### Stats & streak
- [ ] Tracker de pratique quotidienne (chord/scale du jour validé)
- [ ] Composant streak fonctionnel (12 jours d'affilée, etc.)
- [ ] Page Stats : accords les plus joués, gammes les plus travaillées, temps total, courbe 30j

---

## 🟠 Phase 3 — Performance & pratique

> **Recadrage** : le Mode Lecture (teleprompter lyrics + chords) est
> reporté en **Phase 3.5** car il dépend du mapping chord-on-syllable
> qui ouvre une complexité importante (cf. section dédiée plus bas).
> Phase 3 actuelle = practice tracking + library + outils de travail.

### Ordre de bataille Phase 3 (session actuelle)

#### 1. PracticeSession + Stats + Streak (closeout Phase 2G)
- [ ] DailyCard du Dashboard : bouton **"J'ai pratiqué aujourd'hui ✓"**
- [ ] Click → écrit `PracticeSession {date, chord: dailyChord, scale, completed:true}`
- [ ] État bouton : "Pas encore fait" → "Fait ✓ aujourd'hui" (or)
- [ ] `<StreakDisplay />` remplace le `—` placeholder, calcule streak depuis les sessions Dexie
- [ ] Indicateurs des 7 derniers jours (cercles L M M J V S D allumés/éteints)
- [ ] Page `/stats` accessible depuis le gear menu :
  - Compteur "Total sessions"
  - Top 5 accords les plus joués (count distinct dans sessions)
  - Top 5 gammes les plus travaillées
  - Courbe pratique 30j (SVG simple, 1 point par jour)

#### 2. Setlists
- [ ] Modèle Dexie `Setlist { id, name, songIds[], createdAt, updatedAt }`
- [ ] Seed avec 1 démo "Répèt du jeudi" contenant les 3 songs du seed
- [ ] Page `/setlists` : liste avec CRUD (mêmes patterns que Songs)
- [ ] Page `/setlists/:id` : détail, songs ordonnables (up/down arrows ou DnD)
- [ ] Mode "Lecture setlist" : enchaîne en mode SongDetail avec compteur "Song 2/4 → Suivant : Sweet Child"
- [ ] Share : URL avec base64 du JSON setlist
- [ ] Export PDF (chord chart classique imprimable) — plus tard

#### 3. Audio recorder par song
- [ ] Nouvelle table Dexie `recordings : { id, songId, blob, durationMs, name?, createdAt }`
- [ ] Section "Mes enregistrements" sur SongDetail
- [ ] Bouton REC géant rond rouge pulsant pendant capture
- [ ] `MediaRecorder` API → blob
- [ ] Liste : date + durée + play/delete/share buttons
- [ ] Player inline avec waveform simple (`AnalyserNode` SVG)
- [ ] Indicateur "🎙 12 essais" en footer de SongCard sur `/songs`

#### 4. Bibliothèque de chord progressions
- [ ] Page `/progressions`
- [ ] 30+ progressions précodées dans `src/lib/progressionDatabase.ts` (I-V-vi-IV, ii-V-I jazz, vi-IV-I-V emo, I-IV-V blues, Andalousian Am-G-F-E, Canon de Pachelbel, etc.)
- [ ] Tagged par mood (chill / epic / jazzy / sad / latin / cinematic)
- [ ] Filtre par mood + tonalité + difficulté
- [ ] Transpose 1-clic (recalcule pour toutes les keys)
- [ ] Preview audio loop (strum chaque chord 1 mesure, répète)
- [ ] Bouton "Ajouter à un song" → préremplit une section

### Reste de Phase 3 (session suivante)

#### Speed trainer
- [ ] Sur n'importe quelle section/progression : bouton "Train speed"
- [ ] Lecture à 60% → 70% → 80% → 90% → 100% du tempo
- [ ] Validation manuelle ("c'était propre") avant de monter le palier
- [ ] Affichage de la courbe de progression sur le morceau

#### Ear training mini-jeu
- [ ] Page `/ear-training` (ou modale)
- [ ] Modes : intervalles / accords (maj/min/dim/sus) / progressions (I-V-vi-IV ?)
- [ ] Scoring + streak quotidien
- [ ] Difficulty levels (beginner → expert)

#### Practice plan personnalisé
> **Status (mai 2026, session 15)** : page `/plan` migrée en Duolingo
> zigzag path (10 niveaux). Path SVG + drawer détail + tracking Dexie
> live. La génération auto par AI (onboarding 3 questions, plan 4
> semaines) reste dormante (code dans `src/lib/practicePlan.ts` + state
> Zustand `practicePlan`).
- [x] Page `/plan` avec path Duolingo zigzag 10 niveaux
- [x] States locked/available/current/completed + drawer détail
- [x] Tracking complétion Dexie (`practiceProgress` table v4)
- [ ] Décision : on garde le code de génération auto dormant ou on
  le retire ? (le path actuel suffit pour le MVP)

#### Strum pattern editor avec lecture
- [ ] Grille cliquable ↓↑X·
- [ ] Subdivision 8e / 16e / triolets
- [ ] Lecture audio synchronisée avec l'accord en cours
- [ ] Patterns précodés (folk, reggae, ballad, funk strum, etc.)

---

## 🎤 Phase 3.5 — Mode Lecture / teleprompter (décalé)

> **Pourquoi décalé après Phase 3** : le mapping chord↔syllabe ouvre
> une complexité non triviale. Plutôt que de bricoler maintenant, on
> creuse soit indépendamment soit conjointement avec l'AI helper de
> Phase 5 qui peut résoudre l'alignement automatiquement.

### Périmètre fonctionnel
- Bouton "Mode live" sur la page détail d'un morceau
- Full-screen, écran toujours actif (`screen.wakeLock`)
- Accords énormes, défilement synchronisé au tempo
- Compte-à-rebours 4 temps avant démarrage
- Bouton pause géant au tap n'importe où

### Open question : mapping chord-on-syllable

Trois pistes envisagées, **à trancher avant l'implémentation** :

1. **Mapping manuel** dans le formulaire de song : l'utilisateur tape
   les lyrics et insère des `[ChordName]` directement à la position
   voulue (style Ultimate Guitar). Pas d'inférence, l'user est en
   contrôle total.
   - ➕ Précis, prédictible, déjà familier aux guitaristes
   - ➖ UX d'édition lourde sur mobile (tap-pos-tap-pos…)

2. **AI assist (Phase 5)** : l'utilisateur tape les lyrics + liste les
   accords + tempo, l'AI propose l'alignement le plus probable basé
   sur le rythme prosodique du français/anglais.
   - ➕ UX zéro friction
   - ➖ Demande l'infra AI (Phase 5), peut se tromper

3. **Time-based estimation** : chaque ChordRef a `beats: n`, on compute
   le temps total de chaque section, on répartit les syllabes
   linéairement sur cette durée. Pas de mapping explicite.
   - ➕ Aucun input user supplémentaire, marche dès aujourd'hui
   - ➖ Approximation grossière, les accords ne tombent jamais
     pile sur la bonne syllabe

→ Reco probable : option 3 en MVP Phase 3.5 (avec marge d'erreur
acceptable parce que l'user joue, il s'adapte), option 2 en
amélioration Phase 5+ pour ceux qui veulent du précis.

---

## ✅ Phase 4 — Polish, partage, themes (livrée session 15)

### Three.js sélectif (intégration ambient)
- [x] Hero 3D sur la landing : scène studio GLB (studio-scene.glb, à compresser)
- [x] FloatingGuitar3D réutilisable (rose/classic) intégré Dashboard + Jam + Plan
- [x] FloatingAmp3D décoratif sur Métronome
- [x] Toggle "Vue 3D" sur la page Gammes (Fretboard3D off par défaut)
- [x] Performance : lazy-load Three.js, ~258 KB gzip total (légèrement
  au-dessus de la cible 200 KB à cause de drei — acceptable car lazy)
- [x] **Pas** d'usage Three.js sur mobile en vue par défaut (gate
  matchMedia + low-end deviceMemory / hardwareConcurrency detection)
- [x] Toggle "Effets 3D" dans Préférences (default ON, OFF auto sur low-end)

### Thèmes UI
- [x] Sélecteur dans Préférences
- [x] Thèmes inclus : Dark Gold (default), Sunset, Studio Blue, Pure White, Néon Synthwave (premium)
- [x] Variables CSS dynamiques + Tailwind theme switching (RGB triplets + rgb(var(--xxx) / <alpha-value>))

### Sons de strum custom
- [x] Choix du timbre : Pluck clair / Acoustique steel / Nylon douce / Électrique clean (recommended) / Électrique drive
- [x] Recettes refondues session 15 (PluckSynth pur sonnait mauvais → FMSynth pour acoustic, triangle pour nylon, filter chain pour drive)
- [x] Polish session 16 : Compressor master + LP 8kHz + releases courts
- [x] Recipe Tone.Sampler "Électrique réelle 🎸" session 17 (infra prête, samples mp3 à dropper par Melvin dans `public/audio/electric-guitar/` — workflow dans le README)
- [ ] Lié au skin choisi (acoustique skin → son acoustique par défaut) — reporté
- [ ] Sons premium (autres timbres samplés) — Phase 5

### Shareable songs / setlists
- [x] URL avec encodage base64url du JSON song (no backend)
- [x] Page `/share/:encoded` → preview + bouton "Fork dans mon carnet"
- [ ] OG image générée pour preview WhatsApp/Discord — reporté

### Profil public guitariste
- [ ] Auth (Supabase magic link) — Phase 5 (besoin d'auth)
- [ ] Page `rifflab.app/u/:username` publique
- [ ] Best-of (morceaux maîtrisés), gammes maîtrisées, badges
- [ ] Liens vers covers audio (les essais marqués "public")

### Riff de la semaine + Community Hub
- [x] 20 riffs curés rotatifs basés sur le numéro ISO de la semaine
- [x] Page `/riff-of-the-week` + Dashboard teaser + countdown lundi
- [x] Widget Dashboard refait community-style (session 16) : tab + contributor + like + share modal
- [x] TabReader SVG + TabPlayer Tone.js
- [x] 10 tabs précodés (Smoke / Iron / Seven Nation / Sunshine / Stairway / Sweet Child / Back in Black / Day Tripper / Crazy Train / Money for Nothing)
- [x] Page `/riffs` community hub session 17 : filtres difficulté/tags/sort, featured banner, drawer detail, bookmarks + ratings Dexie v6
- [ ] Notification push (mobile PWA) le lundi matin — Phase 5 (PWA)
- [ ] Vrai upload communautaire — Phase 5 (auth + backend)
- [ ] Modal "Ajouter mon riff" avec TabEditor cliquable — Phase 5

### Mode Jam (livré en Phase 4 session 15)
- [x] Page `/jam` avec génération auto progression dans key/mode/mood
- [x] Drums + bass + chord strum synchronisés via Tone.Transport
- [x] 9 patterns rythmiques par Mood (rock, pop, chill, sad, jazzy, latin, epic, cinematic)
- [x] Mute toggles Drums/Bass/Chords en temps réel
- [x] Fretboard avec gamme highlight pour improviser
- [x] BPM slider 60-180

### Animations premium (session 15)
- [x] Page transitions (AnimatePresence + fade + slide 8px)
- [x] TiltCard 3D hover (Songs / Chords / Scales)
- [x] Button whileTap scale 0.97
- [x] Hero text reveal letter-stagger
- [x] ChordDiagram stagger dots
- [x] Fretboard2D scale notes stagger
- [x] Daily card animated gold sheen
- [x] Streak cell pop (scale + glow pulse)
- [x] Skeleton shimmer pour loading states

---

## 🟢 Phase 5 — AI & monétisation

### AI features
- [ ] **Génération de progressions** : "donne-moi du jazzy en Em" → 3 options
- [ ] **Auto-complete song** : tu rentres le couplet, AI propose un refrain
- [ ] **Composer assistant** : description en français → progression + structure
- [ ] **Theory hints** : explication harmonique de pourquoi une progression marche

### Monétisation
- [ ] Auth Supabase (magic link + Google)
- [ ] Tier Free (10 sons, ear training basique, pas d'AI) vs Pro (illimité, AI, backing tracks, cloud sync, export PDF)
- [ ] Stripe checkout : 4,99€/mois ou 39€/an
- [ ] Sync cloud songs + setlists + recordings

### Cosmetics shop
- [ ] Page `/shop` avec skins premium, thèmes, sons exotiques
- [ ] Stripe one-time purchases (2-5€ par item, packs à 10€)
- [ ] Persistance via auth

### AI credits
- [ ] Free : 5 générations/mois
- [ ] Pro : 100/mois
- [ ] Top-up à l'unité possible

---

## 🚀 Phase 6 — L'extension Chrome (le hack viral)

### Extension RiffLab pour Chrome
- [ ] Manifest V3, content script sur YouTube
- [ ] Bouton flottant "📥 Capturer dans RiffLab" sur les vidéos
- [ ] Backend : tentative de match avec base de morceaux connue (AI Claude/GPT recherche les accords du morceau)
- [ ] Phase B : capture de l'audio + analyse FFT côté backend pour détection d'accords (Chordify API ou Klangio API ou modèle maison)
- [ ] Push vers le compte RiffLab via deeplink
- [ ] Lecture sync : la vidéo YouTube embedded dans RiffLab avec timeline d'accords

### Détection d'accords depuis mp3 / SoundCloud
- [ ] Upload de fichier dans l'app
- [ ] Même pipeline backend
- [ ] Résultats éditables (l'AI se trompe parfois)

---

## 🌠 Phase 7+ — Moonshots

### Marketplace de setlists / leçons
- [ ] Un user peut publier une setlist payante (5-10€)
- [ ] Commission RiffLab 30%
- [ ] Profs peuvent vendre des leçons (PDF + audio + chord chart)

### Mode AR (Augmented Reality)
- [ ] Caméra phone montée au-dessus du manche
- [ ] Détection du manche en temps réel (MediaPipe / WebXR)
- [ ] Overlay des positions de notes/accords directement sur la vidéo
- [ ] Mode "follow scale" : les notes s'allument en suivant ce que tu joues

### Idées à creuser
- Voice command ("ajoute Hotel California en ré mineur capo 7")
- Backing band IA avec drums + bass + claviers qui réagit au tempo
- Festival mode (line-up festival → setlist auto)
- Comparaison avec l'original (analyse timing/justesse)
- Apple Watch / Wear OS app (chord du jour, marquer fait)
- Pédale Bluetooth (next page hands-free pendant que tu joues)
- Plugin DAW Reaper / Logic

---

## 📊 Critères de priorisation

À chaque feature, on évalue :
- **Impact** : différentie vs concurrents ? résout un pain ?
- **Effort** : combien de temps pour shipper ?
- **Sticky** : ramène l'user le lendemain ?
- **Viral** : génère du partage organique ?
- **Monétisable** : enable du revenue direct ou freemium upsell ?

Focus actuel : **Phase 2 mobile-first + manche + outils essentiels**.

---

*Roadmap v2.0 — collaborée Cowork. Mise à jour à chaque session de brainstorm.*
