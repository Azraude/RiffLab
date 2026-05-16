import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  Filter,
  Heart,
  Play,
  Plus,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { TabPlayer } from '@/components/tabs/TabPlayer';
import {
  COMMUNITY_RIFFS,
  ALL_RIFF_TAGS,
  getCurrentCommunityRiff,
  getCommunityRiff,
  type CommunityRiff,
  type RiffDifficulty,
  type RiffTag,
} from '@/lib/communityRiffs';
import { getTab } from '@/lib/tabsDatabase';
import {
  isRiffBookmarked,
  toggleRiffBookmark,
  listBookmarkedRiffIds,
  getUserRating,
  setUserRating,
  isRiffLiked,
  toggleRiffLike,
} from '@/lib/db';

type DifficultyFilter = 'all' | RiffDifficulty;
type SortMode = 'popular' | 'recent' | 'bookmarked';

export function Riffs() {
  const [difficulty, setDifficulty] = useState<DifficultyFilter>('all');
  const [tag, setTag] = useState<RiffTag | 'all'>('all');
  const [sort, setSort] = useState<SortMode>('popular');
  const [openRiffId, setOpenRiffId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const featured = useMemo(() => getCurrentCommunityRiff(), []);
  const bookmarkedIds = useLiveQuery(() => listBookmarkedRiffIds(), []) ?? [];
  const bookmarkedSet = useMemo(() => new Set(bookmarkedIds), [bookmarkedIds]);

  const filtered = useMemo(() => {
    let list = COMMUNITY_RIFFS.slice();
    if (difficulty !== 'all') list = list.filter((r) => r.difficulty === difficulty);
    if (tag !== 'all') list = list.filter((r) => r.tags.includes(tag));
    if (sort === 'popular') list.sort((a, b) => b.baseLikes - a.baseLikes);
    else if (sort === 'recent')
      list.sort((a, b) => (a.addedAt < b.addedAt ? 1 : -1));
    else if (sort === 'bookmarked')
      list = list.filter((r) => bookmarkedSet.has(r.id));
    return list;
  }, [difficulty, tag, sort, bookmarkedSet]);

  return (
    <>
      <PageHeader
        title="Riffs"
        subtitle="Le hub communautaire — joue les riffs cultes, garde tes favoris, partage les tiens."
      >
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className="group relative hidden h-10 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-semibold text-bg shadow-gold-strong transition-all hover:-translate-y-px md:inline-flex"
        >
          <span className="pointer-events-none absolute inset-y-0 -left-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-all duration-700 group-hover:left-full" />
          <span className="relative inline-flex items-center gap-2">
            <Plus size={15} />
            Partager mon riff
          </span>
        </button>
      </PageHeader>

      {/* Featured banner */}
      {featured && (
        <FeaturedRiff
          riff={featured.riff}
          onOpen={() => setOpenRiffId(featured.riff.id)}
        />
      )}

      {/* Filtres */}
      <div className="mt-8 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-text-soft">
          <Filter size={12} /> Filtres
        </div>

        {/* Difficulty */}
        <div className="-mx-2 overflow-x-auto px-2 pb-1">
          <div className="flex gap-2">
            <FilterChip
              active={difficulty === 'all'}
              onClick={() => setDifficulty('all')}
            >
              Tous niveaux
            </FilterChip>
            {([1, 2, 3, 4, 5] as RiffDifficulty[]).map((d) => (
              <FilterChip
                key={d}
                active={difficulty === d}
                onClick={() => setDifficulty(d)}
              >
                {'⭐'.repeat(d)}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="-mx-2 overflow-x-auto px-2 pb-1">
          <div className="flex gap-2">
            <FilterChip active={tag === 'all'} onClick={() => setTag('all')}>
              Tous tags
            </FilterChip>
            {ALL_RIFF_TAGS.map((t) => (
              <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>
                {t}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Sort */}
        <div className="-mx-2 overflow-x-auto px-2 pb-1">
          <div className="flex gap-2">
            <FilterChip
              active={sort === 'popular'}
              onClick={() => setSort('popular')}
            >
              Populaires
            </FilterChip>
            <FilterChip
              active={sort === 'recent'}
              onClick={() => setSort('recent')}
            >
              Récents
            </FilterChip>
            <FilterChip
              active={sort === 'bookmarked'}
              onClick={() => setSort('bookmarked')}
            >
              <Bookmark size={12} className="mr-1" />
              Mes favoris
            </FilterChip>
          </div>
        </div>
      </div>

      {/* Count */}
      <div className="mt-5 mb-3 text-xs text-text-soft">
        {filtered.length} riff{filtered.length > 1 ? 's' : ''}
      </div>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <RiffTile
            key={r.id}
            riff={r}
            bookmarked={bookmarkedSet.has(r.id)}
            onOpen={() => setOpenRiffId(r.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-text-soft">
          Aucun riff ne correspond à ces filtres.
        </p>
      )}

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => setShareOpen(true)}
        aria-label="Partager mon riff"
        className="fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold-strong active:scale-95 md:hidden"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom) + 1rem)' }}
      >
        <Plus size={26} strokeWidth={2.5} />
      </button>

      {/* Riff detail drawer */}
      <RiffDetailDrawer
        riffId={openRiffId}
        onClose={() => setOpenRiffId(null)}
      />

      {/* Share modal placeholder Phase 5 */}
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}

// ─── Featured riff banner ─────────────────────────────────────────────

function FeaturedRiff({
  riff,
  onOpen,
}: {
  riff: CommunityRiff;
  onOpen: () => void;
}) {
  const tab = getTab(riff.tabId);
  if (!tab) return null;
  return (
    <Card glow className="mt-2">
      <div className="flex items-start gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
          <Sparkles size={11} /> Featured
        </span>
        <span className="text-[10px] uppercase tracking-wider text-text-soft">
          Riff du moment
        </span>
      </div>
      <h2 className="display mt-2 text-display-sm md:text-display-md">
        {tab.name}
        {tab.artist && (
          <span className="ml-2 font-sans text-base font-normal text-text-muted md:text-lg">
            — {tab.artist}
          </span>
        )}
      </h2>
      <div className="mt-2 flex items-center gap-2 text-xs text-text-soft">
        <span className="font-mono text-gold-soft">{riff.contributor}</span>
        <span>·</span>
        <span>{'⭐'.repeat(riff.difficulty)}</span>
        <span>·</span>
        <span>❤ {riff.baseLikes}</span>
        <span>·</span>
        <span className="font-mono text-gold">{riff.baseRating.toFixed(1)}/5</span>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 text-sm font-semibold text-bg shadow-gold transition-all hover:-translate-y-px"
      >
        <Play size={16} fill="currentColor" /> Ouvrir le riff
      </button>
    </Card>
  );
}

// ─── Riff tile (grid) ─────────────────────────────────────────────────

function RiffTile({
  riff,
  bookmarked,
  onOpen,
}: {
  riff: CommunityRiff;
  bookmarked: boolean;
  onOpen: () => void;
}) {
  const tab = getTab(riff.tabId);
  if (!tab) return null;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleRiffBookmark(riff.id);
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border border-border bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-gold-soft"
    >
      {/* Bookmark btn top-right */}
      <span
        onClick={handleBookmark}
        role="button"
        tabIndex={0}
        aria-label={bookmarked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        className={clsx(
          'absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border transition-colors',
          bookmarked
            ? 'border-gold bg-gold/15 text-gold'
            : 'border-border bg-surface-2 text-text-soft hover:border-gold-soft hover:text-gold'
        )}
      >
        <Bookmark size={13} fill={bookmarked ? 'currentColor' : 'none'} />
      </span>
      <h3 className="display pr-8 text-lg leading-tight">{tab.name}</h3>
      {tab.artist && <p className="text-xs text-text-muted">{tab.artist}</p>}
      <div className="mt-1 flex flex-wrap gap-1.5">
        {riff.tags.slice(0, 3).map((t) => (
          <span key={t} className="chip text-[9px]">{t}</span>
        ))}
      </div>
      <div className="mt-auto flex w-full items-center justify-between gap-2 pt-3 text-xs text-text-soft">
        <span className="font-mono text-gold-soft">{riff.contributor}</span>
        <span className="font-mono">{'⭐'.repeat(riff.difficulty)}</span>
      </div>
      <div className="flex w-full items-center justify-between text-[10px] text-text-soft">
        <span>❤ {riff.baseLikes}</span>
        <span className="font-mono text-gold">{riff.baseRating.toFixed(1)}/5</span>
      </div>
    </button>
  );
}

// ─── Detail drawer (TabPlayer + actions) ──────────────────────────────

function RiffDetailDrawer({
  riffId,
  onClose,
}: {
  riffId: string | null;
  onClose: () => void;
}) {
  const data = useMemo(() => (riffId ? getCommunityRiff(riffId) : null), [riffId]);
  const liked = useLiveQuery(
    () => (riffId ? isRiffLiked(riffId) : Promise.resolve(false)),
    [riffId]
  );
  const bookmarked = useLiveQuery(
    () => (riffId ? isRiffBookmarked(riffId) : Promise.resolve(false)),
    [riffId]
  );
  const userRating = useLiveQuery(
    () => (riffId ? getUserRating(riffId) : Promise.resolve(null)),
    [riffId]
  );

  return (
    <Dialog.Root open={riffId !== null} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {riffId && data && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
                <motion.div
                  className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-surface shadow-2xl md:max-w-2xl md:rounded-3xl md:border"
                  initial={{ y: '100%', opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: '100%', opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                >
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer"
                    className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:text-text"
                  >
                    <X size={16} />
                  </button>
                  <div className="px-5 py-6 md:px-8 md:py-8">
                    {/* Header */}
                    <div className="eyebrow !text-gold-soft">
                      {'⭐'.repeat(data.riff.difficulty)} · {data.riff.tags.join(' · ')}
                    </div>
                    <h2 className="display mt-2 text-display-md">{data.tab.name}</h2>
                    {data.tab.artist && (
                      <p className="mt-1 text-text-muted">{data.tab.artist}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3 text-xs text-text-soft">
                      <span className="font-mono text-gold-soft">{data.riff.contributor}</span>
                      <span>· ajouté {data.riff.addedAt}</span>
                    </div>

                    {/* Tab + player */}
                    <div className="mt-6">
                      <TabPlayer tab={data.tab} />
                    </div>

                    {/* Actions row */}
                    <div className="mt-6 grid gap-2 sm:grid-cols-3">
                      <button
                        type="button"
                        onClick={() => toggleRiffLike(data.riff.id)}
                        className={clsx(
                          'inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors',
                          liked
                            ? 'border-danger/40 bg-danger/15 text-danger'
                            : 'border-border bg-surface-2 text-text hover:border-danger/40 hover:text-danger'
                        )}
                      >
                        <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
                        {liked ? 'Aimé' : "J'aime"}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRiffBookmark(data.riff.id)}
                        className={clsx(
                          'inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition-colors',
                          bookmarked
                            ? 'border-gold bg-gold/15 text-gold'
                            : 'border-border bg-surface-2 text-text hover:border-gold-soft'
                        )}
                      >
                        <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
                        {bookmarked ? 'Sauvé' : 'Sauver'}
                      </button>
                      <RatingStars
                        current={userRating ?? null}
                        onRate={(n) => setUserRating(data.riff.id, n)}
                      />
                    </div>

                    {/* Stats */}
                    <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-border bg-surface-2 p-4 text-center text-xs">
                      <div>
                        <div className="label-small">Likes</div>
                        <div className="display mt-1 text-display-sm text-gold">
                          {data.riff.baseLikes + (liked ? 1 : 0)}
                        </div>
                      </div>
                      <div>
                        <div className="label-small">Note moyenne</div>
                        <div className="display mt-1 text-display-sm text-gold">
                          {data.riff.baseRating.toFixed(1)}
                          <span className="text-sm text-text-soft">/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

// ─── Rating stars (1-5, click pour set, re-click pour clear) ──────────

function RatingStars({
  current,
  onRate,
}: {
  current: number | null;
  onRate: (n: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div
      className="inline-flex h-11 items-center justify-center gap-1 rounded-xl border border-border bg-surface-2 px-3"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover ?? current ?? 0) >= n;
        return (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onClick={() => onRate(n)}
            aria-label={`Noter ${n}/5`}
            className={clsx(
              'h-7 w-7 transition-all',
              filled ? 'text-gold-bright' : 'text-text-soft hover:text-gold-soft'
            )}
          >
            <Star
              size={18}
              fill={filled ? 'currentColor' : 'none'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

// ─── Filter chip ───────────────────────────────────────────────────────

function FilterChip({
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
        'inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-xs font-medium transition-colors',
        active
          ? 'border-gold bg-gold text-bg'
          : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
      )}
    >
      {children}
    </button>
  );
}

// ─── Share modal (placeholder Phase 5) ────────────────────────────────

function ShareModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild aria-describedby={undefined}>
              <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                <motion.div
                  className="w-[min(440px,92vw)] rounded-3xl border border-border-gold bg-surface p-7 shadow-2xl"
                  initial={{ opacity: 0, scale: 0.94, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 12 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                >
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Fermer"
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-muted hover:text-text"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border-gold bg-gold/10 text-gold">
                    <Sparkles size={22} />
                  </div>
                  <Dialog.Title className="display mt-4 text-display-sm">
                    Bientôt disponible — Phase 5
                  </Dialog.Title>
                  <p className="mt-2 text-sm text-text-muted">
                    Le partage public de riffs arrive avec la Phase 5 (auth +
                    cloud). Tu pourras uploader tes propres tabs avec audio,
                    et participer à la communauté.
                  </p>
                  <p className="mt-2 text-sm text-text-muted">
                    En attendant : bookmarks et ratings sont locaux uniquement,
                    ils vivent dans Dexie sur ton appareil.
                  </p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-b from-gold-bright to-gold font-semibold text-bg hover:-translate-y-px"
                  >
                    OK, j'attendrai
                  </button>
                </motion.div>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
