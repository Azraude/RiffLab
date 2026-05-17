# RÉCAP 2-MIN MELVIN — Session 21 (2026-05-17)

## ✅ Fait sur claude/trusting-moore-b4036b (5 commits + recovery pushé)

- **TASK 1** — `6dc5e3a` — **Audio refonte WebAudioFont** : STOP simulation ampli JS, passage aux samples GM FluidR3 via CDN jsdelivr. 6 presets : acoustic-nylon (240), acoustic-steel (250), electric-jazz (260), electric-clean (270 DEFAULT), electric-overdrive (290), electric-distortion (300). `src/lib/webAudioFont.ts` script loader idempotent + singleton player + cache. `src/lib/strumSounds.ts` registry WAF_PRESETS + PRESET_FX (reverb / LP / velocity / duration). `src/lib/audio.ts` réécrit pour orchestrer WAF. Suppression `src/lib/ampChain.ts` (~14KB dead code retiré). Migration prefs v8 → v9 via `migrateLegacyStrumId`. Vérifié en preview : 0 erreur init + rebuildVoices 5 presets enchaînés OK + tous les `_tone_<NNNN>_FluidR3_GM_sf2_file` globals chargés.
- **TASK 2** — `d15e137` — **Bouton "Refaire le tuto"** dans Settings : nouvelle Card "Tutoriel" avec 2 boutons ("Refaire le tuto" reset planTutorialCompleted, "Refaire onboarding + tuto" reset les 2). Navigate /dashboard → tutorial relance auto.
- **TASK 3** — `28bc778` — **Tuto Plan au premier click** : refactor Tutorial.tsx → primitive réutilisable `TutorialOverlay`. Nouveau `PlanTutorial.tsx` avec 5 steps (progress bar → path → node actif → drawer chips → outro). Nouveau champ `prefs.planTutorialSeen` (default false ; migrate v9 = true pour users existants). `data-tutorial-id` ajoutés : plan-progress-bar / plan-path / plan-node-active (sur le node current OU available) / plan-drawer-chips. Trigger 400ms après click pour laisser le drawer s'ouvrir.
- **TASK 4** — `e5cc106` — **Refonte Riffs en feed social Instagram-style** : Page /riffs réécrite — sort tabs sticky (Pour toi algo / Trending / Récents), tag chips scrollables (#rock #blues...), feed vertical max-w-2xl, RiffFeedCard par post (Avatar initial + @contributor + relative date "2h/hier/il y a X" + caption + tags + TabReader inline compact + actions row Heart/Comment/Bookmark/Share natif). 10 riffs seed enrichis avec captions variées (anecdotes, tips). `formatRelativeDate` + `sortFeedRiffs` (algo for-you basé likes user). Dashboard CommunityRiffCard simplifiée : teaser link cliquable vers /riffs avec like inline + caption preview.
- **TASK 5** — `5baa461` — **i18n FR/EN setup** : react-i18next + browser-language-detector. 85 strings dans fr/en JSON (nav full, common, landing hero, dashboard, settings). Card "Langue" dans Settings avec toggle drapeaux 🇫🇷 🇬🇧. Sidebar + MobileNav 100% migrés (toutes les nav labels via `t('nav.*')`). Landing : kicker / headline / signIn. Settings : title + tuning + language card. Reste FR hardcoded pour Dashboard / pages secondaires (Phase 5+ migration complète).

## 🌿 Recovery 20.1 (commit a446ed0 pushé en début de session 21)
Pour mémoire — récupération du bug audio session 20 nuit : SR mismatch 44100 vs 48000 sur OfflineAudioContext qui crashait silencieusement buildVoices → silence partout. Corrigé via `Tone.getContext().sampleRate` + await prewarmCabinets + fakecab fallback. **Devenu obsolète par TASK 1 session 21** (la chaîne ampChain a été remplacée par WebAudioFont) mais le fix est resté valide jusqu'à ce moment.

## 🟡 Skip / scope-down

- **i18n** : coverage MVP infrastructure + sidebar full + selector fonctionnel. Dashboard / Songs / Chords / Scales / Stats / Settings autres sections restent FR hardcoded. À migrer en Phase 5+ quand les strings ne bougent plus.
- **Riffs pagination 10x10** : non implémentée (seed n'a que 10 riffs, pagination moot). À ajouter quand le backend Phase 5 livre plus de riffs.
- **TASK 6-10 bonus** (SEO, a11y, capo polish, stats heatmap, skeletons) : pas attaqués — manque de temps après les 5 prios.

## 🔴 Bugs bloquants

- Aucun. Build pass à chaque commit.

## 🎯 À valider user au réveil

1. **AUDIO TASK 1 — priorité absolue** : tester les 6 presets sur `/chords` à l'oreille.
   - `electric-clean` (default) doit sonner clean polyvalent
   - `electric-jazz` doit avoir le caractère hollow body chaud
   - `electric-overdrive` doit cruncher (déjà saturé sur le sample)
   - `electric-distortion` doit cracher high-gain
   - `acoustic-nylon` / `acoustic-steel` doivent sonner acoustique crédible
   - Si UN preset n'est pas convaincant, on peut swap pour un autre GM ID dans WAF_PRESETS (ex : essayer la banque Aspirin au lieu de FluidR3, ou un autre slot GM proche)

2. **TASK 2 reset tuto** : sur `/settings` → bouton "Refaire le tuto" → arrive sur Dashboard → tutorial 5 steps reljoue + outro confetti

3. **TASK 3 plan tuto** : sur `/plan` → click sur un node → drawer s'ouvre → 400ms après, tuto plan apparaît (5 steps : sticky progress bar → path → node → drawer chips → outro)

4. **TASK 4 feed Riffs** : `/riffs` → 3 sort tabs sticky / tag chips scrollables / feed Instagram avec captions / actions row complete. Dashboard widget "Riff de la semaine" est maintenant un lien minimal

5. **TASK 5 i18n** : `/settings` → toggle 🇫🇷/🇬🇧 → sidebar passe instant en EN ("MY SPACE / Today / Riff of the week"). Reload garde la langue choisie.

## ⏱ Stats

- 5 tasks livrées (TASK 1-5) + recovery 20.1 pushée
- 6 commits sur main worktree (claude/trusting-moore-b4036b)
- ~1500 lignes ajoutées net (et ~1000 retirées : ampChain.ts dead code + Riffs grid refactor)
- 0 build fails
- Main bundle gzip stable ~310 KB malgré WebAudioFont + i18n (WAF charge via CDN async, i18n ajoute ~12 KB gzip)
- Dexie inchangée (v8)
- Prefs bumpée v9 (champ planTutorialSeen + migration legacy strumSound IDs)

---

# JOURNAL DÉTAILLÉ

## TASK 1 — Audio WebAudioFont (commit 6dc5e3a)

**Pivot architectural** : on STOP la simulation d'ampli en JS (WaveShaper + filter chains + IR convolver Neural-DSP-like ampChain). À la place : samples GM SoundFont FluidR3 **pré-enregistrés en studio**, chargés via CDN jsdelivr. Chaque preset arrive avec son caractère d'ampli déjà imprimé sur la waveform.

**Pourquoi** : la simulation ampChain (sessions 20-21 recovery) restait expérimentale et ne convainquait pas à l'oreille. Le SR mismatch bug a été un signal supplémentaire que cette approche était fragile. Les samples GM sont la référence gratuite la plus crédible.

**Nouveaux fichiers** :
- `src/lib/webAudioFont.ts` : script loader async + singleton `WebAudioFontPlayer` + preset cache. Bundle léger : seul le main code reste dans `index-*.js`, WebAudioFontPlayer.js + samples chargés lazy au premier audio interaction.

**Modifié** :
- `src/lib/strumSounds.ts` : registry `WAF_PRESETS` (url + varName) + `PRESET_FX` (reverbDecay / reverbWet / lpCutoff / velocityScale / noteDuration). 6 IDs : `acoustic-nylon`, `acoustic-steel`, `electric-jazz`, `electric-clean`, `electric-overdrive`, `electric-distortion`. Export `migrateLegacyStrumId` pour la migration prefs.
- `src/lib/audio.ts` : réécrit. Chaîne post-FX par preset : `WAF queueWaveTable → presetGain → [presetLp] → presetReverb → masterCompressor → masterGain → destination`. `rebuildVoices` async qui await loadPreset (cache hit instant).
- `src/stores/prefsStore.ts` : version 8 → 9, migrate via `migrateLegacyStrumId`. Default `electric-clean`.
- `src/pages/Settings.tsx` : suppression de AmpFlow signal-flow display (n'a plus de sens sans amp chain JS).

**Supprimé** : `src/lib/ampChain.ts` (~14KB).

**Vérifié preview** :
- `initAudio('electric-clean')` → `ready=true`, `0 erreur console`
- `rebuildVoices` 5 presets enchaînés (jazz → overdrive → distortion → steel → nylon) → 0 erreur, activeTimbre OK
- Les 6 `_tone_<NNNN>_FluidR3_GM_sf2_file` globals présents sur `window`
- `ctxSampleRate=48000` (Chrome desktop)

## TASK 2 — Bouton Refaire le tuto (commit d15e137)

`src/pages/Settings.tsx` : nouvelle Card "Tutoriel" juste avant Export/Reset :
- "Refaire le tuto" : `setTutorialCompleted(false)` + `navigate('/dashboard')` → le Tutorial overlay 5 steps se relance auto
- "Refaire onboarding + tuto" : reset les 2 flags

Pratique pour démontrer RiffLab à quelqu'un ou rattraper si zappé au premier launch.

## TASK 3 — Plan tutorial (commit 28bc778)

**Refactor Tutorial.tsx** : extraction d'une primitive réutilisable `TutorialOverlay({ steps, label, onDone })`. Le wrapper `Tutorial` reste pour le Dashboard (passe les 5 DASHBOARD_STEPS + persist `tutorialCompleted`).

**Nouveau** `src/components/onboarding/PlanTutorial.tsx` : wrapper avec 5 steps spécifiques au Plan :
1. `plan-progress-bar` — "Suis ton avancée globale"
2. `plan-path` — "Ton parcours d'apprentissage"
3. `plan-node-active` — "Chaque étape = un module" (cible le node `current` OU le premier `available`)
4. `plan-drawer-chips` — "Clique pour explorer"
5. Outro centered — "Allez, vas-y, débloque ton premier niveau 🎸" + confetti

**`prefsStore`** : nouveau champ `planTutorialSeen` (default `false` ; migrate v9 = `true` pour users existants).

**`PracticePlan.tsx`** : `handleNodeClickWithTutorial` qui ouvre le drawer puis trigger `planTutorialOpen` 400ms après si `!planTutorialSeen`.

## TASK 4 — Riffs feed social (commit e5cc106)

**Page `/riffs` réécrite** comme un feed Instagram :
- Sort tabs sticky : Pour toi (algo `sortFeedRiffs` for-you basé likes user — riffs avec tags matching prio, fallback trending) / Trending (baseLikes desc) / Récents (addedAt desc)
- Tag chips scrollables horizontaux (`#rock` `#blues` ...)
- Feed vertical max-w-2xl
- `RiffFeedCard` par post :
  - Header : Avatar (initial dans circle gold) + `@contributor` + `formatRelativeDate` ("2h", "hier", "il y a 3 jours") + difficulty stars
  - Caption (nouveau field, 10 riffs seed enrichis avec captions variées)
  - Tags inline `#rock`-style
  - TabReader inline compact (lineHeight 14, beatWidth 12)
  - Actions row : Heart (like) / MessageCircle (comments stub) / Bookmark / Share (`navigator.share` + clipboard fallback)
- FAB mobile + bouton desktop "Partager mon riff" → modal Phase 5 placeholder

**`Dashboard.CommunityRiffCard`** simplifiée : devient un teaser cliquable vers `/riffs`. Avatar + caption preview line-clamp-2 + like inline + lien "Voir tous les riffs". Plus de TabPlayer embedded (qui était redondant avec le feed `/riffs`).

**Helpers `src/lib/communityRiffs.ts`** :
- `formatRelativeDate(iso)` : min/h/hier/jours/sem/mois/ans
- `sortFeedRiffs(riffs, mode, likedIds)` : algo
- nouveaux fields `caption?: string` + `commentsCount?: number` sur 10 riffs seed

## TASK 5 — i18n FR/EN (commit 5baa461)

**Setup** : `npm install i18next react-i18next i18next-browser-languagedetector`.

**`src/i18n/index.ts`** : init avec fallback `fr`, supportedLngs `['fr','en']`, detector `localStorage` (`'rifflab-locale'`) puis `navigator.language`. Export `LOCALES` (avec flags) + `setLocale(id)`.

**`src/i18n/locales/{fr,en}.json`** : ~85 strings :
- `nav.*` : full sections + items
- `common.*` : save/cancel/delete/play/pause/next/previous/close/back/loading
- `landing.*` : signIn/kicker/headline/lead/ctaStart/etc.
- `dashboard.*` : greeting/dailyTraining/workChord/streak/challenge
- `settings.*` : title/language/tuning/capo/audio/display/theme/tutorial/exportReset/etc.

**`src/main.tsx`** : `import '@/i18n'` avant le render.

**Composants migrés** :
- ✅ `Sidebar.tsx` : full (16 nav items + 4 section labels via `t('nav.*')`)
- ✅ `MobileNav.tsx` : full (Sons/Accords/Gammes/Outils + 3 tools in sheet)
- ✅ `Settings.tsx` : new Card "Langue" + title + tuning header
- ⚠️ `Landing.tsx` : signIn + kicker + headline migrés (le reste FR hardcoded)
- ❌ `Dashboard.tsx` : pas migré (manque de temps)
- ❌ Autres pages : pas migrées

**Vérifié preview** : switch EN → sidebar passe en "MY SPACE / Today / My songs / Setlists / Riff of the week / Jam mode / LIBRARIES" instant. Reload conserve la langue.

---

## Prochain Claude

Si Melvin valide l'audio à l'oreille demain matin → continuer i18n full coverage Dashboard + autres pages, ou attaquer les bonus TASK 6-10 (SEO + OG, a11y audit Lighthouse, capo polish, stats heatmap calendaire, loading skeletons).

Le pivot WebAudioFont est sain et stable. Si un preset GM précis ne sonne pas convaincant, swap `WAF_PRESETS[X].url` vers un autre slot GM ou une autre banque (ex `Aspirin_sf2_file.js` au lieu de `FluidR3_GM_sf2_file.js`).
