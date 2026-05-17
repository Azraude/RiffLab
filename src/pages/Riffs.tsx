/**
 * /riffs — feed social des riffs guitare (session 21 refonte).
 *
 * Layout Instagram-style :
 * - Sort tabs : Pour toi (algo basé likes user) / Trending / Récents
 * - Tags chips scrollables horizontaux
 * - Feed vertical : 1 RiffFeedCard par post (avatar + caption + tab
 *   preview inline + actions row Play/Like/Comments/Bookmark/Share)
 * - FAB "Partager mon riff" mobile + bouton desktop dans header
 * - Click card → RiffDetailDrawer (TabPlayer full + actions + stats)
 *
 * Note : la pagination 10x10 du brief n'est pas implémentée (on a juste
 * 10 riffs en seed). À ajouter quand le backend Phase 5 livre plus.
 */
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bookmark,
  Heart,
  MessageCircle,
  Play,
  Plus,
  Share2,
  Sparkles,
  Star,
  User,
  X,
} from 'lucide-react';
import clsx from 'clsx';
import { PageHeader } from '@/components/ui/PageHeader';
import { TabPlayer } from '@/components/tabs/TabPlayer';
import { TabReader } from '@/components/tabs/TabReader';
import {
  COMMUNITY_RIFFS,
  ALL_RIFF_TAGS,
  formatRelativeDate,
  sortFeedRiffs,
  getCommunityRiff,
  type CommunityRiff,
  type RiffTag,
  type FeedSort,
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
  db,
} from '@/lib/db';

export function Riffs() {
  const [sort, setSort] = useState<FeedSort>('for-you');
  const [tag, setTag] = useState<RiffTag | 'all'>('all');
  const [openRiffId, setOpenRiffId] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const bookmarkedIds = useLiveQuery(() => listBookmarkedRiffIds(), []) ?? [];
  const bookmarkedSet = useMemo(() => new Set(bookmarkedIds), [bookmarkedIds]);
  // Liste des riffs likés (pour l'algo "for you")
  const likedRows = useLiveQuery(() => db.riffLikes.toArray(), []) ?? [];
  const likedIds = useMemo(() => likedRows.map((r) => r.id), [likedRows]);

  const sorted = useMemo(() => {
    const filtered =
      tag === 'all'
        ? COMMUNITY_RIFFS
        : COMMUNITY_RIFFS.filter((r) => r.tags.includes(tag));
    return sortFeedRiffs(filtered, sort, likedIds);
  }, [sort, tag, likedIds]);

  return (
    <>
      <PageHeader
        title="Riffs"
        subtitle="Le feed communautaire — joue, like, sauve, partage. Les meilleurs riffs au quotidien."
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

      {/* Sort tabs */}
      <div className="sticky top-0 z-20 -mx-5 mb-4 border-b border-border bg-bg/85 px-5 py-3 backdrop-blur-md md:-mx-12 md:px-12">
        <div className="flex gap-2">
          <SortTab active={sort === 'for-you'} onClick={() => setSort('for-you')}>
            Pour toi
          </SortTab>
          <SortTab active={sort === 'trending'} onClick={() => setSort('trending')}>
            Trending
          </SortTab>
          <SortTab active={sort === 'recent'} onClick={() => setSort('recent')}>
            Récents
          </SortTab>
        </div>

        {/* Tag chips */}
        <div className="-mx-5 mt-3 overflow-x-auto px-5 pb-1 md:-mx-12 md:px-12">
          <div className="flex gap-2">
            <FilterChip active={tag === 'all'} onClick={() => setTag('all')}>
              Tous
            </FilterChip>
            {ALL_RIFF_TAGS.map((t) => (
              <FilterChip key={t} active={tag === t} onClick={() => setTag(t)}>
                #{t}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="mx-auto max-w-2xl space-y-5 pb-24 md:pb-8">
        {sorted.map((r) => (
          <RiffFeedCard
            key={r.id}
            riff={r}
            bookmarked={bookmarkedSet.has(r.id)}
            onOpen={() => setOpenRiffId(r.id)}
          />
        ))}
        {sorted.length === 0 && (
          <p className="mt-12 text-center text-text-soft">
            Aucun riff ne correspond à ce filtre.
          </p>
        )}
      </div>

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

      <RiffDetailDrawer
        riffId={openRiffId}
        onClose={() => setOpenRiffId(null)}
      />
      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} />
    </>
  );
}

// ─── Feed card (post Instagram-style) ──────────────────────────────────

function RiffFeedCard({
  riff,
  bookmarked,
  onOpen,
}: {
  riff: CommunityRiff;
  bookmarked: boolean;
  onOpen: () => void;
}) {
  const tab = getTab(riff.tabId);
  const liked = useLiveQuery(() => isRiffLiked(riff.id), [riff.id]);
  if (!tab) return null;

  const stopBubble = (fn: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn();
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface transition-colors hover:border-gold-soft/50">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2.5">
          <Avatar name={riff.contributor} />
          <div className="leading-tight">
            <div className="font-mono text-sm font-semibold text-text">
              {riff.contributor}
            </div>
            <div className="text-[10px] text-text-soft">
              {formatRelativeDate(riff.addedAt)} · {'⭐'.repeat(riff.difficulty)}
            </div>
          </div>
        </div>
      </header>

      {/* Caption */}
      {riff.caption && (
        <p className="px-4 pt-1 text-sm text-text leading-relaxed">
          {riff.caption}
        </p>
      )}

      {/* Tags */}
      <div className="px-4 pt-2 flex flex-wrap gap-1.5">
        {riff.tags.map((t) => (
          <span
            key={t}
            className="rounded-md bg-gold/10 px-2 py-0.5 font-mono text-[10px] text-gold-soft"
          >
            #{t}
          </span>
        ))}
      </div>

      {/* Tab preview inline (cliquable, ouvre drawer) */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ouvrir ${tab.name}`}
        className="mt-3 block w-full border-y border-border bg-surface-2 px-3 py-3 text-left transition-colors hover:bg-surface-2/80"
      >
        <div className="mb-1 flex items-center justify-between gap-2">
          <div>
            <div className="display text-base text-text">{tab.name}</div>
            {tab.artist && (
              <div className="text-xs text-text-muted">{tab.artist}</div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[10px] text-text-soft">
            <span className="font-mono">{tab.tempo} BPM</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-bg">
              <Play size={12} fill="currentColor" />
            </span>
          </div>
        </div>
        <div className="-mx-1 max-h-[120px] overflow-hidden">
          <TabReader tab={tab} lineHeight={14} beatWidth={12} />
        </div>
      </button>

      {/* Actions row */}
      <div className="flex items-center justify-between gap-1 px-3 py-2">
        <div className="flex items-center gap-0">
          <ActionButton
            label={liked ? 'Aimé' : "J'aime"}
            count={riff.baseLikes + (liked ? 1 : 0)}
            active={!!liked}
            activeColor="danger"
            onClick={stopBubble(() => void toggleRiffLike(riff.id))}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </ActionButton>
          <ActionButton
            label="Commentaires"
            count={riff.commentsCount ?? 0}
            onClick={stopBubble(onOpen)}
          >
            <MessageCircle size={18} />
          </ActionButton>
          <ActionButton
            label={bookmarked ? 'Sauvegardé' : 'Sauvegarder'}
            active={bookmarked}
            activeColor="gold"
            onClick={stopBubble(() => void toggleRiffBookmark(riff.id))}
          >
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          </ActionButton>
        </div>
        <ActionButton
          label="Partager"
          onClick={stopBubble(async () => {
            const shareData = {
              title: `${tab.name} — RiffLab`,
              text: `${riff.contributor} : ${riff.caption ?? tab.name}`,
              url: typeof window !== 'undefined' ? window.location.href : '',
            };
            if (navigator.share) {
              await navigator.share(shareData).catch(() => undefined);
            } else if (navigator.clipboard) {
              await navigator.clipboard.writeText(shareData.url);
            }
          })}
        >
          <Share2 size={18} />
        </ActionButton>
      </div>
    </article>
  );
}

// ─── Avatar (initials in gold circle) ──────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initial = (name.replace('@', '')[0] ?? '?').toUpperCase();
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-sm font-bold text-gold"
      aria-hidden="true"
    >
      {initial === '?' ? <User size={16} /> : initial}
    </div>
  );
}

// ─── Action button (icon + optional count) ─────────────────────────────

function ActionButton({
  children,
  label,
  count,
  active,
  activeColor = 'gold',
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  activeColor?: 'gold' | 'danger';
  onClick: (e: React.MouseEvent) => void;
}) {
  const activeCls =
    activeColor === 'danger' ? 'text-danger' : 'text-gold-bright';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        'inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors hover:bg-surface-2',
        active ? activeCls : 'text-text-muted hover:text-text'
      )}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="font-mono text-xs">{count}</span>
      )}
    </button>
  );
}

// ─── Sort tab ──────────────────────────────────────────────────────────

function SortTab({
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
        'inline-flex h-9 items-center rounded-full px-4 text-sm font-semibold transition-colors',
        active
          ? 'bg-gold text-bg shadow-gold'
          : 'bg-surface-2 text-text-muted hover:text-text'
      )}
    >
      {children}
    </button>
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
        'inline-flex h-8 shrink-0 items-center rounded-full border px-3 text-xs font-medium transition-colors',
        active
          ? 'border-gold bg-gold/15 text-gold-bright'
          : 'border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text'
      )}
    >
      {children}
    </button>
  );
}

// ─── Detail drawer (TabPlayer + actions + stats) ──────────────────────

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
                    {/* Header — pseudo + date + difficulty */}
                    <div className="flex items-center gap-3">
                      <Avatar name={data.riff.contributor} />
                      <div>
                        <div className="font-mono text-sm font-semibold text-text">
                          {data.riff.contributor}
                        </div>
                        <div className="text-xs text-text-soft">
                          {formatRelativeDate(data.riff.addedAt)} ·{' '}
                          {'⭐'.repeat(data.riff.difficulty)}
                        </div>
                      </div>
                    </div>

                    {data.riff.caption && (
                      <p className="mt-3 text-base text-text leading-relaxed">
                        {data.riff.caption}
                      </p>
                    )}

                    <h2 className="display mt-4 text-display-md">{data.tab.name}</h2>
                    {data.tab.artist && (
                      <p className="mt-1 text-text-muted">{data.tab.artist}</p>
                    )}

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
                    <div className="mt-5 grid grid-cols-3 gap-3 rounded-xl border border-border bg-surface-2 p-4 text-center text-xs">
                      <div>
                        <div className="label-small">Likes</div>
                        <div className="display mt-1 text-display-sm text-gold">
                          {data.riff.baseLikes + (liked ? 1 : 0)}
                        </div>
                      </div>
                      <div>
                        <div className="label-small">Commentaires</div>
                        <div className="display mt-1 text-display-sm text-gold">
                          {data.riff.commentsCount ?? 0}
                        </div>
                      </div>
                      <div>
                        <div className="label-small">Note</div>
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

// ─── Rating stars (1-5, click pour set) ───────────────────────────────

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
                    En attendant : likes, bookmarks et ratings sont locaux
                    uniquement, ils vivent dans Dexie sur ton appareil.
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
