# Session log — 2026-06-17 — 30 riffs curés (data)

> Objectif : enrichir la bibliothèque de riffs avec 30 entrées qualité
> (techniques annotées + tablatures complètes) pour crédibiliser la démo
> (Top semaine, Collections, etc.). Extension **strictement additive** de
> `communityRiffs.ts` + `tabsDatabase.ts`, mise à jour de `riffCollections.ts`.

## Résultat

**22 nouveaux riffs ajoutés** (les 8 autres des 30 listés étaient déjà
présents : Smoke on the Water, Iron Man, Sunshine of Your Love, Crazy Train,
Day Tripper, Stairway intro, Sweet Child intro, Back in Black).

Chaque nouveau riff = 1 `Tab` (tablature complète, format mesures/notes
existant) dans `tabsDatabase.ts` + 1 `CommunityRiff` (techniques, tags,
likes/rating seed, caption, bpm/tuning/capo/key) dans `communityRiffs.ts`.

### Débutant (5)
- Come As You Are — Nirvana (`cr-come-as-you-are`)
- Wish You Were Here intro — Pink Floyd (`cr-wish-you-were-here`)
- Smells Like Teen Spirit — Nirvana (`cr-smells-like-teen-spirit`)
- Whole Lotta Love — Led Zeppelin (`cr-whole-lotta-love`)
- Pumped Up Kicks — Foster the People (`cr-pumped-up-kicks`)

### Intermédiaire (7)
- Wonderwall — Oasis (`cr-wonderwall`)
- Hotel California arp — Eagles (`cr-hotel-california`)
- Sweet Caroline — Neil Diamond (`cr-sweet-caroline`)
- Black Magic Woman — Santana (`cr-black-magic-woman`)
- Nothing Else Matters — Metallica (`cr-nothing-else-matters`)
- Hey Joe — Hendrix (`cr-hey-joe`)
- Layla — Eric Clapton (`cr-layla`)

### Avancé (7)
- For the Love of God simplified — Vai (`cr-for-the-love-of-god`)
- Tornado of Souls — Megadeth (`cr-tornado-of-souls`)
- Cliffs of Dover — Eric Johnson (`cr-cliffs-of-dover`)
- Cassidy — Grateful Dead (`cr-cassidy`)
- Master of Puppets riff — Metallica (`cr-master-of-puppets`)
- Eruption tap simplified — Van Halen (`cr-eruption`)
- Caprice 24 adapt — Paganini (`cr-caprice-24`)

### Expert (3)
- Hammer Smashed Face — Cannibal Corpse (`cr-hammer-smashed-face`)
- Far Beyond the Sun (Yngwie sweep) — Malmsteen (`cr-far-beyond-the-sun`)
- Through the Fire and Flames — DragonForce (`cr-through-the-fire-and-flames`)

## Type étendu (additif)
- `CommunityRiff` reçoit 4 champs **optionnels** : `bpm?`, `tuning?`, `capo?`,
  `key?` — ne casse pas les 10 riffs existants. Nouveau type `RiffTuning`.

## Collections (`riffCollections.ts`)
- Enrichies automatiquement via prédicats de tags/techniques :
  `10 riffs pour débuter` (difficulty ≤ 2), `Top intros iconiques`
  (tag iconique), `Apprendre le bend` (technique bend), `Approche blues`
  (tag blues).
- `Riffs rock 70s` : ajout de `cr-whole-lotta-love` à la liste explicite.
- **2 nouvelles collections** : `🤘 Riffs metal` (tag metal),
  `🎷 Blues classique` (Hey Joe, Layla, Black Magic Woman, Sunshine,
  Whole Lotta Love).

## Vérif
- `npm run build` ✅ (tsc strict + vite build OK). Warning chunk-size
  préexistant, hors scope.
- Aucune régression : extension purement additive, page `/riffs` intacte.
