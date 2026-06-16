/**
 * /riffs — feed social refonte sess 27 Phase 1.
 *
 * Layout :
 *  - Container max-w-3xl mx-auto centré desktop
 *  - Header sticky avec titre + bouton "+ Partager mon riff"
 *  - Tabs underline-style : Pour toi / Trending / Récents
 *  - Bouton "🔍 Filtrer · N" qui ouvre Sheet de filtres avancés
 *  - Feed vertical de RiffCard
 *  - FAB mobile "+ Partager"
 *  - Modal RiffTabModal au click "Voir le tab"
 *  - ShareDrawer au click "Partager" (réutilise composant sess 24)
 *
 * RiffDetailDrawer ancien gardé en fallback : sera remplacé par la page
 * détail /riffs/:id en Phase 3.
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, SlidersHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { RiffCard } from '@/components/riffs/RiffCard';
import { RiffFilters, EMPTY_FILTERS, activeFilterCount, type RiffFilterState } from '@/components/riffs/RiffFilters';
import { RiffTabModal } from '@/components/riffs/RiffTabModal';
import { LearnRiffMode } from '@/components/riffs/LearnRiffMode';
import { RiffEditor } from '@/components/riffs/RiffEditor';
import { BadgesStrip } from '@/components/riffs/BadgesStrip';
import { RiffsSidebarRight } from '@/components/riffs/RiffsSidebarRight';
import { EditorPickBanner } from '@/components/riffs/EditorPickBanner';
import { ShareDrawer } from '@/components/share/ShareDrawer';
import {
  COMMUNITY_RIFFS,
  sortFeedRiffs,
  difficultyToLevel,
  type CommunityRiff,
  type FeedSort,
} from '@/lib/communityRiffs';
import { getTab } from '@/lib/tabsDatabase';
import { checkAndUnlockBadges, db, listMasteredRiffs } from '@/lib/db';
import { getBadgeMeta } from '@/lib/badges';
import { usePrefs } from '@/stores/prefsStore';
import { useEffect } from 'react';
import { useAudio } from '@/hooks/useAudio';
import { useToast } from '@/hooks/useToast';

export function Riffs() {
  const navigate = useNavigate();
  const [sort, setSort] = useState<FeedSort | 'following'>('for-you');
  const [filters, setFilters] = useState<RiffFilterState>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [tabModalRiff, setTabModalRiff] = useState<CommunityRiff | null>(null);
  const [shareDrawerRiff, setShareDrawerRiff] = useState<CommunityRiff | null>(null);
  const [learnRiff, setLearnRiff] = useState<CommunityRiff | null>(null);

  // Liste des riffs likés (pour l'algo "for you")
  const likedRows = useLiveQuery(() => db.riffLikes.toArray(), []) ?? [];
  const likedIds = useMemo(() => likedRows.map((r) => r.id), [likedRows]);
  // Mastered riffs map pour afficher le badge sur les cards
  const masteredRows = useLiveQuery(() => listMasteredRiffs(), []) ?? [];
  const masteredMap = useMemo(
    () => new Map(masteredRows.map((m) => [m.id, m.masteredAt] as const)),
    [masteredRows]
  );
  const masteredIds = useMemo(() => masteredRows.map((m) => m.id), [masteredRows]);
  // Pour toi smart : adapte au niveau du user (Plan Duolingo)
  const userLevelPref = usePrefs((s) => s.level);
  const userLevelMapped =
    userLevelPref === 'beginner'
      ? 'beginner'
      : userLevelPref === 'advanced'
        ? 'advanced'
        : 'intermediate';

  // Check badges au mount (cas où user a fait des actions ailleurs)
  useEffect(() => {
    void (async () => {
      const newBadges = await checkAndUnlockBadges();
      for (const slug of newBadges) {
        const meta = getBadgeMeta(slug);
        if (meta) toast.success(`${meta.emoji} Badge débloqué : ${meta.title}`, { duration: 6000 });
      }
    })();
    // Voluntary : ne re-run pas à chaque change de toast
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { playMidi } = useAudio();
  const toast = useToast();

  // Apply filtres + tri
  const visible = useMemo(() => {
    let arr = [...COMMUNITY_RIFFS];

    // Genres
    if (filters.genres.length > 0) {
      arr = arr.filter((r) => r.tags.some((t) => filters.genres.includes(t)));
    }
    // Techniques
    if (filters.techniques.length > 0) {
      arr = arr.filter((r) =>
        (r.techniques ?? []).some((t) => filters.techniques.includes(t))
      );
    }
    // Levels
    if (filters.levels.length > 0) {
      arr = arr.filter((r) => filters.levels.includes(difficultyToLevel(r.difficulty)));
    }
    // BPM range — on filtre via le tab associé
    if (filters.bpmMin > 40 || filters.bpmMax < 240) {
      arr = arr.filter((r) => {
        const tab = getTab(r.tabId);
        if (!tab) return false;
        return tab.tempo >= filters.bpmMin && tab.tempo <= filters.bpmMax;
      });
    }

    // Sort
    if (filters.sort === 'bpm') {
      arr.sort((a, b) => {
        const ta = getTab(a.tabId)?.tempo ?? 0;
        const tb = getTab(b.tabId)?.tempo ?? 0;
        return ta - tb;
      });
      return arr;
    }
    if (filters.sort === 'popular') return arr.sort((a, b) => b.baseLikes - a.baseLikes);
    if (filters.sort === 'recent') return arr.sort((a, b) => b.addedAt.localeCompare(a.addedAt));

    // 'following' tab : pas de seed local (les riffs Supabase users seront
    // affichés en Phase 3 via getFeedFollowing). Pour l'instant, on
    // affiche un empty state custom.
    if (sort === 'following') return arr.filter(() => false);

    // 'relevance' → utilise sortFeedRiffs avec contexte enrichi (Phase 5)
    return sortFeedRiffs(arr, sort, likedIds, {
      masteredIds,
      userLevel: userLevelMapped,
      exploreWeight: 25,
    });
  }, [filters, sort, likedIds, masteredIds, userLevelMapped]);

  const activeFilters = activeFilterCount(filters);

  /**
   * Listen quick : joue les 4 premières notes du tab pour preview.
   * Le vrai player sync arrive Phase 2.
   */
  const handleListen = async (riff: CommunityRiff) => {
    const tab = getTab(riff.tabId);
    if (!tab) return;
    toast.info(`▶ Preview ${tab.name}`);
    const flat = tab.measures.flatMap((m) => m).slice(0, 8);
    // Joue 8 notes à intervalle 200ms — preview rapide
    for (let i = 0; i < flat.length; i++) {
      window.setTimeout(() => {
        // Convertit string tab (0=high) → string fretboard (0=low) puis MIDI
        const fbString = 5 - flat[i].string;
        // E2=40, A2=45, D3=50, G3=55, B3=59, E4=64 — standard tuning
        const openTuning = [40, 45, 50, 55, 59, 64];
        const midi = openTuning[fbString] + flat[i].fret;
        void playMidi(midi);
      }, i * 200);
    }
  };

  const handleLearn = (riff: CommunityRiff) => {
    setLearnRiff(riff);
  };

  const handleOpenDetail = (riff: CommunityRiff) => {
    navigate(`/riffs/${riff.id}`);
  };

  return (
    <>
      {/* === Page header sticky === */}
      <div className="sticky top-0 z-20 -mx-5 mb-5 border-b border-border/40 bg-bg/85 px-5 py-3 backdrop-blur-md md:-mx-12 md:px-12">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="display text-display-md leading-tight">Riffs</h1>
            <p className="hidden text-xs text-text-muted sm:block">
              Le feed des riffs — joue, like, sauve, apprends
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="group relative hidden h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-gold-bright to-gold px-4 text-sm font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px md:inline-flex"
          >
            <Plus size={15} /> Partager mon riff
          </button>
        </div>
      </div>

      {/* === Layout 3 colonnes (sess 29 magazine social) ===
          Mobile : 1 col stack vertical (sidebar right en bas)
          xl ≥1280px : 2 cols : feed + sidebar right
          La sidebar gauche vit dans <Layout> (sidebar nav globale). */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-8">
        {/* === Main feed === */}
        <main className="min-w-0">
          {/* Tabs underline + bouton filtres */}
          <div className="mb-5 flex items-end justify-between border-b border-border">
            <div className="-mb-px flex gap-1 overflow-x-auto">
              <UnderlineTab active={sort === 'for-you'} onClick={() => setSort('for-you')}>
                Pour toi
              </UnderlineTab>
              <UnderlineTab active={sort === 'following'} onClick={() => setSort('following')}>
                Suivis
              </UnderlineTab>
              <UnderlineTab active={sort === 'trending'} onClick={() => setSort('trending')}>
                Trending
              </UnderlineTab>
              <UnderlineTab active={sort === 'recent'} onClick={() => setSort('recent')}>
                Récents
              </UnderlineTab>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={clsx(
                'mb-2 inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
                activeFilters > 0
                  ? 'border-gold bg-gold/15 text-gold'
                  : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
              )}
            >
              <SlidersHorizontal size={13} />
              Filtrer
              {activeFilters > 0 && (
                <span className="ml-0.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 font-mono text-[10px] font-bold text-bg">
                  {activeFilters}
                </span>
              )}
            </button>
          </div>

          {/* Editor's pick banner (sticky en haut si active) */}
          <EditorPickBanner />

          {/* Badges strip (juste au-dessus du feed) */}
          <div className="mb-4">
            <BadgesStrip />
          </div>

          {/* Feed — grille 2 cols desktop, 1 col mobile */}
          <div className="grid gap-4 pb-24 md:grid-cols-2 md:pb-12">
            <AnimatePresence mode="popLayout">
              {visible.map((r) => {
                const tab = getTab(r.tabId);
                if (!tab) return null;
                return (
                  <motion.div
                    key={r.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    <RiffCard
                      riff={r}
                      tab={tab}
                      compact
                      masteredAt={masteredMap.get(r.id) ?? null}
                      onListen={() => void handleListen(r)}
                      onViewTab={() => setTabModalRiff(r)}
                      onLearn={() => handleLearn(r)}
                      onOpenDetail={() => handleOpenDetail(r)}
                      onShare={() => setShareDrawerRiff(r)}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty state Suivis */}
            {sort === 'following' && visible.length === 0 && (
              <div className="md:col-span-2 rounded-2xl border border-border bg-surface-2 px-6 py-12 text-center">
                <p className="text-sm text-text-muted">
                  Tu ne suis personne pour l'instant. Va explorer les profils
                  via les onglets « Pour toi » ou « Trending » et clique sur
                  les avatars pour suivre des riffeurs.
                </p>
              </div>
            )}

            {/* Empty state filtres */}
            {sort !== 'following' && visible.length === 0 && (
              <div className="md:col-span-2 rounded-2xl border border-border bg-surface-2 px-6 py-12 text-center">
                <p className="text-sm text-text-muted">
                  Aucun riff ne correspond à tes filtres.
                </p>
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-gold-soft px-4 text-sm font-medium text-gold hover:bg-gold/5"
                >
                  Effacer les filtres
                </button>
              </div>
            )}
          </div>
        </main>

        {/* === Sidebar droite (Riff du jour / Top semaine / Collections / À suivre / Battle) === */}
        <RiffsSidebarRight />
      </div>

      {/* === Mobile FAB === */}
      <button
        type="button"
        onClick={() => setShareOpen(true)}
        aria-label="Partager mon riff"
        className="fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold-strong transition-transform active:scale-95 md:hidden"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom) + 1rem)' }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* === Modals & drawers === */}
      <RiffFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onChange={setFilters}
        resultCount={visible.length}
      />

      <RiffTabModal
        open={!!tabModalRiff}
        onClose={() => setTabModalRiff(null)}
        riff={tabModalRiff}
        tab={tabModalRiff ? getTab(tabModalRiff.tabId) ?? null : null}
        onListen={() => tabModalRiff && void handleListen(tabModalRiff)}
        onLearn={() => {
          if (tabModalRiff) {
            const r = tabModalRiff;
            setTabModalRiff(null);
            handleLearn(r);
          }
        }}
        onShare={() => {
          if (tabModalRiff) {
            const r = tabModalRiff;
            setShareDrawerRiff(r);
            setTabModalRiff(null);
          }
        }}
      />

      <ShareDrawer
        open={!!shareDrawerRiff}
        onOpenChange={(o) => !o && setShareDrawerRiff(null)}
        item={{
          type: 'riff',
          title: shareDrawerRiff ? getTab(shareDrawerRiff.tabId)?.name ?? 'Riff' : '',
          url: shareDrawerRiff
            ? `${typeof window !== 'undefined' ? window.location.origin : ''}/riffs/${shareDrawerRiff.id}`
            : '',
        }}
      />

      {/* === Éditeur de création (Phase 4) === */}
      <RiffEditor
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onPublished={() => {
          // Future : navigate vers /riffs/perso ou refresh feed
        }}
      />

      {/* Mode Apprendre full-screen */}
      <LearnRiffMode
        open={!!learnRiff}
        onClose={() => setLearnRiff(null)}
        riff={learnRiff}
        tab={learnRiff ? getTab(learnRiff.tabId) ?? null : null}
      />
    </>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function UnderlineTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'relative h-11 px-4 text-sm font-semibold transition-colors',
        active ? 'text-text' : 'text-text-muted hover:text-text'
      )}
    >
      {children}
      {active && (
        <motion.div
          layoutId="riffsTab"
          className="absolute inset-x-0 bottom-0 h-0.5 bg-gold"
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        />
      )}
    </button>
  );
}

