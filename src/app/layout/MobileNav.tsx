import { NavLink, useLocation } from 'react-router-dom';
import { Home, Flame, Plus, Library, User } from 'lucide-react';
import clsx from 'clsx';

/**
 * Bottom nav mobile — 4 items + FAB central "+".
 *
 * Refonte 2026-07-03 : match design Claude Design ui_kits/app/home/.
 * - 4 items normaux (2 gauche + 2 droite)
 * - FAB central "+" protubérant qui ouvre le composer riff (RiffEditor
 *   monté globalement dans Layout — voir onComposeClick)
 * - Réglages et plan de pratique retirés du nav → accessibles depuis
 *   le profil (bouton gear) et depuis Home (badge HelloHero)
 *
 * Items (de gauche à droite) :
 *  1. Aujourd'hui → /dashboard
 *  2. Riffs → /riffs (item normal, plus le FAB)
 *  3. [FAB +] → ouvre RiffEditor (composer)
 *  4. Ma musique → /library
 *  5. Profil → /profile (redirect /u/<moi> si connecté)
 */

type Item = {
  to: string;
  label: string;
  icon: React.ReactNode;
  matchPrefixes?: string[];
};

const LEFT_ITEMS: Item[] = [
  {
    to: '/dashboard',
    label: "Aujourd'hui",
    // NB : pas de '/' dans matchPrefixes — la Landing est hors Layout
    // (MobileNav jamais rendu dessus) et '/' via startsWith matcherait
    // toutes les routes.
    icon: <Home size={20} />,
    matchPrefixes: ['/dashboard'],
  },
  {
    to: '/riffs',
    label: 'Riffs',
    icon: <Flame size={20} />,
    matchPrefixes: ['/riffs', '/riff-of-the-week'],
  },
];

const RIGHT_ITEMS: Item[] = [
  {
    to: '/library',
    label: 'Ma musique',
    icon: <Library size={20} />,
    matchPrefixes: ['/songs', '/setlists', '/library'],
  },
  {
    to: '/profile',
    label: 'Profil',
    icon: <User size={20} />,
    matchPrefixes: ['/profile', '/u/'],
  },
];

interface MobileNavProps {
  /** Ouvre le composer riff global (RiffEditor monté dans Layout). */
  onComposeClick: () => void;
}

export function MobileNav({ onComposeClick }: MobileNavProps) {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/85 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 items-end">
        {LEFT_ITEMS.map((it) => (
          <NavItem key={it.to} item={it} currentPath={location.pathname} />
        ))}

        {/* === FAB CENTRAL "+" ===
            Bouton "add" au centre, déborde de 16px vers le haut.
            Gradient or, shadow forte, ouvre le RiffEditor via prop. */}
        <div className="relative -mt-4 flex justify-center">
          <button
            type="button"
            onClick={onComposeClick}
            aria-label="Publier un riff"
            className="group relative flex h-[60px] w-[60px] items-center justify-center rounded-full bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold-strong transition-transform active:scale-95"
          >
            <Plus size={28} strokeWidth={2.6} />
          </button>
        </div>

        {RIGHT_ITEMS.map((it) => (
          <NavItem key={it.to} item={it} currentPath={location.pathname} />
        ))}
      </div>
    </nav>
  );
}

// ─── Item normal ────────────────────────────────────────────────────

function NavItem({ item, currentPath }: { item: Item; currentPath: string }) {
  const active =
    currentPath === item.to ||
    (item.matchPrefixes
      ? item.matchPrefixes.some((p) =>
          p.endsWith('/')
            ? currentPath.startsWith(p)
            : currentPath === p || currentPath.startsWith(p + '/')
        )
      : false);
  return (
    <NavLink
      to={item.to}
      className={clsx(
        'relative flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider transition-colors',
        active ? 'text-gold' : 'text-text-soft hover:text-text'
      )}
    >
      <ActiveIndicator active={active} />
      <span
        className={clsx(
          'flex h-5 w-5 items-center justify-center transition-all',
          active && 'drop-shadow-[0_0_6px_rgb(var(--gold-glow)/0.55)]'
        )}
      >
        {item.icon}
      </span>
      <span className="text-center leading-tight">{item.label}</span>
    </NavLink>
  );
}

/**
 * Barre-indicateur dorée en haut de l'onglet actif + glow. Donne le
 * feedback « tab actif » d'une bottom nav d'app native.
 */
function ActiveIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="absolute inset-x-0 top-0 flex justify-center" aria-hidden>
      <span className="h-0.5 w-8 rounded-full bg-gold shadow-[0_0_8px_rgb(var(--gold-glow)/0.6)]" />
    </span>
  );
}
