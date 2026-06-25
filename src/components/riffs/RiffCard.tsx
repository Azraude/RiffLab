/**
 * RiffCard — card du feed /riffs (refonte feed social, sess 2026-06-17).
 *
 * Card TEASER de taille FIXE, cliquable en entier → page détail /riffs/:id.
 * Pas de boutons "Voir le tab" / "Apprendre" : tout ça vit sur la page
 * détail. La card sert juste à donner envie + actions sociales rapides.
 *
 * Specs :
 *  - Hauteur fixe : 320px mobile / 280px ≥sm (cohérent dans la grille)
 *  - Toute la card est cliquable (onClick → onOpenDetail). Les boutons
 *    internes (like/save/play, liens avatar/tags) font stopPropagation
 *    pour ne PAS naviguer.
 *  - Layout vertical : header → titre/BPM → tab preview (flex-1) → footer.
 *
 * Mobile-first : tap targets ≥ 44px, counts compacts ("1.2k").
 */
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Music, Play, User } from 'lucide-react';
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
  /** Click sur la card entière → page détail /riffs/:id. */
  onOpenDetail: () => void;
  /** Click sur ▶ → preview audio en place (joué par le parent). */
  onListen?: () => void;
  /** Badge "🏆 Maîtrisé" si l'user a marqué ce riff maîtrisé. */
  masteredAt?: number | null;
  /**
   * Props legacy de l'ancienne card (avant la refonte feed) — désormais
   * IGNORÉS. Gardés optionnels uniquement pour ne pas casser le build de
   * RiffCollection / RiffsByTag qui partagent cette card et les passaient
   * encore. Tout passe maintenant par la page détail /riffs/:id.
   */
  onViewTab?: () => void;
  onLearn?: () => void;
  onShare?: () => void;
  compact?: boolean;
}

export function RiffCard({ riff, tab, onOpenDetail, onListen, masteredAt }: RiffCardProps) {
  const level = difficultyToLevel(riff.difficulty);
  const liked = useLiveQuery(() => isRiffLiked(riff.id), [riff.id]) ?? false;
  const bookmarked = useLiveQuery(() => isRiffBookmarked(riff.id), [riff.id]) ?? false;
  const likeCount = riff.baseLikes + (liked ? 1 : 0);

  // Chords : explicites si renseignés, sinon fallback chip unique sur la
  // tonalité. Plafonné à 3 chips visibles (+N) pour ne pas casser le layout.
  const chords = riff.chords ?? (riff.key ? [riff.key] : []);

  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

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
      className="group flex h-[400px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface-2 outline-none transition-all hover:border-gold-soft focus-visible:border-gold sm:h-[360px] sm:hover:scale-[1.01] sm:hover:shadow-gold active:scale-[0.98]"
    >
      {/* === Header : avatar + @user · date + badge niveau === */}
      <header className="flex shrink-0 items-center justify-between gap-2 p-3 pb-2">
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
            <div className="mt-0.5 flex items-center gap-1 text-[10px] text-text-soft">
              <span aria-label={`${riff.difficulty} sur 5`}>{'⭐'.repeat(riff.difficulty)}</span>
              <span>·</span>
              <span>{formatRelativeDate(riff.addedAt)}</span>
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

      {/* === Titre + artiste + chord chips à droite === */}
      <div className="flex shrink-0 items-start justify-between gap-2 px-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Music size={14} className="shrink-0 text-gold" />
            <h3 className="display truncate text-lg leading-tight text-text">{tab.name}</h3>
          </div>
          {tab.artist && <div className="truncate text-xs text-text-muted">{tab.artist}</div>}
        </div>
        {chords.length > 0 && (
          <div className="flex shrink-0 items-center gap-1">
            {chords.slice(0, 3).map((c) => (
              <ChordChip key={c} chord={c} />
            ))}
            {chords.length > 3 && (
              <span className="font-mono text-[10px] text-text-soft">+{chords.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* === Description (caption) italique, 2 lignes max === */}
      {riff.caption && (
        <p className="mt-1.5 line-clamp-2 shrink-0 px-3 text-xs italic leading-snug text-text-muted">
          {riff.caption}
        </p>
      )}

      {/* === Tab mini-preview — absorbe l'espace restant (hauteur fixe) ===
          overflow hidden STRICT + pointer-events-none : pas de scroll-x
          interne qui parasiterait le scroll vertical du feed. */}
      <div className="relative mt-2 min-h-0 flex-1 overflow-hidden px-3">
        <div className="pointer-events-none">
          <TabReader tab={tab} lineHeight={11} beatWidth={10} compact />
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-surface-2 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-surface-2 to-transparent"
        />
      </div>

      {/* === Meta (BPM · tonalité) + tags === */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-1">
        <div className="flex shrink-0 items-center gap-1.5 font-mono text-xs text-text-muted">
          <span className="font-bold text-gold">♩ {tab.tempo}</span>
          {riff.key && (
            <>
              <span aria-hidden>·</span>
              <span>{riff.key}</span>
            </>
          )}
        </div>
        {riff.tags.length > 0 && (
          <div className="flex min-w-0 items-center gap-1 overflow-hidden">
            {masteredAt && (
              <span className="shrink-0 text-[10px] font-bold text-gold">🏆</span>
            )}
            <span className="truncate font-mono text-[10px] text-gold-soft/70">
              {riff.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}
            </span>
          </div>
        )}
      </div>

      {/* === Footer actions sociales === */}
      <footer className="flex shrink-0 items-center justify-between border-t border-border px-2 py-1.5">
        <div className="flex items-center">
          <ActionBtn
            label={liked ? 'Aimé' : "J'aime"}
            count={likeCount}
            active={liked}
            activeColor="danger"
            onClick={stop(() => void toggleRiffLike(riff.id))}
          >
            <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          </ActionBtn>
          <ActionBtn
            label="Commentaires"
            count={riff.commentsCount ?? 0}
            onClick={stop(onOpenDetail)}
          >
            <MessageCircle size={18} />
          </ActionBtn>
          <ActionBtn
            label={bookmarked ? 'Sauvegardé' : 'Sauver'}
            active={bookmarked}
            activeColor="gold"
            onClick={stop(() => void toggleRiffBookmark(riff.id))}
          >
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          </ActionBtn>
        </div>
        <ActionBtn label="Écouter le riff" onClick={stop(onListen)}>
          <Play size={18} fill="currentColor" />
        </ActionBtn>
      </footer>
    </article>
  );
}

// ─── Sous-composants ────────────────────────────────────────────────

/** Pastille accord — bordure or, mono, compacte (tap-safe, décorative). */
function ChordChip({ chord }: { chord: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-md border border-gold/30 bg-gold/5 px-1.5 font-mono text-[11px] font-bold text-gold">
      {chord}
    </span>
  );
}

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

/** Bouton d'action footer — tap target 44px, count compact. */
function ActionBtn({
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
      aria-label={count !== undefined && count > 0 ? `${label} (${count})` : label}
      className={clsx(
        'inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-all hover:bg-surface active:scale-95',
        active ? activeCls : 'text-text-muted hover:text-text'
      )}
    >
      {children}
      {count !== undefined && count > 0 && (
        <span className="font-mono text-xs tabular-nums">{formatCount(count)}</span>
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
