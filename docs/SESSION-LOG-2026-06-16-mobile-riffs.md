# Session 30bis — Mobile-first /riffs + page détail + MobileNav

> Branche `claude/trusting-moore-b4036b`. Continue sess 30.
>
> # ⚠️ AUDIT HONNÊTE EN TÊTE
>
> Le brief sess 30bis a 6 phases. **Phases 4 + 5 + 6 sont DÉJÀ LIVRÉES
> en sess 30** (commits sur main il y a quelques minutes) :
> - Phase 4 wirings RiffEditor + comments → `a962ae0` + `65478fc`
> - Phase 5 streak + activity widget → `5452556` + `392bfea`
> - Phase 6 seed démo → `3f8678f`
>
> Donc cette session = focus uniquement sur **Phases 1+2+3 mobile-first**.
> Je ne re-code pas ce qui existe.

---

## 🔴 BUG BLOQUANT
_(aucun)_

---

## Phase 0 — Audit honnête

### Déjà livré sess 30 (pas re-coder)
- ✅ `src/stores/socialStreakStore.ts` + wiring 4 actions
- ✅ `src/components/social/CommentsSection.tsx` + wire RiffDetail
- ✅ `src/components/social/ActivityFeedWidget.tsx` + `/activity` route
- ✅ `src/components/riffs/RiffEditor.tsx` push Supabase (`publishRiff()`)
- ✅ `docs/SEED-RIFFS-PUBLIC-DEMO.sql` + `scripts/clean-demo-data.sql`
- ✅ Badges streak-7 + streak-30 catalogue
- ✅ `BadgeUnlockListener` mounted dans Layout

### Reste à faire (focus session 30bis)
- Phase 1 mobile-first /riffs (carrousels horizontaux + feed full-width)
- Phase 2 page détail riff tab scroll horizontal + sticky
- Phase 3 MobileNav refonte avec 🎸 Riffs central

### Coordination 29bis
- 29bis sur `feat/responsive-refonte` peut toucher MobileNav.tsx
  (active indicator glow). Moi (sess 30bis Phase 3) vais le toucher
  structurellement (bouton central). Conflit potentiel au prochain
  merge — gérable.
- 29bis NE TOUCHE PAS aux fichiers riffs (interdiction brief).
- Je bosse sur `main` direct via worktree, fast-forward push à chaque commit.

---

_(phases au fil de l'eau ci-dessous)_
