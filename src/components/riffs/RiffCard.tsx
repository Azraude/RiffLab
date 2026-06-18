/**
 * RiffCard — card du feed /riffs (refonte design, sess 2026-06-18).
 *
 * Card TEASER cliquable en entier → page détail /riffs/:id. Pas de boutons
 * "Voir le tab" / "Apprendre" (tout vit sur la page détail). La card donne
 * envie + actions sociales rapides.
 *
 * Design (refonte B) :
 *  - Hiérarchie forte : TITRE énorme en font-display = le focus.
 *  - Identité par difficulté : barre accent verticale à gauche (vert→rouge)
 *    + badge top-right de la même couleur. Lecture instantanée du niveau.
 *  - Métas (BPM, tonalité) en chips gold/outline compacts (font-mono).
 *  - Tab preview dans une box distincte (bg-surface-2 + border + fade droit).
 *  - Hover desktop premium : border gold, lift, glow gold subtil.
 *  - Footer social aérien : icônes 22px, counts gold si >100, play rond gold.
 *
 * 2 modes :
 *  - full (défaut) : 1 col pleine largeur, titre text-xl→2xl, ~360px.
 *  - compact (prop) : grille dense, titre text-lg, ~300px.
 *
 * Mobile-first : tap targets ≥ 44px, counts compacts ("1.2k"), toute la card
 * cliquable mais boutons internes en stopPropagation (pas de nav parasite).
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Play, User } from 'lucide-react';
import clsx from 'clsx';
import {
  difficultyToLevel,
  formatRelativeDate,
  LEVEL_LABELS,
  LEVEL_COLORS,
  type RiffLevel,
  type CommunityRiff,
} from '@/lib/communityRiffs';
import type { Tab } from '@/lib/tabsDatabase';
import { TabReader } from '@/components/tabs/TabReader';
import { isRiffBookmarked, isRiffLiked, toggleRiffBookmark, toggleRiffLike } from '@/lib/db';

/** Barre accent verticale gauche — couleur = niveau de difficulté. */
const LEVEL_BAR: Record<RiffLevel, string> = {
  beginner: 'bg-green-500/55',
  intermediate: 'bg-gold/60',
  advanced: 'bg-orange-500/60',
  expert: 'bg-red-500/60',
};

interface RiffCardProps {
  riff: CommunityRiff;
  tab: Tab;
  /** Click sur la card entière → page détail /riffs/:id. */
  onOpenDetail: () => void;
  /** Click sur ▶ → preview audio en place (joué par le parent). */
  onListen?: () => void;
  /** Badge "🏆 Maîtrisé" si l'user a marqué ce riff maîtrisé. */
  masteredAt?: number | null;
  /** Version dense pour les grilles desktop (RiffsByTag, etc.). */
  compact?: boolean;
  /**
   * Props legacy de l'ancienne card (avant la refonte feed) — désormais
   * IGNORÉS. Gardés optionnels pour ne pas casser le build de
   * RiffCollection / RiffsByTag qui partagent cette card.
   */
  onViewTab?: () => void;
  onLearn?: () => void;
  onShare?: () => void;
}

export function RiffCard({
  riff,
  tab,
  onOpenDetail,
  onListen,
  masteredAt,
  compact = false,
}: RiffCardProps) {
  const level = difficultyToLevel(riff.difficulty);
  const liked = useLiveQuery(() => isRiffLiked(riff.id), [riff.id]) ?? false;
  const bookmarked = useLiveQuery(() => isRiffBookmarked(riff.id), [riff.id]) ?? false;
  const likeCount = riff.baseLikes + (liked ? 1 : 0);

  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  const pad = compact ? 'px-3' : 'px-4';
  const iconSize = compact ? 20 : 22;

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail();
        }
      }}
      aria-label={`Ouvrir ${tab.name} de ${riff.contributor}`}
      className={clsx(
        'group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl',
        'border border-border bg-surface outline-none',
        'transition-all duration-200 ease-out-quart',
        'hover:-translate-y-0.5 hover:border-gold/30 hover:bg-surface-2',
        'hover:shadow-gold',
        'focus-visible:border-gold active:scale-[0.985]',
        compact ? 'h-[300px]' : 'h-[360px] sm:h-[372px]'
      )}
    >
      {/* Barre accent verticale = identité difficulté (immédiat, pré-attentif) */}
      <span
        aria-hidden
        className={clsx('absolute inset-y-0 left-0 w-[3px]', LEVEL_BAR[level])}
      />

      {/* === Header : avatar + @user · date — badge difficulté top-right === */}
      <header className={clsx('flex shrink-0 items-center justify-between gap-2 pb-2 pt-3', pad)}>
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={`/u/${riff.contributor.replace('@', '')}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Profil ${riff.contributor}`}
            className="shrink-0"
          >
            <Avatar name={riff.contributor} />
          </Link>
          <div className="min-w-0 leading-tight">
            <Link
              to={`/u/${riff.contributor.replace('@', '')}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate font-mono text-xs font-semibold text-text hover:text-gold"
            >
              {riff.contributor}
            </Link>
            <div className="mt-0.5 text-[10px] text-text-soft">
              {formatRelativeDate(riff.addedAt)}
            </div>
          </div>
        </div>
        <span
          className={clsx(
            'shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider',
            LEVEL_COLORS[level]
          )}
        >
          {LEVEL_LABELS[level]}
        </span>
      </header>

      {/* === Titre énorme (focus) + artiste === */}
      <div className={clsx('shrink-0', pad)}>
        <h3
          className={clsx(
            'display leading-[1.1] text-text',
            compact ? 'line-clamp-2 text-lg' : 'line-clamp-2 text-xl sm:text-2xl'
          )}
        >
          {tab.name}
        </h3>
        {tab.artist && (
          <div className="mt-0.5 truncate text-sm text-text-muted">{tab.artist}</div>
        )}
      </div>

      {/* === Chips métadonnées (BPM, tonalité) === */}
      <div className={clsx('mt-2 flex shrink-0 flex-wrap items-center gap-1.5', pad)}>
        <MetaChip>{tab.tempo} BPM</MetaChip>
        {tab.key && <MetaChip>{tab.key}</MetaChip>}
        {masteredAt && (
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-gold">
            🏆 Maîtrisé
          </span>
        )}
      </div>

      {/* === Tab preview — box distincte, absorbe l'espace restant ===
          pointer-events-none + overflow hidden : pas de scroll-x parasite. */}
      <div className={clsx('mt-3 min-h-0 flex-1', pad)}>
        <div className="relative h-full overflow-hidden rounded-xl border border-border bg-surface-2">
          <div className="pointer-events-none p-2">
            <TabReader
              tab={tab}
              lineHeight={compact ? 11 : 13}
              beatWidth={compact ? 10 : 12}
            />
          </div>
          {/* Fade droit : suggère "y'a plus de mesures à droite" */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-14 bg-gradient-to-l from-surface-2 to-transparent"
          />
          {/* Fade bas : coupe proprement les lignes du bas */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-surface-2 to-transparent"
          />
        </div>
      </div>

      {/* === Tags discrets cliquables === */}
      {riff.tags.length > 0 && (
        <div className={clsx('mt-2 flex shrink-0 flex-wrap gap-1.5', pad)}>
          {riff.tags.slice(0, 3).map((t) => (
            <Link
              key={t}
              to={`/riffs/tag/${t}`}
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-[11px] text-text-soft transition-colors hover:text-gold"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      {/* === Footer social aérien === */}
      <footer className="mt-2 flex shrink-0 items-center justify-between border-t border-border px-2 py-2.5">
        <div className="flex items-center">
          <ActionBtn
            label={liked ? 'Aimé' : "J'aime"}
            count={likeCount}
            active={liked}
            activeColor="danger"
            iconSize={iconSize}
            onClick={stop(() => void toggleRiffLike(riff.id))}
          >
            <Heart size={iconSize} fill={liked ? 'currentColor' : 'none'} />
          </ActionBtn>
          <ActionBtn
            label="Commentaires"
            count={riff.commentsCount ?? 0}
            iconSize={iconSize}
            onClick={stop(onOpenDetail)}
          >
            <MessageCircle size={iconSize} />
          </ActionBtn>
          <ActionBtn
            label={bookmarked ? 'Sauvegardé' : 'Sauver'}
            active={bookmarked}
            activeColor="gold"
            iconSize={iconSize}
            onClick={stop(() => void toggleRiffBookmark(riff.id))}
          >
            <Bookmark size={iconSize} fill={bookmarked ? 'currentColor' : 'none'} />
          </ActionBtn>
        </div>
        <button
          type="button"
          onClick={stop(onListen)}
          aria-label="Écouter le riff"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold transition-all hover:bg-gold/25 active:scale-95"
        >
          <Play size={iconSize - 4} fill="currentColor" />
        </button>
      </footer>
    </article>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initial = (name.replace('@', '')[0] ?? '?').toUpperCase();
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 font-mono text-sm font-bold text-gold"
      aria-hidden="true"
    >
      {initial === '?' ? <User size={15} /> : initial}
    </div>
  );
}

/** Chip métadonnée compact gold/outline (BPM, tonalité). */
function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gold/30 bg-gold/5 px-2 py-0.5 font-mono text-[11px] text-gold-soft">
      {children}
    </span>
  );
}

/** Bouton d'action footer — tap target 44px, count compact + gold si >100. */
function ActionBtn({
  children,
  label,
  count,
  active,
  activeColor = 'gold',
  iconSize = 22,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  activeColor?: 'gold' | 'danger';
  iconSize?: number;
  onClick: (e: React.MouseEvent) => void;
}) {
  const activeCls = activeColor === 'danger' ? 'text-danger' : 'text-gold-bright';
  const big = count !== undefined && count > 100;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count !== undefined && count > 0 ? `${label} (${count})` : label}
      className={clsx(
        'inline-flex h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition-all hover:bg-surface active:scale-95',
        active ? activeCls : 'text-text-muted hover:text-text'
      )}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span
          className={clsx(
            'font-mono text-xs tabular-nums',
            !active && big && 'text-gold'
          )}
        >
          {formatCount(count)}
        </span>
      )}
    </button>
  );
}

/** Format compact "1.2k" pour les grands compteurs. */
function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  if (n < 1_000_000) return `${Math.round(n / 1000)}k`;
  return `${(n / 1_000_000).toFixed(1).replace('.0', '')}M`;
}
