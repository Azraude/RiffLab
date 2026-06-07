# 🔍 AUDIT SESSION 23 — État complet RiffLab (2026-05-18)

> Audit honnête écrit pour Melvin avant la suite. Pas du léchage, pas de
> survente. État réel + recommandation directe.
> Branche `claude/trusting-moore-b4036b`, **31 commits ahead de origin/main**,
> tous pushés sur origin claude/trusting-moore-b4036b. **Pas mergé sur main**.

---

## 1. ÉTAT DES PHASES

### ✅ Phase 1 — MVP utilisable
**Status** : livré + dépassé. Tout le scope original (CRUD songs, accords, gammes, audio Tone.js, prefs) tourne en prod local sans bug.

### ✅ Phase 2 — Mobile + fondations
**Status** : livré. Mobile-first audit fait, fretboard SVG premium 7 skins, tuner FFT, métronome UI, capo intelligent avec one-liner summary (sess 21), streak+stats.

### ✅ Phase 3 — Performance & pratique
**Status** : livré + closeout fait. PracticeSession + stats + streak, Setlists CRUD + lecture enchaînée, Recorder waveform + loop pedal flag (sess 20), 30+ progressions library, **Speed trainer + Ear training + Practice Plan Duolingo livrés**, strum pattern editor (page `/strum-patterns` + mini-editor in-form sess 20). **Mini-quiz fin de niveau ajouté sess 23** avec badge ⭐ + Dexie v10.

### ⏳ Phase 3.5 — Mode Lecture teleprompter
**Status** : 70 % fait sur branche `feature/teleprompter` (sess 20 nuit). Pas mergé. Architecture en place : `src/pages/Teleprompter.tsx` + parser inline UG-style `[Am]today` + screen.wakeLock + auto-scroll par section au tempo. **Limite** : pas de mapping fin chord/syllabe sans `[Chord]` inline — pile la question ouverte du brief original. Le scroll est atomique par section, pas continu.

### ✅ Phase 4 — Polish, partage, themes
**Status** : livré. Three.js sélectif (hero studio + ampli + guitares Dashboard/Plan + toggle 3D Gammes), 5 thèmes UI (Dark Gold + Sunset + Studio Blue + Pure White + Néon), 5 sons strum custom + **6 presets WebAudioFont GM** (sess 21 pivot — c'est mieux que les amp chains JS de sess 20), shareable songs/setlists base64, riff de la semaine + community hub. **Profil public guitariste** = bloqué sur auth Phase 5 ; placeholder `/profile` ajouté sess 22.

### ✅ Phase 4.5 — Infrastructure & import
**Status** : livré sess 19. PWA hors-ligne Workbox + manifest + cache strategies, tab importer (paste text), waveform recorder interactive.

### 🟠 Phase 5 — AI & monétisation
**Status** : **5.1 Auth Supabase livrée sess 22** (`b0b5919` + `e3de187` fix modal centré). Supabase client + AuthStore Zustand + LoginModal (magic link + Google OAuth) + AuthMenu sidebar + page `/profile` placeholder. Dexie reste source de vérité côté client.
**Reste à faire** :
- 🟠 **5.2 Sync Dexie ↔ Postgres bidirectionnel** (pas démarré) — c'est le gros morceau qui débloque tout le cloud
- ⏳ **5.3 Profil public** (bloqué sur 5.2) — route `/u/:username` + avatar upload Supabase Storage
- ⏳ **5.4 Stripe Pro tier** (~3h init + webhook + tier gating UI)
- ⏳ **AI features** (génération progressions, theory hints, composer assistant — ~1 jour)
- ⏳ **Cosmetics shop** (skins/thèmes premium gating via tier)

### ⏳ Phase 6 — Extension Chrome
**Status** : 0 %. Manifest V3 + content script YouTube + bouton "Capturer dans RiffLab" + détection accords backend. **Estimation** : 2-3 jours dev + backend séparé. Reporté tant que Phase 5 cloud sync pas faite (le bouton "capturer" doit pouvoir push vers le compte cloud).

### ⏳ Phase 7+ — Moonshots
**Status** : 0 %. Marketplace, AR camera fretboard, voice command, Apple Watch, Bluetooth pedal. Idéation only.

### 🆕 Bonus livrés hors roadmap
- **Composer page `/composer`** (sess 22 mini-session) — générateur de progressions avec théorie, evaluateChordFit, ChordPicker drawer. Pas dans la ROADMAP originale.
- **Daily Challenge** (sess 20) — card Dashboard avec tab pickée déterministe par date.
- **Keyboard shortcuts globaux** + cheatsheet `?` (sess 20).
- **i18n FR/EN setup** (sess 21) — react-i18next, sidebar 100% migrée, Dashboard hero migré. Le reste FR hardcoded.
- **Tutorial overlays** Dashboard (5 steps) + Plan (5 steps).

---

## 2. ROADMAP RESTANTE — où on en est

| Phase | Status | Reste exact | Effort estimé |
|---|---|---|---|
| 1 MVP | ✅ done | — | — |
| 2 Mobile + fondations | ✅ done | — | — |
| 3 Pratique | ✅ done | — | — |
| 3.5 Teleprompter | 🟠 70% sur branche separate | Merge sur main + résolution mapping chord/syllabe | 4h |
| 4 Polish | ✅ done | — | — |
| 4.5 PWA | ✅ done | — | — |
| 5.1 Auth | ✅ done sess 22 | Test e2e Google OAuth + Vercel env vars | 30min |
| **5.2 Sync cloud** | ⏳ 0% | push à login + fetch à reload + conflict resolution updated_at + offline queue | **6-8h** |
| 5.3 Profil public | ⏳ bloqué 5.2 | avatar upload + page /u/:username + stats publiques | 3h |
| 5.4 Stripe Pro | ⏳ 0% | Stripe init + webhook + tier gating UI | 4h |
| 5 AI | ⏳ 0% | Claude API integration + UI prompts + credits tracking | 1 jour |
| 5 Shop cosmetics | ⏳ 0% | Stripe one-time + Premium skins gating | 2h |
| 6 Chrome ext | ⏳ 0% | Manifest V3 + content script + backend matching | 2-3 jours |
| 7+ Moonshots | ⏳ idéation | AR, marketplace, voice, watch, pedal | semaines/mois |

---

## 3. 5 TÂCHES PRIORITAIRES pour v1 SHIPABLE

> Définition v1 shipable : "je peux partager à 100 guitaristes sans honte, ils s'inscrivent, leur data persiste, je peux monétiser plus tard."

Triées par **impact × urgence / effort** :

### 1. ✅ ⚠️ **Tester end-to-end le flow auth Supabase** (30 min)
- Tester magic link reçu + click + dashboard loggé en local
- Tester Google OAuth (configure dans Supabase dashboard + Google Cloud — sess 22 a documenté les 3 étapes nécessaires)
- Ajouter env vars dans Vercel dashboard pour Production+Preview+Development
- Vérifier que `/profile` ne crash pas sans Supabase configuré (gating `isSupabaseConfigured`)
- **Impact** : sans ça l'auth est théorique. Bloque le reste de la Phase 5.

### 2. 🔴 **Compression .glb modèles** (45 min, TECH-DEBT critique)
- `studio-scene.glb` 110 MB → < 5 MB via gltf.report (Draco + WebP)
- `guitar-fender-rose.glb` 22 MB → < 2 MB
- `amp.glb` 8.5 MB → < 1.5 MB
- **Impact** : un user en 4G attend ~2 min pour la landing. Tueur de conversion absolu. Aucune feature ne compense ce délai.
- **Effort** : 5 min de manip externe par fichier. Trivial.

### 3. 🟠 **Sync Dexie ↔ Postgres minimale (Phase 5.2)** (6-8h)
- Sur login : fetch toutes les tables Supabase pour ce user, merge avec Dexie (Postgres wins si updated_at plus récent)
- Sur saveSong/saveSetlist/logSession/etc : push aussi vers Postgres si user loggé (fire-and-forget)
- Pas de queue offline complexe — version naïve "next write réessaie" suffit pour v1
- **Impact** : un user qui change de device ne perd plus ses sons. Argument vendeur Pro = "your data follows you everywhere".

### 4. 🟠 **Polish quiz UX + retake si raté** (1h)
- Le mini-quiz actuel (sess 23) save 1 résultat par node (upsert). Si user rate 1/3 puis retente 3/3, le badge ⭐ apparaît bien. Mais l'UX "Pas mal !" est sec.
- Ajouter : "Tu peux retenter le quiz quand tu veux pour décrocher le badge ⭐" + bouton "Retenter maintenant" sur le screen final
- Skip questions ratées dans la prochaine génération (template variety bonus)
- **Impact** : sticky x2. Les users compétitifs viennent re-tenter pour avoir tous les ⭐ d'affilée.

### 5. 🟢 **OG image PNG 1200×630** (30 min)
- Convertir `public/og-image.svg` en PNG via script offscreen canvas OU Figma export OU script Node `sharp`
- Twitter / Discord rendent mal les SVG OG → preview cassé pour 80% des shares
- **Impact** : conversion landing depuis WhatsApp/Discord. Un share = un install potentiel. Sans bonne preview, le share est moins viral.

---

## 4. TECH DEBT (état réel)

| Debt | Sévérité | Effort | Action |
|---|---|---|---|
| **Modèles .glb non compressés** (110 MB studio-scene, 22 MB rose, 8.5 MB amp) | 🔴 CRITIQUE | 45 min total | gltf.report Draco+WebP, voir TECH-DEBT.md |
| **Audio Neural-quality / IR cabinets réels** | 🟡 nice-to-have | 2h + IR files | Le WebAudioFont GM (sess 21) suffit pour v1 — sonne crédible. Upgrade Phase 5+ si Pro tier le justifie |
| **Mode Lecture teleprompter (Phase 3.5)** | 🟠 important | 4h + décision mapping | Sur branche `feature/teleprompter`, à merger après décision option A/B/C |
| **i18n traductions incomplètes** | 🟡 nice-to-have | 4h | Nav full migré, Dashboard hero migré. Songs/Chords/Scales/Stats/Tuner/etc encore FR hardcoded. Bloque l'audience EN |
| **SetlistDetail loading vs not-found** | 🟡 cosmétique | 15 min | Affiche "Setlist introuvable" pendant le load Dexie initial. Fix avec local state + useEffect |
| **OG image SVG → PNG** | 🟠 important | 30 min | Twitter/Discord rendent mal le SVG, preview cassé pour ces plateformes |
| **Vercel env vars Supabase** | 🔴 prod bloquant | 5 min | À setup dans Vercel dashboard avant que `VITE_SUPABASE_*` marche en prod |
| **Worktree vs main branch confusion** | 🟡 dev workflow | — | Le user a un Vite qui peut tourner depuis le main repo (sans les commits récents) au lieu du worktree. Doc dans CLAUDE.md à ajouter |

---

## 5. RECOMMANDATION PERSO

**Ordre que JE recommande** (5-10 lignes, honnête) :

1. **D'abord, valide l'auth Supabase end-to-end et compresse les .glb.** Ces deux trucs sont les seuls bloquants pour montrer RiffLab à quelqu'un publiquement. L'un sans l'autre = honte (lent ou pas de persistance).

2. **Ensuite, Phase 5.2 sync cloud naïve.** Pas la version parfaite avec queue offline, juste "push fire-and-forget + fetch au login + merge updated_at". Tu peux la livrer en 6-8h. Sans elle, ton auth est cosmétique.

3. **Skip Stripe pour l'instant.** Avant de monétiser, faut prouver que les gens reviennent. Compte les retours sur 30 jours avec 100 users gratuits d'abord. Sinon tu codes un funnel Pro pour 0 utilisateur.

4. **Skip l'AI features pour l'instant.** Le Composer (sess 22) couvre 70% du besoin "génère-moi une progression qui sonne bien" sans coût API. L'AI ouvre une complexité (credits, rate limits, faillure modes) qui bouffe ton temps pour un gain marginal vs ce qui existe déjà.

5. **Investis dans Chrome ext (Phase 6) APRÈS sync cloud.** C'est ton hack viral. "RiffLab capture les accords d'une vidéo YouTube et te les sert dans une UI propre" = différenciateur fort vs Ultimate Guitar. Mais sans sync cloud, le bouton "Capturer" ne peut rien push.

**Ce que tu NE dois PAS faire ce mois-ci** : moonshots Phase 7 (AR, marketplace, voice command). Trop tôt. Tu vas y perdre 2 semaines pour zéro signal utilisateur.

**Mon avis brutal** : t'as une app **complète et polie** que personne n'utilise encore. Le levier #1 maintenant c'est **0→100 users**, pas +1 feature. Compresse les .glb, finalise sync cloud, partage sur 5 communautés guitaristes (Reddit r/guitar, Discord MMP/CmajorPlay, Twitter), regarde ce qui plante en 1ère semaine, itère sur ces feedbacks réels.
