# Session 28 — Audit "rattrapage features" (DIAGNOSTIC)

> Branche `claude/trusting-moore-b4036b`. Continue sess 27.
> **STATUS : Phase 0 audit fait, Phases 1-6 ARRÊTÉES en attente clarification user.**

---

## 🚨 BUG BLOQUANT EN TÊTE — DIAGNOSTIC INVERSE DU BRIEF

Le brief sess 28 part du constat : *"plusieurs features annoncées 'livrées' dans les sessions 20-27 ne sont PAS dans le repo. La sidebar n'a pas été refondue, pas d'auth, pas de Composer, pas de FretboardLearner, pas de heatmap, pas de PDF export, pas de share buttons, etc."*

**Après audit du repo, ce diagnostic est faux dans sa formulation, mais le symptôme observé par Melvin est probablement RÉEL pour une autre raison.** Détail ci-dessous.

---

## 0. État des lieux honnête au démarrage session 28

### Branche actuelle (worktree)
- Branch : `claude/trusting-moore-b4036b`
- HEAD : `52a9cd1 docs: session 27 — refonte page Riffs bilan + reco Melvin`
- Dernière update : sess 27 livrée

### Branche `main` (local + origin/main, IDENTIQUES)
- HEAD : `86bfcdc docs: session log 2026-05-17 session 19 + ROADMAP Phase 4.5 ajoutée`
- **Main est resté gelé à la fin de la sess 19.**

### Écart main ↔ branche worktree
- **66 commits** sur la branche worktree NON encore mergés dans main
- `git diff main..claude/trusting-moore-b4036b --stat` :
  → **131 fichiers modifiés, +19761 / -1861 lignes**
- Couvre 8 sessions : 20, 21, 22, 23, 24, 25, 26, 27

### Vérification fichier-par-fichier des features supposément "absentes"

| Brief sess 28 dit | Réalité worktree |
|---|---|
| ❌ "Auth Supabase pas dans le code" | ✅ `src/lib/supabase.ts` (34 lignes), `src/components/auth/AuthMenu.tsx` (122), `src/stores/authStore.ts` (92), `LoginModal.tsx`, `Profile.tsx`, `.env.example` configuré |
| ❌ "Composer pas dans le code" | ✅ `src/pages/Composer.tsx` (565 lignes), `src/lib/progressionTheory.ts`, ComposerTutorial, page entièrement fonctionnelle |
| ❌ "FretboardLearner pas dans le code" | ✅ `src/pages/FretboardLearner.tsx` (629 lignes), `src/lib/fretboardLearner.ts`, table Dexie v11, section /stats Fretboard Mastery |
| ❌ "Page About pas dans le code" | ✅ `src/pages/About.tsx` (298 lignes), route /about hors Layout, footer Landing avec liens |
| ❌ "Heatmap calendaire pas dans le code" | ✅ `src/components/stats/PracticeHeatmap.tsx` (123 lignes), montée dans Stats.tsx |
| ❌ "PDF export setlist pas dans le code" | ✅ `src/lib/setlistPdf.ts` (239 lignes), `jspdf` en deps, bouton sur SetlistDetail |
| ❌ "Share buttons pas dans le code" | ✅ `src/components/share/ShareDrawer.tsx` (207 lignes), wired sur SongDetail + SetlistDetail + RiffDetail |
| ❌ "Feedback button pas dans le code" | ✅ `src/components/feedback/FeedbackButton.tsx` (313 lignes), monté dans Layout, Discord webhook + fallback mailto |
| ❌ ".glb pas compressés (110 MB)" | ✅ Compressés sess 24 : `amp.glb` 216K, `guitar-fender-classic.glb` 131K, `guitar-fender-rose.glb` 244K. **Total 591 KB** (vs 31.5 MB avant, -98.1%). Le `studio-scene.glb` 110 MB est blacklisté dans `.gitignore` depuis longtemps. |
| ❌ "OG image PNG pas dans le code" | ✅ `public/og-image.png` (105 KB, 1200×630), meta tags dans index.html, sess 24 |
| ❌ "Refonte sidebar pas faite" | ✅ Sidebar refondue sess 26 puis raffinée sess 27 : 9 items en 3 sections (Espace perso / Créer & apprendre / Communauté) + 4 hub pages (`/library /resources /create /tools`) |
| ❌ "I18n pas faite" | ✅ Sess 22 + 25 : `src/i18n/` configuré, FR + EN, top pages migrées (Landing/Dashboard/Songs/Chords/Scales) + LanguageSwitcher drapeaux sidebar |

### Tag attendu
- Brief sess 28 demande de créer `v1.0.0-ship-ready`
- **Tag déjà créé sess 24** : `v1.0.0-ship-ready` pushé sur origin (commit `82c2f3f`)
  → https://github.com/Azraude/RiffLab/releases/tag/v1.0.0-ship-ready

### Tech debt
- `docs/TECH-DEBT.md` existe, mis à jour sess 24 : section ".glb compression" marquée résolue.

---

## 🎯 La vraie explication probable du symptôme Melvin

Si Melvin voit "des features manquantes" chez lui, c'est probablement à cause d'**UNE de ces causes** :

### Hypothèse 1 (la plus probable) : Melvin run l'app depuis le repo principal, pas le worktree
- Le worktree vit dans `.claude/worktrees/trusting-moore-b4036b/`
- Si Melvin run `npm run dev` depuis `C:\Users\melvi\OneDrive\Desktop\Projets\RiffLab\` (le repo principal sur main), il voit la version **fin sess 19** — donc effectivement pas d'auth, pas de Composer, pas de FretboardLearner, etc.
- Ce diagnostic colle parfaitement à ses observations.
- **Déjà documenté comme problème vécu en session 20 nuit** (Summary du contexte initial : *"Main repo vs worktree confusion : User's Vite was running from `C:\...\RiffLab\` (main branch, no recent commits) instead of `C:\...\.claude\worktrees\trusting-moore-b4036b\` (with all commits). User confused why changes didn't appear. Killed wrong Vite, started in correct worktree."*).

### Hypothèse 2 : Vercel prod déploie depuis `main`
- Si la prod (`riff-lab-sigma.vercel.app`) est branchée sur main, elle sert le code de sess 19.
- Toutes les nouvelles features (auth, composer, etc.) ne sont pas en ligne.
- Pour vérifier : `vercel git connect` ou Vercel dashboard → Settings → Git → Production Branch.

### Hypothèse 3 : Audit en GitHub UI sur main
- Si Melvin a vérifié sur github.com/Azraude/RiffLab et a regardé l'onglet "Code" sur la branche par défaut (main), il a vu la version sess 19.
- Pour vérifier, il faut changer la branche vue : github.com/Azraude/RiffLab/tree/claude/trusting-moore-b4036b

---

## ⛔ Décision pour cette session

**Je n'attaque PAS les Phases 1→6 du brief sess 28** parce que ce serait écrire ~12-18h de code qui existe déjà et l'écraserait dans le pire des cas (régression). Le brief lui-même demande : *"Si une feature semble déjà exister sous un autre nom → LIS le code existant, log 'feature X déjà présente sous Y, je consolide' et n'écrase pas"*. Ici toutes les features existent **sous le même nom prévu** — il n'y a rien à coder.

**Au lieu de ça**, voici les vraies actions utiles que je propose :

### Option A — Merger `claude/trusting-moore-b4036b` dans `main` (simple, hard option)
```bash
git checkout main
git merge --no-ff claude/trusting-moore-b4036b
git push origin main
```
- 66 commits en fast-forward, 131 fichiers
- Risque : si Vercel build casse en prod, c'est public
- Mitigation : tester le build avant push, ou PR depuis worktree → main pour CI check

### Option B — Pull Request UI pour review
- Push la branche, ouvrir une PR `claude/trusting-moore-b4036b` → `main`
- Plus safe, Melvin peut reviewer chunk par chunk
- `gh pr create --base main --head claude/trusting-moore-b4036b --title "Merge sessions 20-27"`

### Option C — Configurer Vercel pour déployer la branche worktree
- Vercel dashboard → Settings → Git → Production Branch = `claude/trusting-moore-b4036b`
- ⚠️ Temporaire — pas durable. Mieux vaut Option A ou B.

### Option D — Sanity check end-to-end (mon recommandation)
1. Confirmer le diagnostic avec Melvin (où run-il `npm run dev` ? depuis quel dossier ?)
2. Lancer le dev server depuis le worktree pour qu'il puisse voir l'état réel
3. Une fois confirmé que tout est là, choisir Option A/B/C

---

## ⏸ Status à la fin de cette session

- **0 ligne de code écrite** (volontaire — éviter le re-travail destructif)
- **0 commit** créé (sauf ce log si Melvin valide)
- Ce log écrit pour documenter le diagnostic

## Recommandation Melvin — au retour

1. **Ne pas demander à un nouvel agent de "rattraper" ces features** : elles existent toutes sur la branche worktree.
2. **Confirmer le dossier** depuis lequel tu lances `npm run dev`. Si c'est `C:\Users\melvi\OneDrive\Desktop\Projets\RiffLab\` (main, pas worktree) → tu vois la version sess 19 figée, normal.
3. **Décider de l'action** :
   - Si tu veux récupérer les features en prod : merge worktree → main (option A ou B)
   - Si tu veux garder le travail isolé pour le moment : run `npm run dev` depuis le worktree (`cd .claude/worktrees/trusting-moore-b4036b`)
4. **Si tu confirmes que ces features existent vraiment dans la branche worktree** : on peut passer à la **session 29** vraie (nouvelles features, polish post-merge, ou ship-day).

Si tu veux que je merge la branche moi-même maintenant, dis-le et je le fais (build pass check + push origin/main).
