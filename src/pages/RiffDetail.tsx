/**
 * /riffs/:id — page détail d'un riff (sess 27 Phase 3).
 *
 * Hero énorme, RiffPlayer pleine largeur, sections "Plus de @user",
 * "Riffs similaires", actions sticky bas mobile.
 */
import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Trophy,
  Target,
  Music2,
  User,
} from 'lucide-react';
import clsx from 'clsx';
import { Card } from '@/components/ui/Card';
import { RiffPlayer } from '@/components/riffs/RiffPlayer';
import { LearnRiffMode } from '@/components/riffs/LearnRiffMode';
import { RiffCard } from '@/components/riffs/RiffCard';
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

export function RiffDetail() {
  const { id } = useParams();
  const data = id ? getCommunityRiff(id) : null;
  const [shareOpen, setShareOpen] = useState(false);
  const [learnOpen, setLearnOpen] = useState(false);

  const liked = useLiveQuery(() => (id ? isRiffLiked(id) : Promise.resolve(false)), [id]) ?? false;
  const bookmarked = useLiveQuery(() => (id ? isRiffBookmarked(id) : Promise.resolve(false)), [id]) ?? false;
  const mastered = useLiveQuery(() => (id ? isRiffMastered(id) : Promise.resolve(undefined)), [id]);
  const masteredRows = useLiveQuery(() => listMasteredRiffs(), []) ?? [];
  const masteredMap = useMemo(
    () => new Map(masteredRows.map((m) => [m.id, m.masteredAt] as const)),
    [masteredRows]
  );

  // Plus de @username : 3 autres riffs du même contributor
  const moreByUser = useMemo(() => {
    if (!data) return [];
    return COMMUNITY_RIFFS.filter(
      (r) => r.contributor === data.riff.contributor && r.id !== data.riff.id
    ).slice(0, 3);
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
      .slice(0, 3);
  }, [data?.riff.id]);

  if (!data) {
    // Si l'id est invalide → redirect vers le feed (pas un 404 dur)
    return <Navigate to="/riffs" replace />;
  }
  const { riff, tab } = data;
  const level = difficultyToLevel(riff.difficulty);
  const likeCount = riff.baseLikes + (liked ? 1 : 0);

  return (
    <>
      {/* Breadcrumb retour */}
      <Link
        to="/riffs"
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-soft hover:text-gold"
      >
        <ArrowLeft size={14} /> Feed des riffs
      </Link>

      <div className="mx-auto max-w-4xl pb-32 md:pb-12">
        {/* === Hero compact === */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5"
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
          <h1 className="display mt-3 text-display-md leading-tight md:text-display-xl">
            {tab.name}
          </h1>
          {tab.artist && (
            <p className="mt-1 text-base text-text-muted md:text-lg">{tab.artist}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-text-muted md:text-sm">
            <div className="inline-flex items-center gap-2">
              <Avatar name={riff.contributor} />
              <span className="font-mono text-text">{riff.contributor}</span>
              <span className="text-text-soft">·</span>
              <span>{formatRelativeDate(riff.addedAt)}</span>
            </div>
          </div>

          {/* Metadata grid 2x2 mobile / 1x4 desktop */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Meta label="BPM" value={tab.tempo} />
            <Meta label="Tonalité" value={tab.key} />
            <Meta label="Mesures" value={tab.measures.length} />
            <Meta label="Difficulté" value={'⭐'.repeat(riff.difficulty)} />
          </div>

          {/* Tags + techniques inline */}
          {(riff.tags.length > 0 || riff.techniques?.length) && (
            <div className="mt-4 flex flex-wrap gap-1.5">
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
        </motion.header>

        {/* === Caption / annotation créateur (compact) === */}
        {riff.caption && (
          <Card className="mb-5 border-gold/30 bg-gradient-to-br from-gold/8 to-transparent">
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
        )}

        {/* === TAB AREA STICKY MOBILE ===
            Le RiffPlayer wrap déjà le TabReader avec scroll-horizontal pur
            (max-h-200 + overflow-x-auto + overflow-y-hidden). Ici on rend
            le wrapper sticky-top-0 pour que la tab reste visible quand
            l'user scroll les commentaires en dessous.
            -mx-5 + bg-bg pour bleed full-width + masquer le contenu derrière
            le sticky. md:relative pour désactiver le sticky desktop (le
            layout 2-cols rend ça inutile). */}
        <section className="sticky top-0 z-10 -mx-5 mb-5 bg-bg px-5 pt-2 pb-3 md:relative md:mx-0 md:px-0 md:pt-0 md:pb-0">
          <RiffPlayer tab={tab} />
          <p className="mt-1.5 text-center text-[10px] text-text-soft md:hidden">
            ← swipe pour voir la suite du tab →
          </p>
        </section>

        {/* === Actions sociales === */}
        <section className="flex flex-wrap items-center justify-between gap-3 border-t border-b border-border py-4">
          <div className="flex items-center gap-1">
            <SocialBtn
              count={likeCount}
              active={liked}
              activeColor="danger"
              label={liked ? 'Aimé' : "J'aime"}
              onClick={() => void toggleRiffLike(riff.id)}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            </SocialBtn>
            <SocialBtn count={riff.commentsCount ?? 0} label="Commentaires">
              <MessageCircle size={18} />
            </SocialBtn>
            <SocialBtn
              active={bookmarked}
              activeColor="gold"
              label={bookmarked ? 'Sauvegardé' : 'Sauver'}
              onClick={() => void toggleRiffBookmark(riff.id)}
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

        {/* === Plus de @username === */}
        {moreByUser.length > 0 && (
          <section className="space-y-3">
            <h3 className="display text-display-sm">Plus de {riff.contributor}</h3>
            <div className="space-y-4">
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
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* === Riffs similaires === */}
        {similar.length > 0 && (
          <section className="space-y-3">
            <h3 className="display text-display-sm">Riffs similaires</h3>
            <div className="space-y-4">
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
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* === Commentaires (wired sess 30) === */}
        <section className="space-y-3">
          <h3 className="display text-display-sm">Commentaires</h3>
          <CommentsSection riffId={riff.id} />
        </section>
      </div>

      {/* === Bottom sticky "Apprendre" mobile === */}
      <div
        className="fixed inset-x-0 z-30 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-md md:hidden"
        style={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
      >
        <button
          type="button"
          onClick={() => setLearnOpen(true)}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold text-sm font-semibold text-bg shadow-gold-strong"
        >
          <Target size={16} />
          Apprendre ce riff
        </button>
      </div>

      {/* Apprendre — bouton desktop dans le RiffPlayer ou sticky ? On met
          un raccourci en bas du contenu pour desktop aussi */}
      <div className="fixed right-6 z-30 hidden md:block" style={{ bottom: '32px' }}>
        <button
          type="button"
          onClick={() => setLearnOpen(true)}
          className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-gold-bright to-gold px-6 text-sm font-bold text-bg shadow-gold-strong transition-all hover:-translate-y-px"
        >
          <Target size={16} />
          Apprendre ce riff
        </button>
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

function Meta({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2.5 text-center">
      <div className="label-small">{label}</div>
      <div className="display mt-0.5 text-lg text-gold">{value}</div>
    </div>
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
        <span className="font-mono">{count}</span>
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
}: {
  riff: CommunityRiff;
  tabName: string;
  tabArtist?: string;
  bpm: number;
  masteredAt: number | null;
}) {
  return (
    <Link
      to={`/riffs/${riff.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 transition-colors hover:border-gold-soft"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="display truncate text-base text-text">{tabName}</span>
          {masteredAt && (
            <Trophy size={12} className="shrink-0 text-gold" fill="currentColor" />
          )}
        </div>
        {tabArtist && (
          <div className="truncate text-xs text-text-muted">{tabArtist}</div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="font-mono text-sm font-bold text-gold">{bpm}</div>
        <div className="text-[9px] uppercase tracking-wider text-text-soft">BPM</div>
      </div>
    </Link>
  );
}

// Re-import non utilisé caché pour eviter unused warning
void RiffCard;
