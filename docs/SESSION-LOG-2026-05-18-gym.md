# RÉCAP 2-MIN MELVIN — Session salle (2026-05-18 ou-thereabouts)

> Branche `claude/trusting-moore-b4036b` — 5 commits livrés isolés en parallèle Phase 5.1 Auth.

## ✅ Livré (5 commits pushés sur origin)

| Task | Sujet | Commit |
|---|---|---|
| GYM 5 | Random song button pondéré (60% backlog "à bosser") | `9e56e8e` |
| GYM 1 | Keyboard shortcuts — ajout `g w` (Composer), `g o` (Progressions), `g i` (Profil) | `3f62b50` |
| GYM 3 | SEO URL canonique → `riff-lab-sigma.vercel.app` + sitemap /composer | `e4b0319` |
| GYM 4 | Skeletons audit (rien à patch — Dashboard/Songs/Setlists/Stats déjà faits sess 20/21) | _no-op_ |
| GYM 2 | Mini-quiz fin de niveau Plan — 3 QCM + Dexie v10 + badge ⭐ | `b13f90b` |

## 🟡 Skip / déjà fait

- **TASK 1 (keyboard shortcuts)** : core déjà fait session 20 nuit (`82966e0`). Cette session ajoute juste 3 routes manquantes (composer/progressions/profile).
- **TASK 3 (SEO + OG)** : meta tags + og-image.svg + robots.txt + sitemap.xml déjà créés session 20 nuit (`e26bcb6`). Cette session = update URLs de `rifflab.app` vers `riff-lab-sigma.vercel.app` + ajout entry /composer dans sitemap.
- **TASK 4 (skeletons)** : audit révèle que tout est déjà skeletoné. Dashboard recent songs (`5eee48c`), Songs (`SongTileSkeleton`), Setlists (`SetlistTileSkeleton` sess 21), Stats KPI cards (sess 21). Riffs feed instant (COMMUNITY_RIFFS = JS). SetlistDetail montre "Setlist introuvable" pendant le load (subtle UX bug non critique, reporté).
- **OG image PNG** : reste en SVG. Conversion PNG 1200×630 = TODO Phase 5+ (Twitter/Discord rendent mieux le PNG).

## 🔴 Bugs bloquants

- Aucun. Build pass à chaque commit.

## 🎯 Checklist test

- [ ] `/songs` (avec ≥2 sons) → bouton "🎲 Au hasard" desktop → navigate random (60% chance backlog "à bosser")
- [ ] N'importe quelle page → `?` → cheatsheet affiche maintenant `g w` / `g o` / `g i` dans la liste navigation
- [ ] `g w` → /composer ✓ | `g o` → /progressions ✓ | `g i` → /profile ✓
- [ ] `/plan` → click un node "à bosser" → drawer → "J'ai terminé ce niveau" → drawer ferme → 400ms après, NodeQuiz s'ouvre
- [ ] Quiz : 3 questions QCM (chord/scale/technique), progress bar, click option reveal good/bad + explanation, "Suivant" puis screen final avec score + Award icon
- [ ] Score ≥ 2/3 → message "Validé 🎉" + confetti gold + badge ⭐ apparaît sur le node dans le path
- [ ] Score < 2/3 → message "Pas mal !" — node reste complété, pas de badge
- [ ] Cliquer un node complété → drawer affiche bouton "⭐ Refaire le quiz" (ou "🎓 Faire le quiz" si jamais passed)
- [ ] Auto-validation (compléter tous chords+scales d'un node via /chords ou /scales) → toast "Niveau X validé ! 🎉" + 1.5s après le NodeQuiz s'ouvre

## ⏱ Stats

- 5 commits pushés sur `claude/trusting-moore-b4036b`
- 4 nouveaux fichiers : `nodeQuiz.ts`, `NodeQuiz.tsx`, et 0 pour les autres (commits sur fichiers existants)
- ~850 lignes ajoutées net (quiz = 80% du diff)
- 0 build fails
- Main bundle gzip ~310 KB stable
- Dexie bumpée v9 → v10 (table `quizResults`)

## 🗂️ Fichiers touchés par task

- TASK 5 : `src/pages/Songs.tsx`
- TASK 1 : `src/hooks/useKeyboardShortcuts.tsx`
- TASK 3 : `index.html`, `public/sitemap.xml`, `public/robots.txt`
- TASK 2 : `src/lib/db.ts`, `src/lib/nodeQuiz.ts` (new), `src/components/plan/NodeQuiz.tsx` (new), `src/pages/PracticePlan.tsx`

## 🎯 Prochaine session — pistes ouvertes

- Phase 5.2 : sync Dexie ↔ Supabase Postgres bidirectionnel (push à login, fetch à reload, resolution conflict par updated_at)
- Onglet "Mes progressions" sur `/progressions` (customProgressions de la sess compositeur)
- OG image PNG 1200×630 généré (script offscreen canvas ou outil externe)
- Easter egg Konami code → thème Retro (bonus si on retombe dans une mini-session light)
- SetlistDetail : différencier "loading" de "not found" via local state + useEffect

Lien GitHub : https://github.com/Azraude/RiffLab/tree/claude/trusting-moore-b4036b
