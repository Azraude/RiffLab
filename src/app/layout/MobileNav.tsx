import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Music2, Target } from 'lucide-react';
import { RiffLabLogo } from '@/components/brand/RiffLabLogo';
import { NavAvatar } from '@/components/nav/NavAvatar';
import clsx from 'clsx';

/**
 * Bottom nav mobile — 5 items pattern "central FAB" Instagram/TikTok.
 *
 * Refonte sess SET-MOBILENAV : le 5ème item "Préférences" devient
 * un AVATAR (style réseau social). Tap → /profile (connecté) ou
 * LoginModal (déconnecté). Les préférences restent accessibles
 * via Profile → row "Préférences" et via Sidebar desktop.
 *
 * Items (de gauche à droite) :
 *  1. Aujourd'hui → /dashboard
 *  2. Ma musique → /library (englobe songs/setlists)
 *  3. 🎸 RIFFS (central, 60px rond gold notch protruding)
 *  4. Mon plan → /plan (englobe stats)
 *  5. AVATAR → /profile (NavAvatar component)
 *
 * "Outils" plus dans le MobileNav (accessible via /tools URL direct
 * ou sidebar desktop). Justification : l'user fait surtout des riffs,
 * pas du métronome.
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
    label: 'Aujourd\'hui',
    icon: <LayoutDashboard size={20} />,
    matchPrefixes: ['/dashboard'],
  },
  {
    to: '/library',
    label: 'Ma musique',
    icon: <Music2 size={20} />,
    matchPrefixes: ['/songs', '/setlists', '/riff-of-the-week', '/library'],
  },
];

const RIGHT_ITEMS: Item[] = [
  {
    to: '/plan',
    label: 'Mon plan',
    icon: <Target size={20} />,
    matchPrefixes: ['/plan', '/stats'],
  },
  // 5ème position = NavAvatar (sess SET-MOBILENAV), pas un NavItem standard.
];

export function MobileNav() {
  const location = useLocation();
  const riffsActive =
    location.pathname === '/riffs' ||
    location.pathname.startsWith('/riffs/') ||
    location.pathname.startsWith('/riff-of-the-week');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/85 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5 items-end">
        {LEFT_ITEMS.map((it) => (
          <NavItem key={it.to} item={it} currentPath={location.pathname} />
        ))}

        {/* === BOUTON CENTRAL RIFFS ===
            Proéminent, déborde de 16px vers le haut (notch).
            Cercle 60px avec gradient gold + shadow forte. */}
        <div className="relative -mt-4 flex justify-center">
          <NavLink
            to="/riffs"
            aria-label="Riffs"
            className={clsx(
              'group relative flex h-[60px] w-[60px] items-center justify-center rounded-full',
              'bg-gradient-to-b from-gold-bright to-gold text-bg shadow-gold-strong',
              'transition-transform active:scale-95',
              riffsActive && 'ring-2 ring-gold/40 ring-offset-2 ring-offset-surface'
            )}
          >
            {/* Pulse subtil quand actif (pas tap, juste indicateur état) */}
            {riffsActive && (
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-gold opacity-30 motion-safe:animate-ping"
                style={{ animationDuration: '2s' }}
              />
            )}
            <span className="relative flex h-7 w-7 items-center justify-center">
              <RiffLabLogo size={28} />
            </span>
          </NavLink>
        </div>

        {RIGHT_ITEMS.map((it) => (
          <NavItem key={it.to} item={it} currentPath={location.pathname} />
        ))}

        {/* 5ème slot : NavAvatar (sess SET-MOBILENAV) — pattern réseau social. */}
        <NavAvatar />
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
