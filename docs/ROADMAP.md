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

## 🔴 Phase 2 — Mobile + fondations (priorité actuelle)

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
- [ ] Skin "Acoustique rosewood" (manche naturel, dots simples)
- [ ] Skin "Électrique Strat" (érable clair, dots noirs)
- [ ] Skin "Électrique LP" (palissandre foncé, trapèzes)
- [ ] Skin "Classique nylon" (manche large, cordes blanches)
- [ ] Skin "Bass" (4 cordes, frets espacées)
- [ ] Skin "Néon arty" (premium)
- [ ] Skin "Vintage gold" (premium)
- [ ] Sélecteur dans Préférences + switch live sur page Gammes
- [ ] Persistance dans prefsStore

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

### Mode live / teleprompter
- [ ] Bouton "Mode live" sur la page détail d'un morceau
- [ ] Full-screen, écran toujours actif (`screen.wakeLock`)
- [ ] Accords énormes, défilement synchronisé au tempo
- [ ] Compte-à-rebours 4 temps avant démarrage
- [ ] Bouton pause géant au tap n'importe où

### Setlists
- [ ] Modèle de données : `Setlist { id, name, songIds[], transitions }`
- [ ] CRUD setlists (page `/setlists`)
- [ ] Mode "Lecture setlist" : enchaîne les morceaux avec count-in
- [ ] Affichage transition de tonalité entre 2 morceaux
- [ ] Export PDF (chord chart classique imprimable)
- [ ] Share par URL (encode en query string)

### Audio recorder par son
- [ ] Bouton REC sur chaque song detail
- [ ] Capture micro via `MediaRecorder` API
- [ ] Stockage Blob dans IndexedDB (Dexie peut)
- [ ] Liste des essais d'un morceau (datés)
- [ ] Replay, suppression, partage (URL avec blob → option fallback Supabase plus tard)
- [ ] Indicateur "12 essais enregistrés" sur la carte song

### Bibliothèque de chord progressions
- [ ] Page `/progressions`
- [ ] 30+ progressions précodées tagguées par mood (chill / epic / jazzy / sad / latin)
- [ ] Filtre par mood + tonalité + complexité
- [ ] Transpose en 1 clic (recalcul dans toutes les keys)
- [ ] Preview audio en boucle
- [ ] Bouton "Ajouter à un son" → préremplit une section

### Speed trainer
- [ ] Sur n'importe quelle section/progression : bouton "Train speed"
- [ ] Lecture à 60% → 70% → 80% → 90% → 100% du tempo
- [ ] Validation manuelle ("c'était propre") avant de monter le palier
- [ ] Affichage de la courbe de progression sur le morceau

### Ear training mini-jeu
- [ ] Page `/ear-training` (ou modale)
- [ ] Modes : intervalles / accords (maj/min/dim/sus) / progressions (I-V-vi-IV ?)
- [ ] Scoring + streak quotidien
- [ ] Difficulty levels (beginner → expert)

### Practice plan personnalisé
- [ ] Onboarding : "ton objectif ?" (jazzy / fluide / rapide / technique / songwriting)
- [ ] Génération d'un plan 4 semaines (5-15 min/jour)
- [ ] Chaque jour : warm-up gamme + accord + technique + morceau lié
- [ ] Tracking de complétion

### Strum pattern editor avec lecture
- [ ] Grille cliquable ↓↑X·
- [ ] Subdivision 8e / 16e / triolets
- [ ] Lecture audio synchronisée avec l'accord en cours
- [ ] Patterns précodés (folk, reggae, ballad, funk strum, etc.)

---

## 🟡 Phase 4 — Polish, partage, themes

### Three.js sélectif (intégration ambient)
- [ ] Hero 3D sur la landing : guitare flottante qui tourne
- [ ] Cordes ambient vibrantes au top du Dashboard
- [ ] Toggle "Vue 3D" sur la page Gammes (manche en perspective rotatable)
- [ ] Performance : lazy-load Three.js, <200kb chunk
- [ ] **Pas** d'usage Three.js sur mobile en vue par défaut (perf)

### Thèmes UI
- [ ] Sélecteur dans Préférences
- [ ] Thèmes inclus : Dark Gold (default), Sunset (orangé), Studio Blue (Lake Placid), Pure White (mode jour répèt), Néon Synthwave (premium)
- [ ] Variables CSS dynamiques + Tailwind theme switching

### Sons de strum custom
- [ ] Choix du timbre : Karplus standard / Acoustique cordée / Nylon douce / Électrique clean / Électrique drive
- [ ] Lié au skin choisi (acoustique skin → son acoustique par défaut)
- [ ] Sons premium plus tard

### Shareable songs / setlists
- [ ] URL avec encodage base64 du JSON song (no backend)
- [ ] Page `/share/:encoded` → preview + bouton "Fork dans mon carnet"
- [ ] OG image générée pour preview WhatsApp/Discord

### Profil public guitariste
- [ ] Auth (Supabase magic link)
- [ ] Page `rifflab.app/u/:username` publique
- [ ] Best-of (morceaux maîtrisés), gammes maîtrisées, badges
- [ ] Liens vers covers audio (les essais marqués "public")

### Riff de la semaine
- [ ] Riff sélectionné chaque semaine côté admin (ou voté)
- [ ] Page dédiée, leaderboard "temps pour maîtriser"
- [ ] Notification push (mobile PWA) le lundi matin

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
