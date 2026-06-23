/**
 * /riffs/:id — page détail d'un riff.
 *
 * Sess B (P1) — refonte mobile-first pleine page :
 *  - Header sticky top compact (Back + Share + Bookmark + Like)
 *  - Hero compact (Instagram-style) : avatar + @user + meta + tags inline
 *  - Tab area sticky-top mobile (md:relative desktop)
 *  - Actions row hiérarchisée : CTA "Écouter" primary full-width + grid
 *    2-cols "Apprendre" + "Annotations"
 *  - Sidebar droite lg+ : "Plus de @user" + "Riffs similaires"
 *  - Sur <lg : sections empilées en bas (Plus de / Similaires / Comments)
 *  - Bottom sticky "Apprendre" remplacé par le grid actions row
 */
import { useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Share2,
  Trophy,
  Target,
  Music2,
  User,
  Play,
  BookOpen,
} from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { RiffPlayer, type RiffPlayerHandle } from '@/components/riffs/RiffPlayer';
import { LearnRiffMode } from '@/components/riffs/LearnRiffMode';
import { ShareDrawer } from '@/components/share/ShareDrawer';
import { CommentsSection } from '@/components/social/CommentsSection';
import {
  COMMUNITY_RIFFS,
  difficultyToLevel,
  formatRelativeDate,
  getCommunityRiff,
  LEVEL_LABELS,
  LEVEL_COLORS,
  TECHNIQUE_LABELS,
  type CommunityRiff,
} from '@/lib/communityRiffs';
import { getTab } from '@/lib/tabsDatabase';
import {
  isRiffBookmarked,
  isRiffLiked,
  isRiffMastered,
  listMasteredRiffs,
  toggleRiffBookmark,
  toggleRiffLike,
} from '@/lib/db';
import { useAuthGate } from '@/hooks/useAuthGate';
import { LoginModal } from '@/components/auth/LoginModal';

export function RiffDetail() {
  const { id } = useParams();
  const data = id ? getCommunityRiff(id) : null;
  const [shareOpen, setShareOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);
  const tabAreaRef = useRef<HTMLElement | null>(null);
  const captionRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<RiffPlayerHandle | null>(null);

  const liked = useLiveQuery(() => (id ? isRiffLiked(id) : Promise.resolve(false)), [id]) ?? false;
  const bookmarked = useLiveQuery(() => (id ? isRiffBookmarked(id) : Promise.resolve(false)), [id]) ?? false;
  const mastered = useLiveQuery(() => (id ? isRiffMastered(id) : Promise.resolve(undefined)), [id]);
  const masteredRows = useLiveQuery(() => listMasteredRiffs(), []) ?? [];
  const masteredMap = useMemo(
    () => new Map(masteredRows.map((m) => [m.id, m.masteredAt] as const)),
    [masteredRows]
  );

  // Gating soft (sess GATE) — like/bookmark déclenchent toast + LoginModal
  // si user pas connecté. LoginModal monté à la fin du JSX.
  const { requireAuth, loginOpen, setLoginOpen } = useAuthGate();
  const handleLike = () => {
    if (!requireAuth('aimer')) return;
    if (id) void toggleRiffLike(id);
  };
  const handleBookmark = () => {
    if (!requireAuth('sauvegarder')) return;
    if (id) void toggleRiffBookmark(id);
  };

  // Plus de @username : 3 autres riffs du même contributor
  const moreByUser = useMemo(() => {
    if (!data) return [];
    return COMMUNITY_RIFFS.filter(
      (r) => r.contributor === data.riff.contributor && r.id !== data.riff.id
    ).slice(0, 4);
  }, [data?.riff.id]);

  // Riffs similaires : même tag dominant ou même difficulté ±1
  const similar = useMemo(() => {
    if (!data) return [];
    return COMMUNITY_RIFFS.filter((r) => {
      if (r.id === data.riff.id) return false;
      const tagOverlap = r.tags.some((t) => data.riff.tags.includes(t));
      const closeDifficulty = Math.abs(r.difficulty - data.riff.difficulty) <= 1;
      return tagOverlap && closeDifficulty;
    })
      .sort((a, b) => b.baseLikes - a.baseLikes)
      .slice(0, 4);
  }, [data?.riff.id]);

  if (!data) {
    return <Navigate to="/riffs" replace />;
  }
  const { riff, tab } = data;
  const level = difficultyToLevel(riff.difficulty);
  const likeCount = riff.baseLikes + (liked ? 1 : 0);

  const handleListen = () => {
    tabAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    playerRef.current?.play();
  };
  const scrollToCaption = () => {
    captionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      {/* === Header sticky compact mobile (Back + actions icons) ===
          Au-dessus du contenu, fond bg-bg/95 avec blur pour rester
          lisible quand on scroll le tab par-dessus. */}
      <header
        className="sticky top-0 z-20 -mx-5 -mt-6 flex items-center justify-between gap-2 border-b border-border/60 bg-bg/90 px-3 py-2 backdrop-blur-md md:relative md:mx-0 md:mt-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none"
      >
        <Link
          to="/riffs"
          aria-label="Retour au feed"
          className="inline-flex h-11 items-center gap-1.5 rounded-xl px-2 text-sm text-text-muted hover:text-gold md:h-9 md:px-3"
        >
          <ArrowLeft size={18} />
          <span className="hidden md:inline">Feed des riffs</span>
        </Link>
        <div className="flex items-center gap-1 md:hidden">
          <IconBtn
            onClick={handleLike}
            label={liked ? 'Retirer du favoris' : "J'aime"}
            active={liked}
            activeColor="danger"
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </IconBtn>
          <IconBtn
            onClick={handleBookmark}
            label={bookmarked ? 'Retirer du sauvegardés' : 'Sauvegarder'}
            active={bookmarked}
            activeColor="gold"
          >
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          </IconBtn>
          <IconBtn onClick={() => setShareOpen(true)} label="Partager">
            <Share2 size={18} />
          </IconBtn>
        </div>
      </header>

      {/* === Layout main + sidebar desktop ===
          <lg : 1 col stack. lg+ : grid main + sidebar 320px right. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        {/* ───────── MAIN COLUMN ───────── */}
        <div className="pb-24 md:pb-8 lg:pb-12">
          {/* === Hero compact === */}
          {/* NOTE : `initial={false}` désactive l'animation d'entrée Framer Motion.
              Symptôme observé : la section restait bloquée à `opacity: 0` sur
              certaines navigations (l'`animate` ne se déclenchait pas après le
              click sur une card riff), donnant un écran noir alors que le DOM
              était bien rendu. Pas d'animation = plus fiable. */}
          <motion.section
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 mb-4 md:mt-0 md:mb-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={clsx(
                  'rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
                  LEVEL_COLORS[level]
                )}
              >
                {LEVEL_LABELS[level]}
              </span>
              {mastered && (
                <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2.5 py-0.5 text-[10px] font-bold text-gold">
                  <Trophy size={11} /> Maîtrisé
                </span>
              )}
            </div>
            <h1 className="display mt-2 text-display-sm leading-tight md:text-display-lg">
              {tab.name}
            </h1>
            {tab.artist && (
              <p className="mt-0.5 text-sm text-text-muted md:text-base">{tab.artist}</p>
            )}

            {/* Avatar + meta line (Instagram-style header) */}
            <div className="mt-3 flex items-center gap-2 text-xs text-text-muted md:text-sm">
              <Avatar name={riff.contributor} />
              <Link
                to={`/u/${riff.contributor.replace('@', '')}`}
                className="font-mono text-text hover:text-gold"
              >
                {riff.contributor}
              </Link>
              <span className="text-text-soft">·</span>
              <span>{formatRelativeDate(riff.addedAt)}</span>
            </div>

            {/* Metadata pills inline mobile / cards md+ */}
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs md:hidden">
              <InlineMeta label="BPM" value={tab.tempo} />
              <span className="text-text-soft">·</span>
              <InlineMeta label="Tonalité" value={tab.key} />
              <span className="text-text-soft">·</span>
              <InlineMeta label="Mesures" value={tab.measures.length} />
            </div>
            <div className="mt-4 hidden grid-cols-4 gap-2 md:grid">
              <Meta label="BPM" value={tab.tempo} />
              <Meta label="Tonalité" value={tab.key} />
              <Meta label="Mesures" value={tab.measures.length} />
              <Meta label="Difficulté" value={'⭐'.repeat(riff.difficulty)} />
            </div>

            {/* Tags + techniques inline */}
            {(riff.tags.length > 0 || riff.techniques?.length) && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {riff.tags.map((t) => (
                  <Link
                    key={t}
                    to={`/riffs/tag/${t}`}
                    className="rounded-md bg-gold/10 px-2 py-0.5 font-mono text-[10px] text-gold-soft hover:bg-gold/20"
                  >
                    #{t}
                  </Link>
                ))}
                {riff.techniques?.map((t) => (
                  <Link
                    key={`tech-${t}`}
                    to={`/riffs/tag/${t}`}
                    className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-[10px] text-text-soft hover:border-gold-soft hover:text-text"
                  >
                    {TECHNIQUE_LABELS[t]}
                  </Link>
                ))}
              </div>
            )}
          </motion.section>

          {/* === TAB AREA STICKY MOBILE ===
              Le RiffPlayer wrap déjà le TabReader avec scroll-x pur.
              Ici on rend le wrapper sticky-top-0 pour que la tab reste
              visible quand l'user scroll les comments. Bleed -mx-5 +
              bg-bg pour masquer le contenu derrière le sticky.
              md:relative pour désactiver sticky desktop. */}
          <section
            ref={tabAreaRef}
            id="tab-area"
            className="sticky top-[calc(env(safe-area-inset-top)+44px)] z-10 -mx-5 mb-4 bg-bg px-5 pt-2 pb-3 md:relative md:top-auto md:mx-0 md:px-0 md:pt-0 md:pb-0"
          >
            <RiffPlayer ref={playerRef} tab={tab} />
            <p className="mt-1.5 text-center text-[10px] text-text-soft md:hidden">
              ← swipe pour voir la suite du tab →
            </p>
          </section>

          {/* === ACTIONS PRIMARY (hiérarchisées) ===
              CTA "Écouter" PRIMARY full-width + grid 2-cols secondaires.
              Sur mobile le CTA scroll-into-view sur le tab + tape sur
              le play interne du RiffPlayer (Phase 2 connectera direct). */}
          <section className="mb-5 space-y-2">
            <button
              type="button"
              onClick={handleListen}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold text-base font-bold text-bg shadow-gold-strong transition-all hover:-translate-y-px active:scale-[0.99]"
              aria-label="Écouter le riff"
            >
              <Play size={18} fill="currentColor" />
              Écouter le riff
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLearnOpen(true)}
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-gold/40 bg-gold/10 text-sm font-semibold text-gold transition-colors hover:bg-gold/20 active:scale-[0.99]"
              >
                <Target size={16} />
                Apprendre
              </button>
              <button
                type="button"
                onClick={scrollToCaption}
                disabled={!riff.caption}
                className={clsx(
                  'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-medium transition-colors active:scale-[0.99]',
                  riff.caption
                    ? 'border-border bg-surface text-text hover:border-gold-soft'
                    : 'cursor-not-allowed border-border/40 bg-surface/40 text-text-soft'
                )}
                aria-label={riff.caption ? 'Voir les annotations' : 'Pas d\'annotations'}
              >
                <BookOpen size={16} />
                Annotations
              </button>
            </div>
          </section>

          {/* === Caption / annotation créateur === */}
          {riff.caption && (
            <div ref={captionRef} className="mb-5 scroll-mt-24">
              <Card className="border-gold/30 bg-gradient-to-br from-gold/8 to-transparent">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/10 text-gold">
                    <Music2 size={15} />
                  </div>
                  <div>
                    <div className="eyebrow">Annotation du créateur</div>
                    <p className="mt-1 text-sm leading-relaxed text-text">{riff.caption}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* === Footer social (counts + share desktop) === */}
          <section className="mb-5 hidden items-center justify-between gap-3 border-t border-b border-border py-3 md:flex">
            <div className="flex items-center gap-1">
              <SocialBtn
                count={likeCount}
                active={liked}
                activeColor="danger"
                label={liked ? 'Aimé' : "J'aime"}
                onClick={handleLike}
              >
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              </SocialBtn>
              <SocialBtn
                active={bookmarked}
                activeColor="gold"
                label={bookmarked ? 'Sauvegardé' : 'Sauver'}
                onClick={handleBookmark}
              >
                <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
              </SocialBtn>
            </div>
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-border px-4 text-sm text-text-muted hover:border-gold-soft hover:text-text"
            >
              <Share2 size={14} /> Partager
            </button>
          </section>

          {/* === Commentaires (wired sess 30) === */}
          <section className="space-y-3">
            <h3 className="display text-display-sm">
              Commentaires
              {(riff.commentsCount ?? 0) > 0 && (
                <span className="ml-2 font-mono text-base text-text-soft">
                  ({riff.commentsCount})
                </span>
              )}
            </h3>
            <CommentsSection riffId={riff.id} />
          </section>

          {/* === Sections "Plus de" + "Similaires" mobile/tablet === */}
          {moreByUser.length > 0 && (
            <section className="mt-8 space-y-3 lg:hidden">
              <h3 className="display text-display-sm">Plus de {riff.contributor}</h3>
              <div className="space-y-3">
                {moreByUser.slice(0, 3).map((r) => {
                  const t = getTab(r.tabId);
                  if (!t) return null;
                  return (
                    <RelatedRiffRow
                      key={r.id}
                      riff={r}
                      tabName={t.name}
                      tabArtist={t.artist}
                      bpm={t.tempo}
                      masteredAt={masteredMap.get(r.id) ?? null}
                    />
                  );
                })}
              </div>
            </section>
          )}
          {similar.length > 0 && (
            <section className="mt-8 space-y-3 lg:hidden">
              <h3 className="display text-display-sm">Riffs similaires</h3>
              <div className="space-y-3">
                {similar.slice(0, 3).map((r) => {
                  const t = getTab(r.tabId);
                  if (!t) return null;
                  return (
                    <RelatedRiffRow
                      key={r.id}
                      riff={r}
                      tabName={t.name}
                      tabArtist={t.artist}
                      bpm={t.tempo}
                      masteredAt={masteredMap.get(r.id) ?? null}
                    />
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* ───────── SIDEBAR DESKTOP (lg+) ─────────
            Sticky top, "Plus de @user" + "Similaires", cards compact. */}
        <aside className="hidden lg:block">
          <div className="sticky top-6 space-y-6">
            {moreByUser.length > 0 && (
              <section className="space-y-2.5">
                <h3 className="eyebrow">🎵 Plus de {riff.contributor}</h3>
                <div className="space-y-2">
                  {moreByUser.map((r) => {
                    const t = getTab(r.tabId);
                    if (!t) return null;
                    return (
                      <RelatedRiffRow
                        key={r.id}
                        riff={r}
                        tabName={t.name}
                        tabArtist={t.artist}
                        bpm={t.tempo}
                        masteredAt={masteredMap.get(r.id) ?? null}
                        compact
                      />
                    );
                  })}
                </div>
              </section>
            )}
            {similar.length > 0 && (
              <section className="space-y-2.5">
                <h3 className="eyebrow">🔥 Riffs similaires</h3>
                <div className="space-y-2">
                  {similar.map((r) => {
                    const t = getTab(r.tabId);
                    if (!t) return null;
                    return (
                      <RelatedRiffRow
                        key={r.id}
                        riff={r}
                        tabName={t.name}
                        tabArtist={t.artist}
                        bpm={t.tempo}
                        masteredAt={masteredMap.get(r.id) ?? null}
                        compact
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </aside>
      </div>

      <ShareDrawer
        open={shareOpen}
        onOpenChange={setShareOpen}
        item={{
          type: 'riff',
          title: tab.name,
          url: typeof window !== 'undefined' ? window.location.href : '',
        }}
      />

      <LearnRiffMode
        open={learnOpen}
        onClose={() => setLearnOpen(false)}
        riff={riff}
        tab={tab}
      />

      {/* Soft gating LoginModal (sess GATE) — ouvert auto si user clique
          like/bookmark sans être connecté. */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
    </>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initial = (name.replace('@', '')[0] ?? '?').toUpperCase();
  return (
    <span
      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-xs font-bold text-gold"
      aria-hidden="true"
    >
      {initial === '?' ? <User size={12} /> : initial}
    </span>
  );
}

function InlineMeta({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="font-mono font-semibold text-gold">{value}</span>
      <span className="text-[10px] uppercase tracking-wider text-text-soft">{label}</span>
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5 text-center">
      <div className="label-small">{label}</div>
      <div className="display mt-0.5 text-lg text-gold">{value}</div>
    </div>
  );
}

function IconBtn({
  children,
  label,
  active,
  activeColor = 'gold',
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  active?: boolean;
  activeColor?: 'gold' | 'danger';
  onClick?: () => void;
}) {
  const activeCls = activeColor === 'danger' ? 'text-danger' : 'text-gold-bright';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        'flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
        active ? activeCls : 'text-text-muted hover:text-text'
      )}
    >
      {children}
    </button>
  );
}

function SocialBtn({
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
  onClick?: () => void;
}) {
  const activeCls = activeColor === 'danger' ? 'text-danger' : 'text-gold-bright';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        'inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors hover:bg-surface',
        active ? activeCls : 'text-text-muted hover:text-text'
      )}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="font-mono tabular-nums">{formatCount(count)}</span>
      )}
    </button>
  );
}

function RelatedRiffRow({
  riff,
  tabName,
  tabArtist,
  bpm,
  masteredAt,
  compact = false,
}: {
  riff: CommunityRiff;
  tabName: string;
  tabArtist?: string;
  bpm: number;
  masteredAt: number | null;
  compact?: boolean;
}) {
  return (
    <Link
      to={`/riffs/${riff.id}`}
      className={clsx(
        'flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 transition-colors hover:border-gold-soft',
        compact ? 'px-3 py-2.5' : 'px-4 py-3'
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={clsx(
              'display truncate text-text',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {tabName}
          </span>
          {masteredAt && (
            <Trophy
              size={compact ? 10 : 12}
              className="shrink-0 text-gold"
              fill="currentColor"
            />
          )}
        </div>
        {tabArtist && (
          <div
            className={clsx(
              'truncate text-text-muted',
              compact ? 'text-[10px]' : 'text-xs'
            )}
          >
            {tabArtist}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div
          className={clsx(
            'font-mono font-bold text-gold',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          {bpm}
        </div>
        <div className="text-[9px] uppercase tracking-wider text-text-soft">BPM</div>
      </div>
    </Link>
  );
}

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
}
