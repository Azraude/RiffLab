/**
 * RiffCard — card du feed /riffs refonte sess 27 Phase 1.
 *
 * Hiérarchie claire :
 *  1. Header : avatar @user + difficulty + date relative
 *  2. Caption + tags
 *  3. Mini "encart" du tab : titre + artiste + BPM + tab preview compact
 *     + 3 actions principales (Écouter / Voir / Apprendre)
 *  4. Footer actions sociales (like, comment, save, share)
 *
 * Mobile-first : padding 4 mobile / 6 desktop, tap targets ≥ 44px.
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Share2, Music, Play, BookOpen, Target, User } from 'lucide-react';
import clsx from 'clsx';
import {
  difficultyToLevel,
  formatRelativeDate,
  LEVEL_LABELS,
  LEVEL_COLORS,
  type CommunityRiff,
} from '@/lib/communityRiffs';
import type { Tab } from '@/lib/tabsDatabase';
import { TabReader } from '@/components/tabs/TabReader';
import { isRiffBookmarked, isRiffLiked, toggleRiffBookmark, toggleRiffLike } from '@/lib/db';

interface RiffCardProps {
  riff: CommunityRiff;
  tab: Tab;
  /** Click sur "Écouter" — déclenche le player principal (Phase 2 wiring). */
  onListen?: () => void;
  /** Click sur "Voir le tab" — ouvre le modal full-screen. */
  onViewTab: () => void;
  /** Click sur "Apprendre" — ouvre le mode apprendre (Phase 2). */
  onLearn?: () => void;
  /** Click sur la card OU son titre — navigate vers page détail. */
  onOpenDetail?: () => void;
  /** Click sur "Partager" — ouvre ShareDrawer. */
  onShare?: () => void;
  /** Badge "🏆 Maîtrisé" affiché si l'user a marqué ce riff comme maîtrisé. */
  masteredAt?: number | null;
  /** Mode compact pour grille 2 cols (sess 29 layout magazine). */
  compact?: boolean;
}

export function RiffCard({
  riff,
  tab,
  onListen,
  onViewTab,
  onLearn,
  onOpenDetail,
  onShare,
  masteredAt,
  compact = false,
}: RiffCardProps) {
  const level = difficultyToLevel(riff.difficulty);
  const liked = useLiveQuery(() => isRiffLiked(riff.id), [riff.id]) ?? false;
  const bookmarked = useLiveQuery(() => isRiffBookmarked(riff.id), [riff.id]) ?? false;
  const likeCount = riff.baseLikes + (liked ? 1 : 0);

  const stopBubble = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  // ─── Mode compact : grille magazine (sess 29 layout 3 cols) ───────
  if (compact) {
    return (
      <article
        className="group overflow-hidden rounded-xl border border-border bg-surface-2 transition-colors hover:border-gold/30"
      >
        <button
          type="button"
          onClick={onOpenDetail}
          className="block w-full text-left"
          aria-label={`Ouvrir ${tab.name} en détail`}
        >
          <div className="px-3 pt-3">
            {/* Header compact */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <SmallAvatar name={riff.contributor} />
                <div className="min-w-0">
                  <div className="truncate font-mono text-[11px] font-semibold text-text-muted">
                    {riff.contributor}
                  </div>
                  <div className="text-[9px] text-text-soft">{formatRelativeDate(riff.addedAt)}</div>
                </div>
              </div>
              <span
                className={clsx(
                  'shrink-0 rounded-full border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider',
                  LEVEL_COLORS[level]
                )}
              >
                {LEVEL_LABELS[level].slice(0, 3)}
              </span>
            </div>

            {/* Titre + artiste */}
            <h3 className="display mt-2 truncate text-base leading-tight text-text">{tab.name}</h3>
            {tab.artist && (
              <div className="truncate text-[11px] text-text-muted">{tab.artist}</div>
            )}

            {/* 3 tags max — cliquables vers /riffs/tag/:tag */}
            <div className="mt-1.5 flex flex-wrap gap-1">
              {riff.tags.slice(0, 3).map((t) => (
                <Link
                  key={t}
                  to={`/riffs/tag/${t}`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded bg-gold/10 px-1.5 py-0.5 font-mono text-[9px] text-gold-soft hover:bg-gold/20"
                >
                  #{t}
                </Link>
              ))}
            </div>
          </div>

          {/* Mini-preview tab — 2 mesures max grâce à max-h */}
          <div className="relative mt-2 max-h-[70px] overflow-hidden px-2 opacity-80">
            <TabReader tab={tab} lineHeight={10} beatWidth={9} />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface-2 to-transparent"
            />
          </div>

          {/* Mastered badge ribbon */}
          {masteredAt && (
            <div className="px-3 pb-1 pt-1">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-gold">
                🏆 Maîtrisé
              </span>
            </div>
          )}
        </button>

        {/* Footer icons only */}
        <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
          <div className="flex items-center gap-0">
            <CompactBtn
              label={liked ? 'Aimé' : "J'aime"}
              active={liked}
              activeColor="danger"
              count={likeCount}
              onClick={stopBubble(() => void toggleRiffLike(riff.id))}
            >
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            </CompactBtn>
            <CompactBtn
              label="Commentaires"
              count={riff.commentsCount ?? 0}
              onClick={stopBubble(onOpenDetail)}
            >
              <MessageCircle size={14} />
            </CompactBtn>
            <CompactBtn
              label={bookmarked ? 'Sauvegardé' : 'Sauver'}
              active={bookmarked}
              activeColor="gold"
              onClick={stopBubble(() => void toggleRiffBookmark(riff.id))}
            >
              <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} />
            </CompactBtn>
          </div>
          <CompactBtn label="Écouter" onClick={stopBubble(onListen)}>
            <Play size={14} fill="currentColor" />
          </CompactBtn>
        </div>
      </article>
    );
  }

  // ─── Mode full (par défaut) ───────────────────────────────────────
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-surface-2 transition-colors hover:border-gold/30">
      {/* Header : avatar + user + meta */}
      <header className="flex items-center justify-between gap-3 px-4 pt-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={riff.contributor} />
          <div className="min-w-0 leading-tight">
            <div className="truncate font-mono text-sm font-semibold text-text">
              {riff.contributor}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-text-soft">
              <span className="inline-flex items-center gap-0.5">
                {'⭐'.repeat(riff.difficulty)}
              </span>
              <span>·</span>
              <span>{formatRelativeDate(riff.addedAt)}</span>
            </div>
          </div>
        </div>
        <span
          className={clsx(
            'shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider',
            LEVEL_COLORS[level]
          )}
        >
          {LEVEL_LABELS[level]}
        </span>
      </header>

      {/* Caption + tags */}
      {riff.caption && (
        <div className="px-4 pt-3 md:px-6">
          <p className="text-sm leading-relaxed text-text">{riff.caption}</p>
        </div>
      )}
      {(riff.tags.length > 0 || riff.techniques?.length) && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-2 pb-1 md:px-6">
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
              {t}
            </Link>
          ))}
        </div>
      )}

      {/* Mini-encart du tab : titre + artiste + BPM + preview compact + 3 boutons */}
      <button
        type="button"
        onClick={onOpenDetail}
        className="mx-4 mt-4 mb-3 block w-[calc(100%-2rem)] overflow-hidden rounded-xl border border-border bg-surface text-left transition-colors hover:border-gold-soft md:mx-6 md:w-[calc(100%-3rem)]"
        aria-label={`Ouvrir ${tab.name} en détail`}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-3.5">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-text">
              <Music size={14} className="shrink-0 text-gold" />
              <span className="display truncate text-[17px] leading-tight">{tab.name}</span>
            </div>
            {tab.artist && (
              <div className="mt-0.5 truncate text-xs text-text-muted">{tab.artist}</div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-sm font-bold text-gold">{tab.tempo}</div>
            <div className="text-[9px] uppercase tracking-wider text-text-soft">BPM</div>
          </div>
        </div>

        {/* Tab preview compact : 4 mesures max, scroll bloqué, opacité légère */}
        <div className="relative -mx-1 mt-2 max-h-[112px] overflow-hidden px-1 opacity-90">
          <TabReader tab={tab} lineHeight={14} beatWidth={12} />
          {/* Gradient fade right pour indiquer "plus à voir" */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface to-transparent"
          />
        </div>

        {/* Mastered badge */}
        {masteredAt && (
          <div className="px-4 pb-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
              🏆 Maîtrisé le {new Date(masteredAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}
      </button>

      {/* 3 boutons d'action — full width grid */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3 md:px-6">
        <ActionPrimary onClick={stopBubble(onListen)} icon={<Play size={14} fill="currentColor" />} label="Écouter" />
        <ActionPrimary onClick={stopBubble(onViewTab)} icon={<BookOpen size={14} />} label="Voir le tab" />
        <ActionPrimary onClick={stopBubble(onLearn)} icon={<Target size={14} />} label="Apprendre" highlight />
      </div>

      {/* Footer actions sociales */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2 md:px-4">
        <div className="flex items-center gap-0">
          <SocialBtn
            label={liked ? 'Aimé' : "J'aime"}
            count={likeCount}
            active={liked}
            activeColor="danger"
            onClick={stopBubble(() => void toggleRiffLike(riff.id))}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </SocialBtn>
          <SocialBtn
            label="Commentaires"
            count={riff.commentsCount ?? 0}
            onClick={stopBubble(onOpenDetail)}
          >
            <MessageCircle size={18} />
          </SocialBtn>
          <SocialBtn
            label={bookmarked ? 'Sauvegardé' : 'Sauver'}
            active={bookmarked}
            activeColor="gold"
            onClick={stopBubble(() => void toggleRiffBookmark(riff.id))}
          >
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          </SocialBtn>
        </div>
        <SocialBtn label="Partager" onClick={stopBubble(onShare)}>
          <Share2 size={18} />
        </SocialBtn>
      </div>
    </article>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

/** Avatar compact 28px pour le mode grille (sess 29). */
function SmallAvatar({ name }: { name: string }) {
  const initial = (name.replace('@', '')[0] ?? '?').toUpperCase();
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-[10px] font-bold text-gold"
      aria-hidden="true"
    >
      {initial === '?' ? <User size={11} /> : initial}
    </div>
  );
}

/** Bouton footer compact (icône + count facultatif) pour le mode grille. */
function CompactBtn({
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
  const activeCls = activeColor === 'danger' ? 'text-danger' : 'text-gold-bright';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        'inline-flex h-8 items-center gap-1 rounded-md px-1.5 text-[10px] font-medium transition-colors hover:bg-surface',
        active ? activeCls : 'text-text-muted hover:text-text'
      )}
    >
      {children}
      {count !== undefined && count > 0 && <span className="font-mono">{count}</span>}
    </button>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = (name.replace('@', '')[0] ?? '?').toUpperCase();
  return (
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-sm font-bold text-gold"
      aria-hidden="true"
    >
      {initial === '?' ? <User size={16} /> : initial}
    </div>
  );
}

function ActionPrimary({
  onClick,
  icon,
  label,
  highlight = false,
}: {
  onClick: (e: React.MouseEvent) => void;
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold transition-all md:h-10',
        highlight
          ? 'bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold hover:-translate-y-px'
          : 'border border-border bg-surface text-text hover:border-gold-soft'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {/* Sur petit mobile, on garde juste l'icône — gain de place */}
      <span className="sm:hidden">{label.split(' ')[0]}</span>
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
  onClick: (e: React.MouseEvent) => void;
}) {
  const activeCls = activeColor === 'danger' ? 'text-danger' : 'text-gold-bright';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={clsx(
        'inline-flex h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-colors hover:bg-surface',
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
