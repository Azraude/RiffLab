# RÉCAP 2-MIN MELVIN — Session 22 (Phase 5.1 Auth Supabase)

> Branche `claude/trusting-moore-b4036b` — 1 commit `b0b5919` pushé sur origin.
> Phase 5 démarrée — auth seulement, sync Dexie↔Postgres reportée à session 23.

## ✅ Livré (1 commit fusionné — auth + i18n bonus, touchent les mêmes layout files)

- **TASK 1** — Supabase client setup : `npm install @supabase/supabase-js + @radix-ui/react-dropdown-menu`, `.env.local` avec les clés (gitignored), `.env.example` template committé, `src/lib/supabase.ts` singleton avec `autoRefreshToken + persistSession + detectSessionInUrl`
- **TASK 2** — Tables Supabase + RLS : **assumé fait par Melvin** (le brief disait "skip si tu vois les 9 tables dans le dashboard")
- **TASK 3** — `src/stores/authStore.ts` Zustand : mirror user/session/loading + `signInWithMagicLink` + `signInWithGoogle` + `signOut` + bootstrap `getSession()` au boot + `onAuthStateChange` listener
- **TASK 4** — `src/components/auth/LoginModal.tsx` Radix Dialog : tabs signin/signup, form email + bouton magic link, séparateur "ou", bouton Google OAuth (GoogleIcon SVG inline 4 couleurs brand), états idle/sending/sent/error, message succès "Mail envoyé à xxx"
- **TASK 5** — `src/components/auth/AuthMenu.tsx` réutilisable : si not logged → bouton "Se connecter" qui ouvre le modal. Si logged → avatar (initiale) + email truncated + chevron, click Radix DropdownMenu avec "Mon profil" (Link /profile) + "Se déconnecter" rouge danger. Mounted dans Sidebar bottom + MobileNav sheet
- **TASK 6** — `src/pages/Profile.tsx` + route `/profile` : Card identité (avatar email date inscription + badge Tier free) + Card édition (input pseudo + textarea bio + UPDATE profiles via supabase) + sign out rouge en bas. Redirect / si pas loggé
- **TASK 7 bonus** — `src/components/ui/LanguageSwitcher.tsx` : 2 boutons drapeau 🇫🇷 🇬🇧 côte à côte, actif = ring gold + inset glow. Mounted dans Sidebar bottom + MobileNav sheet section "Langue"

## 🌐 Landing topbar
Bouton "Se connecter" passe d'un `Link to=/dashboard` à un bouton qui ouvre `LoginModal`. Le CTA "Commencer gratuitement" reste tel quel (mode local sans auth).

## 🚫 Skip cette session (Phase 5.2+)
- Migration Dexie → Supabase (sync bidirectionnel offline-first)
- Stripe / Pro tier
- Profil public guitariste avec avatar upload
- Cosmetics shop paywall

## ⚠️ Vercel env vars (à faire avant prochain deploy)
**Avant que le build Vercel passe**, tu dois ajouter dans Dashboard Vercel → Settings → Environment Variables :
- `VITE_SUPABASE_URL` = `https://mneifpmfknreopfqfmyz.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = (la même que dans `.env.local`)

Pour les 3 envs : Production + Preview + Development. Sinon le build Vercel sortira un warning `[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing` et l'auth ne marchera pas en prod.

## 🎯 Checklist à tester en local (server `npm run dev`)

- [ ] `/` Landing → click "Se connecter" topbar → modal s'ouvre
- [ ] Modal → tape ton email → "Recevoir un lien magique" → tu reçois un mail Supabase
- [ ] Click le lien dans le mail → redirect `/dashboard`, sidebar passe en mode loggé (avatar + email)
- [ ] Sidebar : click avatar → dropdown "Mon profil" / "Se déconnecter"
- [ ] Click "Mon profil" → `/profile` affiche ton email + form édit username/bio
- [ ] Édit username → "Enregistrer" → ✓ Sauvegardé (UPDATE table profiles)
- [ ] Click "Se déconnecter" → retour Landing, sidebar mode non-loggé
- [ ] Re-click "Se connecter" → "Continuer avec Google" → OAuth flow + retour loggé
- [ ] Drapeaux 🇫🇷 / 🇬🇧 dans sidebar → click EN → UI switch live + persist au reload
- [ ] Refresh page : reste loggé (session Supabase persistée localStorage)
- [ ] `/profile` direct sans être loggé → redirect `/` Landing

## ⏱ Stats

- 1 commit (`b0b5919`) + ce session log
- 7 nouveaux fichiers : `supabase.ts`, `authStore.ts`, `LoginModal.tsx`, `AuthMenu.tsx`, `Profile.tsx`, `LanguageSwitcher.tsx`, `.env.example`
- 4 fichiers modifiés : `Sidebar.tsx`, `MobileNav.tsx`, `Landing.tsx`, `router.tsx`
- ~700 lignes ajoutées net
- Build : +270 KB precache (2399 KB total) — Supabase SDK ~200 KB + dropdown-menu ~70 KB
- 0 build fails

## 🎯 Prochain Claude — Session 23 (Phase 5.2)

Quand Melvin a validé le flow auth en local + ajouté les env vars Vercel, prochaine étape :
1. **Sync bidirectionnel Dexie ↔ Supabase** : à chaque saveSong/saveSetlist/logSession, push aussi dans Postgres si user loggé. Bootstrap : au login, fetch les rows Supabase et merge avec Dexie (resolution conflict par updated_at)
2. **Avatar upload** : Supabase Storage bucket `avatars/{userId}`, intégrer sur /profile
3. **Profil public** : route `/u/:username`, fetch public profile + stats
4. **Stripe Pro tier** : prep Phase 5.4 — créer la table subscriptions + webhook Stripe

Lien GitHub : https://github.com/Azraude/RiffLab/tree/claude/trusting-moore-b4036b
