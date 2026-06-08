# 🚀 Ship Day Playbook — RiffLab v1.0

> **Préparation 1h, ship 1h, première semaine 30 min/jour.**
> Édite cette doc le jour J pour customiser les drafts à ton ton perso.

---

## ✅ Pre-ship checklist (1h le matin, avant de publier)

### Build & déploiement

- [ ] `npm run build` PASS sur la branche main
- [ ] Bundle main chunk < 1.5 MB (ok actuellement ~430 KB gzip)
- [ ] Précache PWA < 4 MB (ok actuellement ~3.4 MB)
- [ ] Lighthouse PWA score > 90 (test sur Chrome devtools mobile mode)
- [ ] Lighthouse Perfomance > 80 sur mobile (test sur prod, pas dev)
- [ ] Lighthouse Accessibility > 90
- [ ] Push sur main → Vercel deploy auto OK (vérif preview build du PR mergé)

### Auth Supabase

- [ ] Vercel dashboard → Settings → Environment Variables :
  - [ ] `VITE_SUPABASE_URL` = `https://mneifpmfknreopfqfmyz.supabase.co` (3 envs : Prod / Preview / Development)
  - [ ] `VITE_SUPABASE_ANON_KEY` = celle de `.env.local`
- [ ] Supabase Dashboard → Authentication → URL Configuration :
  - [ ] Site URL = `https://riff-lab-sigma.vercel.app`
  - [ ] Redirect URLs incluent `https://riff-lab-sigma.vercel.app/**` ET `http://localhost:5173/**`
- [ ] Test e2e magic link : envoie un magic link à ton email → reçois → clique → arrives sur `/dashboard` loggé
- [ ] Test Google OAuth si activé (sinon skip Phase 5.4)

### SEO / Sharing

- [ ] OG image visible sur https://www.opengraph.xyz/url/https%3A%2F%2Friff-lab-sigma.vercel.app
- [ ] Paste l'URL `riff-lab-sigma.vercel.app` dans une conv WhatsApp → vérifie que l'aperçu se charge bien
- [ ] Pareil dans un message Discord
- [ ] `sitemap.xml` accessible : https://riff-lab-sigma.vercel.app/sitemap.xml
- [ ] `robots.txt` accessible : https://riff-lab-sigma.vercel.app/robots.txt

### PWA / Offline

- [ ] Chrome → ouvre l'app → menu → "Installer RiffLab" → ça apparait
- [ ] Une fois installée, **éteins le wifi** → l'app fonctionne offline (au moins navigation entre pages déjà visitées)
- [ ] Re-ouvre l'app installed après quelques minutes → SW update propose un toast si une nouvelle version dispo

### Mobile réel

- [ ] Test sur iPhone réel (Safari ou installé PWA) :
  - [ ] Landing s'affiche bien, 3D décorative OK ou fallback gradient
  - [ ] Dashboard responsive
  - [ ] Chords swipe fonctionne (gesture iOS)
  - [ ] Tuner micro permission accordable
  - [ ] FAB Songs visible sans collision avec MobileNav
- [ ] Test sur Android réel (Chrome) :
  - [ ] PWA install prompt apparait
  - [ ] WebAudioFont audio OK
  - [ ] Pas de freeze sur Scales 3D toggle

### Feedback channel

- [ ] Crée le serveur Discord "RiffLab — community" (peut être juste toi + 5 potes au début)
- [ ] Crée le webhook Discord dans un channel #feedback
- [ ] Ajoute `VITE_DISCORD_FEEDBACK_WEBHOOK` à Vercel env vars (Prod uniquement)
- [ ] Test : ouvre l'app prod → clique 💬 → "Idée" → message test → vérifie que ça apparait dans Discord

---

## 📢 Posts pré-écrits (drafts à customiser)

### Reddit — r/guitar

```
Title: I built a local-first guitar practice app because I was tired of UG ads — RiffLab v1.0

Hey r/guitar,

I'm Melvin, self-taught guitarist for ~8 years. I built RiffLab because every app I tried frustrated me:

- Ultimate Guitar = wall of ads + paywalled features
- Yousician/Justin = aggressive freemium funnel
- Songsterr = subscription required

I wanted a simple notebook for MY covers, MY riff ideas, MY progressions. Local-first (data lives in your browser, no account needed). Free. No ads. Mobile-first absolute (it's meant to sit on your music stand during rehearsal).

What's in v1.0:
- 🎵 Personal song notebook (chords + lyrics + sections)
- 🎼 Composer (chord progression generator, theory-validated)
- 🎸 50+ chord library with CAGED voicings
- 🎹 11 scales with fretboard visualizer
- 📅 Daily practice plan (Duolingo-like path + streak)
- 📊 Stats (heatmap calendar, top chords)
- 🎤 Setlists with PDF export
- 🎙 Recording per song
- 🎚 Built-in tuner + metronome
- 🌐 PWA — install + offline

→ https://riff-lab-sigma.vercel.app

It's open source (MIT) on GitHub: github.com/Azraude/RiffLab

Would love your feedback — what's missing? What annoys you? There's a 💬 button in-app that ping me on Discord directly.

(No newsletter, no upsell. Just a tool I wanted to exist.)
```

### Reddit — r/WeAreTheMusicMakers / r/songwriters

```
Title: A free chord progression generator (no AI bait, just music theory)

Sharing a tool I built — RiffLab's Composer.

Pick a key + style + mood → it generates a chord progression rooted in actual music theory (diatonic + common borrowed chords). You can swap individual chords, transpose, and add to your song notebook.

No "AI generation", no fake hype. Just basic theory rules I coded by hand because I wanted to study how progressions work.

It's part of a bigger guitar practice app (chord library, scales, setlists, daily plan) but the Composer works standalone.

→ https://riff-lab-sigma.vercel.app/composer

Free, no account, no ads. Feedback welcome.
```

### Twitter / X — thread (5 tweets)

```
1/ Built a thing 🎸

RiffLab — a guitar practice app for people tired of ads + paywalls.

Local-first. Free. Mobile-first. PWA.

After 8 years of self-taught guitar + 4 years of dev, this is the notebook I wish I'd had on day one.

→ riff-lab-sigma.vercel.app

[image: landing.png]

2/ The killer feature: Composer.

Pick a key, a style (pop/jazz/blues), a mood. Get a theory-validated chord progression. Swap chords intelligently. Transpose live.

No AI fluff. Just music theory rules coded by hand.

[image: composer.png with progression visible]

3/ Daily practice path Duolingo-style.

10 unlockable levels. Mini-quiz at each completion. Streak tracking. Heatmap stats so you actually see your year of practice.

Beats "I'll practice tomorrow" for 3 months in a row.

[image: plan.png]

4/ Stack for devs curious:
- Vite + React 18 + TypeScript
- Tailwind + Framer Motion
- Dexie (IndexedDB local-first)
- Tone.js + WebAudioFont (GM samples)
- Supabase auth + cloud sync (Phase 5.2)
- Three.js (decorative only)
- PWA via Workbox

Open source MIT: github.com/Azraude/RiffLab

5/ It's v1.0 — I know there are bugs.

If you try it and find something broken / missing / annoying, hit the 💬 button in the app. Goes straight to Discord, I read everything.

🙏 RT if you know someone learning guitar.

→ riff-lab-sigma.vercel.app
```

### LinkedIn (FR, ton plus pro)

```
Après 6 mois de side-project, je release RiffLab v1.0 — une web app de pratique guitare local-first que j'ai construit pour moi-même.

Le contexte : je suis guitariste autodidacte depuis 8 ans. J'utilisais Ultimate Guitar, Yousician, Songsterr — toutes m'ont frustré (pubs envahissantes, paywall agressif, modèles freemium qui poussent vers l'abo).

Donc j'ai construit ce que je voulais avoir :
✅ Carnet de morceaux perso (local-first via IndexedDB)
✅ Générateur de progressions d'accords (théorie codée, pas du "AI")
✅ Plan de pratique progressif type Duolingo
✅ Bibliothèque accords + gammes interactives
✅ Tuner + métronome
✅ Setlists exportables PDF
✅ PWA installable, offline-first
✅ Pas de pub. Pas de tracking. Pas de paywall.

Stack pour les curieux :
- Vite + React 18 + TypeScript
- Tailwind, Framer Motion, Three.js (décoratif)
- Dexie (IndexedDB)
- Tone.js + WebAudioFont
- Supabase auth + sync cloud (Phase 5.2 en cours)
- Open source MIT sur GitHub

→ https://riff-lab-sigma.vercel.app

C'est un V1. Y'a forcément des bugs. Feedback super welcome.

#guitar #webdev #pwa #sideproject #opensource
```

### Discord — message pour serveurs guitaristes

Pour balancer dans **MMP**, **CmajorPlay**, **Sweetwater Discord**, etc :

```
Salut tout le monde 👋

J'ai construit une web app de pratique guitare ces 6 derniers mois et je viens chercher du feedback de vrais guitaristes.

RiffLab → https://riff-lab-sigma.vercel.app

Local-first, gratuit, pas d'inscription requise, mobile-first.

Y'a un carnet de morceaux, un générateur de progressions, une biblio d'accords + gammes, un plan de pratique journalier, des setlists, et un tuner intégré.

Y'a un bouton 💬 dans l'app pour me ping direct si vous trouvez un bug ou une idée.

🙏
```

---

## 📊 Première semaine — monitoring

### Routine quotidienne (30 min / jour)

**Matin (10 min)** :
- Check Discord webhook channel → notes les nouveaux feedbacks
- Check Vercel analytics si activé (uniques visiteurs, pages les + visitées)
- Check les replies Reddit + Twitter pour répondre rapidement (engagement bumps reach)

**Midi (10 min)** :
- Triage : marque les bugs critiques → tu les fix dans la session du soir
- Idées : crée des GitHub issues pour ne pas oublier
- Encouragement : DM ou comment merci à ceux qui ont essayé

**Soir (10 min)** :
- Si bug critique → fix + push + tag patch (`v1.0.1`)
- Sinon : prépare le post du lendemain (variation de contenu)
- Backup : `npm run build` pour vérifier que rien n'a cassé entre temps

### Métriques de succès à 7 jours

| Métrique | Bon | OK | Faut bouger |
|---|---|---|---|
| Visiteurs uniques | 100+ | 30-100 | < 30 |
| Feedbacks écrits | 5+ | 1-5 | 0 |
| Comptes créés (auth) | 10+ | 3-10 | < 3 |
| Retours à J+1 | 5+ | 1-5 | 0 |
| Stars GitHub | 20+ | 5-20 | < 5 |
| Bugs critiques | 0 | 1-2 manageable | 3+ |

Si < 30 visiteurs sur 7 jours : refactor le post. Le hook n'a pas marché. Essaie un angle différent (ex : focus Composer pour songwriters / focus mobile-first pour rehearsal).

### Réponse type aux feedbacks

**Bug** : "Merci pour le report ! Je regarde et je te tiens au courant. (Tracking : #issue-X)"

**Feature request** : "Bonne idée. C'est en backlog. Je l'ajoute à la roadmap pour la phase X. (lien GitHub issue créée)"

**"C'est cool mais il manque X"** : "Oui, on m'a déjà dit ça. X arrive en Phase 6 (Y semaines). En attendant tu peux contourner avec Z."

**Question technique** : "L'app utilise X / Y / Z. Le code est ici → lien GitHub. Tu peux fork si tu veux ajouter ton truc."

---

## 🚫 Ce que tu NE fais PAS

- Pas de paywall ce mois-ci. Même pas un "Soutenir le projet" boutton.
- Pas d'analytics tiers (Plausible OK plus tard si tu veux des données, mais privacy-friendly only — JAMAIS Google Analytics).
- Pas de spam multi-canal en boucle. Une fois sur Reddit, une fois sur X, une fois sur LinkedIn, une fois Discord par serveur. PAS plus.
- Pas de "buy me a coffee" boutton avant 100 users actifs. Tu te crames la crédibilité.
- Pas de promesse de feature qui n'est pas dans la roadmap publique.

---

## 📝 Template post de suivi à J+7

Quand tu as des chiffres et 1-2 testimonials, balance un follow-up post :

```
1 semaine après le launch de RiffLab.

Chiffres :
- X visiteurs
- Y feedbacks reçus (et tous lus, promis)
- Z bugs fix, A features ajoutées

Ce qui a le plus plu :
- [insère testimonial 1]
- [insère testimonial 2]

Ce qui revient le plus en demande :
- [feature 1]
- [feature 2]

→ Roadmap mise à jour : [lien]

Merci à tous ceux qui ont essayé. Le feedback est mon carburant.

→ riff-lab-sigma.vercel.app
```

---

## 🎯 Critère unique pour passer Phase 5.2 sync cloud

Quand 3+ users te disent "j'aimerais retrouver mes données sur mon laptop", c'est le signal pour shipper la sync.

**Pas avant.** Sinon tu construis pour personne.

---

## ✊ Mantra ship-day

> **"Ship, then iterate."**
>
> Un v1.0 imparfait livré bat un v2.0 parfait jamais livré.
> Le feedback réel bat 100 hypothèses tirées d'un sondage.
> 50 users qui essaient pendant 5 minutes est plus précieux que 1 user qui fait un giga thread d'idées.
>
> Tu peux refactor tout dans 6 mois. Tu ne peux pas récupérer les 6 mois où personne n'a vu RiffLab.
