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
import {
  isUUID,
  likeRiff,
  unlikeRiff,
  bookmarkRiff,
  unbookmarkRiff,
} from '@/lib/socialApi';
import { useAuthGate } from '@/hooks/useAuthGate';
import { useToast } from '@/hooks/useToast';
import { LoginModal } from '@/components/auth/LoginModal';

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

  // Gating soft pour like/bookmark (sess GATE) — pas connecté → toast +
  // LoginModal après 200ms. Le caller doit monter <LoginModal/> ci-dessous.
  const { requireAuth, loginOpen, setLoginOpen } = useAuthGate();
  const toast = useToast();

  const stop = (fn?: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.();
  };

  // Like/bookmark dual-path : Dexie en cache local (réactivité instantanée
  // via useLiveQuery) + persistance Supabase pour les riffs publiés (UUID).
  // Les riffs seed bundlés (cr-*, sw-*) n'ont pas d'UUID → Dexie local only,
  // donc pas de 400 sur la table (riff_id UUID-only). cf socialApi.isSeedRiff.
  const handleLike = async () => {
    if (!requireAuth('aimer')) return;
    const wasLiked = liked;
    await toggleRiffLike(riff.id);
    if (isUUID(riff.id)) {
      const { error } = wasLiked ? await unlikeRiff(riff.id) : await likeRiff(riff.id);
      if (error) {
        await toggleRiffLike(riff.id); // rollback cache local
        toast.error('Échec du like, réessaie');
      }
    }
  };

  const handleBookmark = async () => {
    if (!requireAuth('sauvegarder')) return;
    const wasBookmarked = bookmarked;
    await toggleRiffBookmark(riff.id);
    if (isUUID(riff.id)) {
      const { error } = wasBookmarked
        ? await unbookmarkRiff(riff.id)
        : await bookmarkRiff(riff.id);
      if (error) {
        await toggleRiffBookmark(riff.id); // rollback cache local
        toast.error('Échec de la sauvegarde, réessaie');
      }
    }
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
      className="group flex h-[320px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface-2 outline-none transition-all hover:border-gold-soft focus-visible:border-gold sm:h-[280px] sm:hover:scale-[1.01] sm:hover:shadow-gold active:scale-[0.98]"
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

      {/* === Titre + artiste · BPM === */}
      <div className="flex shrink-0 items-start justify-between gap-2 px-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Music size={14} className="shrink-0 text-gold" />
            <h3 className="display truncate text-lg leading-tight text-text">{tab.name}</h3>
          </div>
          {tab.artist && <div className="truncate text-xs text-text-muted">{tab.artist}</div>}
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-sm font-bold text-gold">{tab.tempo}</div>
          <div className="text-[9px] uppercase tracking-wider text-text-soft">BPM</div>
        </div>
      </div>

      {/* === Tags (2 max) === */}
      {riff.tags.length > 0 && (
        <div className="mt-2 flex shrink-0 flex-wrap gap-1 px-3">
          {riff.tags.slice(0, 2).map((t) => (
            <Link
              key={t}
              to={`/riffs/tag/${t}`}
              onClick={(e) => e.stopPropagation()}
              className="rounded bg-gold/10 px-1.5 py-0.5 font-mono text-[10px] text-gold-soft hover:bg-gold/20"
            >
              #{t}
            </Link>
          ))}
          {riff.tags.length > 2 && (
            <span className="px-1 py-0.5 font-mono text-[10px] text-text-soft">
              +{riff.tags.length - 2}
            </span>
          )}
          {masteredAt && (
            <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-bold text-gold">
              🏆 Maîtrisé
            </span>
          )}
        </div>
      )}

      {/* === Tab mini-preview — absorbe l'espace restant (hauteur fixe) ===
          overflow hidden STRICT + pointer-events-none : pas de scroll-x
          interne qui parasiterait le scroll vertical du feed. */}
      <div className="relative mt-2 min-h-0 flex-1 overflow-hidden px-3">
        <div className="pointer-events-none">
          <TabReader tab={tab} lineHeight={11} beatWidth={10} />
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

      {/* === Footer actions sociales === */}
      <footer className="flex shrink-0 items-center justify-between border-t border-border px-2 py-1.5">
        <div className="flex items-center">
          <ActionBtn
            label={liked ? 'Aimé' : "J'aime"}
            count={likeCount}
            active={liked}
            activeColor="danger"
            onClick={stop(handleLike)}
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
            onClick={stop(handleBookmark)}
          >
            <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
          </ActionBtn>
        </div>
        <ActionBtn label="Écouter le riff" onClick={stop(onListen)}>
          <Play size={18} fill="currentColor" />
        </ActionBtn>
      </footer>
      {/* LoginModal mounted via Portal Radix : sibling au article OK,
          le drawer s'attache au body indépendamment du DOM ancestry. */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
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
