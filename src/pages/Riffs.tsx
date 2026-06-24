/**
 * /riffs — feed social mobile-first (refonte 2026-06-17).
 *
 * Vision : VRAI feed type Twitter/Insta. Épuré au maximum :
 *   header simple + 3 tabs + grille de cards taille fixe cliquables.
 *   Plus de hero géant, plus de sidebar droite, plus de badges strip /
 *   editor pick / carrousels (feature creep anti-mobile-first).
 *
 * Layout :
 *   - Header sticky : titre + (desktop) "Partager" / (mobile) FAB
 *   - Tabs underline : Pour toi · Trending · Récents + icône filtres (Sheet)
 *   - Grille responsive : 1 col (375) / 2 (sm) / 3 (lg), plafonnée max-w-7xl
 *   - Infinite scroll (IntersectionObserver) au-delà de 12 cards
 *   - Click card → /riffs/:id (la card est un teaser, le reste est en détail)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { RiffCard } from '@/components/riffs/RiffCard';
import { ChallengeBanner } from '@/components/riffs/ChallengeBanner';
import {
  RiffFilters,
  EMPTY_FILTERS,
  activeFilterCount,
  type RiffFilterState,
} from '@/components/riffs/RiffFilters';
import { RiffEditor } from '@/components/riffs/RiffEditor';
import {
  COMMUNITY_RIFFS,
  sortFeedRiffs,
  difficultyToLevel,
  type FeedSort,
} from '@/lib/communityRiffs';
import { getTab } from '@/lib/tabsDatabase';
import { checkAndUnlockBadges, db, listMasteredRiffs } from '@/lib/db';
import { getBadgeMeta } from '@/lib/badges';
import { usePrefs } from '@/stores/prefsStore';
import { useAudio } from '@/hooks/useAudio';
import { useToast } from '@/hooks/useToast';

const PAGE_SIZE = 12;

/** Défi du jour — mock en attendant la table `daily_challenges` backend. */
const DAILY_CHALLENGE = {
  keyLabel: 'Mi mineur',
  keyShort: 'Em',
  bpmRange: '90-130',
  riffCount: 47,
  endsInHours: 5,
  title: 'Poste un riff en Mi mineur',
};

/** Onglets du feed (réseau social). 'friends' = à venir (fallback "pour toi"
 *  + toast), 'challenge' = filtre sur la tonalité du défi du jour. */
type RiffTab = 'trending' | 'recent' | 'friends' | 'challenge';
const TABS: { id: RiffTab; label: string }[] = [
  { id: 'trending', label: 'Tendances' },
  { id: 'recent', label: 'Récents' },
  { id: 'friends', label: 'Tes potes' },
  { id: 'challenge', label: 'Défi du jour' },
];

export function Riffs() {
  const navigate = useNavigate();
  const toast = useToast();
  const { playMidi } = useAudio();

  const [tab, setTab] = useState<RiffTab>('trending');
  const [filters, setFilters] = useState<RiffFilterState>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Likes (algo "Pour toi") + mastered (badge sur card)
  const likedRows = useLiveQuery(() => db.riffLikes.toArray(), []) ?? [];
  const likedIds = useMemo(() => likedRows.map((r) => r.id), [likedRows]);
  const masteredRows = useLiveQuery(() => listMasteredRiffs(), []) ?? [];
  const masteredMap = useMemo(
    () => new Map(masteredRows.map((m) => [m.id, m.masteredAt] as const)),
    [masteredRows]
  );
  const masteredIds = useMemo(() => masteredRows.map((m) => m.id), [masteredRows]);

  const userLevelPref = usePrefs((s) => s.level);
  const userLevelMapped =
    userLevelPref === 'beginner'
      ? 'beginner'
      : userLevelPref === 'advanced'
        ? 'advanced'
        : 'intermediate';

  // Check badges au mount (actions faites ailleurs)
  useEffect(() => {
    void (async () => {
      const newBadges = await checkAndUnlockBadges();
      for (const slug of newBadges) {
        const meta = getBadgeMeta(slug);
        if (meta) toast.success(`${meta.emoji} Badge débloqué : ${meta.title}`, { duration: 6000 });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Pattern frozenList : l'ordre du feed ne se recalcule QUE sur changement
   * de tab/filtres — un like ne doit pas re-shuffle les cards (UX Twitter).
   * On lit likedIds/masteredIds via refs (stale volontaire, hors deps).
   */
  const likedIdsRef = useRef<string[]>(likedIds);
  const masteredIdsRef = useRef<string[]>(masteredIds);
  const userLevelRef = useRef<typeof userLevelMapped>(userLevelMapped);
  useEffect(() => {
    likedIdsRef.current = likedIds;
    masteredIdsRef.current = masteredIds;
    userLevelRef.current = userLevelMapped;
  }, [likedIds, masteredIds, userLevelMapped]);

  const visible = useMemo(() => {
    let arr = [...COMMUNITY_RIFFS];

    // Onglet "Défi du jour" : ne garde que les riffs dans la tonalité du défi.
    if (tab === 'challenge') {
      arr = arr.filter((r) => r.key === DAILY_CHALLENGE.keyShort);
    }

    if (filters.genres.length > 0) {
      arr = arr.filter((r) => r.tags.some((t) => filters.genres.includes(t)));
    }
    if (filters.techniques.length > 0) {
      arr = arr.filter((r) => (r.techniques ?? []).some((t) => filters.techniques.includes(t)));
    }
    if (filters.levels.length > 0) {
      arr = arr.filter((r) => filters.levels.includes(difficultyToLevel(r.difficulty)));
    }
    if (filters.bpmMin > 40 || filters.bpmMax < 240) {
      arr = arr.filter((r) => {
        const tab = getTab(r.tabId);
        if (!tab) return false;
        return tab.tempo >= filters.bpmMin && tab.tempo <= filters.bpmMax;
      });
    }

    // Tri avancé du Sheet (override les tabs) sinon tri par tab
    if (filters.sort === 'bpm') {
      return arr.sort((a, b) => (getTab(a.tabId)?.tempo ?? 0) - (getTab(b.tabId)?.tempo ?? 0));
    }
    if (filters.sort === 'popular') return arr.sort((a, b) => b.baseLikes - a.baseLikes);
    if (filters.sort === 'recent') return arr.sort((a, b) => b.addedAt.localeCompare(a.addedAt));

    // 'trending'/'recent' → tri direct ; 'friends'/'challenge' → ordre "pour toi".
    const feedSort: FeedSort =
      tab === 'recent' ? 'recent' : tab === 'trending' ? 'trending' : 'for-you';
    return sortFeedRiffs(arr, feedSort, likedIdsRef.current, {
      masteredIds: masteredIdsRef.current,
      userLevel: userLevelRef.current,
      exploreWeight: 25,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, tab]);

  // Reset la pagination quand la liste change (tab/filtres)
  useEffect(() => {
    setLimit(PAGE_SIZE);
  }, [filters, tab]);

  const shown = visible.slice(0, limit);
  const hasMore = limit < visible.length;

  // Infinite scroll via IntersectionObserver sur une sentinelle
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setLimit((l) => l + PAGE_SIZE);
      },
      { rootMargin: '400px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore]);

  const activeFilters = activeFilterCount(filters);

  /** Preview rapide : joue les 8 premières notes du tab. */
  const handleListen = (riffId: string, tabId: string) => {
    const tab = getTab(tabId);
    if (!tab) return;
    toast.info(`▶ Preview ${tab.name}`);
    const flat = tab.measures.flatMap((m) => m).slice(0, 8);
    const openTuning = [40, 45, 50, 55, 59, 64];
    for (let i = 0; i < flat.length; i++) {
      window.setTimeout(() => {
        const fbString = 5 - flat[i].string;
        void playMidi(openTuning[fbString] + flat[i].fret);
      }, i * 200);
    }
  };

  const handleTab = (id: RiffTab) => {
    setTab(id);
    if (id === 'friends') toast.info('Le feed des potes arrive bientôt 👀');
  };

  /** "Relève le défi" → ouvre l'éditeur (pas de prefill key dispo encore). */
  const handleTakeChallenge = () => {
    setShareOpen(true);
    toast.info(`Filtre ${DAILY_CHALLENGE.keyLabel} appliqué — poste ton riff !`);
  };

  return (
    <>
      <SEO title="Riffs" description="Découvre et partage des riffs de guitare. Feed communautaire mobile-first — apprends les riffs cultes, partage les tiens." />
      {/* === Header sticky : eyebrow Communauté + titre + actions === */}
      <div className="sticky top-0 z-20 -mx-5 mb-4 border-b border-border/40 bg-bg/85 px-5 py-3 backdrop-blur-md md:-mx-12 md:px-12">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div>
            <div className="eyebrow">Communauté</div>
            <h1 className="display text-[30px] leading-none text-text">Riffs</h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Recherche"
              onClick={() => toast.info('Recherche bientôt disponible')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-text-muted transition-colors hover:border-gold-soft hover:text-text"
            >
              <Search size={20} />
            </button>
            <button
              type="button"
              aria-label="Poster un riff"
              onClick={() => setShareOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold-strong transition-transform active:scale-95"
            >
              <Plus size={22} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      {/* === Feed === */}
      <div className="mx-auto max-w-7xl pb-24 xl:pb-12">
        {/* Challenge banner (Riff du jour) */}
        <ChallengeBanner challenge={DAILY_CHALLENGE} onTakeChallenge={handleTakeChallenge} />

        {/* Tabs chips + bouton filtres (scroll horizontal mobile) */}
        <div className="-mx-5 mb-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:-mx-12 md:px-12 [&::-webkit-scrollbar]:hidden">
          <div className="flex items-center gap-2 whitespace-nowrap">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTab(t.id)}
                aria-pressed={tab === t.id}
                className={clsx(
                  'flex h-9 shrink-0 items-center rounded-full px-4 text-sm font-bold transition-colors',
                  tab === t.id
                    ? 'bg-gold text-bg'
                    : 'border border-border text-text-muted hover:border-gold-soft hover:text-text'
                )}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Filtrer"
              className={clsx(
                'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors',
                activeFilters > 0
                  ? 'border-gold bg-gold/15 text-gold'
                  : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
              )}
            >
              <SlidersHorizontal size={16} />
              {activeFilters > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 font-mono text-[9px] font-bold text-bg">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>

        {shown.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {shown.map((r, i) => {
              const tab = getTab(r.tabId);
              if (!tab) return null;
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(i, 8) * 0.02 }}
                >
                  <RiffCard
                    riff={r}
                    tab={tab}
                    masteredAt={masteredMap.get(r.id) ?? null}
                    onOpenDetail={() => navigate(`/riffs/${r.id}`)}
                    onListen={() => handleListen(r.id, r.tabId)}
                  />
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-surface-2 px-6 py-12 text-center">
            <p className="text-sm text-text-muted">Aucun riff ne correspond à tes filtres.</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-gold-soft px-4 text-sm font-medium text-gold hover:bg-gold/5"
            >
              Effacer les filtres
            </button>
          </div>
        )}

        {/* Sentinelle infinite scroll */}
        {hasMore && <div ref={sentinelRef} className="h-10" aria-hidden />}
      </div>

      {/* === Mobile FAB "Partager" === */}
      <button
        type="button"
        onClick={() => setShareOpen(true)}
        aria-label="Partager mon riff"
        className="fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold-strong transition-transform active:scale-95 md:hidden"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom) + 1rem)' }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* === Sheet filtres === */}
      <RiffFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
        resultCount={visible.length}
      />

      {/* === Éditeur de publication === */}
      <RiffEditor open={shareOpen} onClose={() => setShareOpen(false)} onPublished={() => {}} />
    </>
  );
}
