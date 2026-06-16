import { NavLink, useLocation } from 'react-router-dom';
import { Music2, Target, Wrench, Settings as SettingsIcon } from 'lucide-react';
import { RiffLabLogo } from '@/components/brand/RiffLabLogo';
import clsx from 'clsx';

/**
 * Bottom nav mobile — 5 items max (limite UX mobile).
 *
 * Refonte sess 26 : avant 5 items qui pointaient direct vers /songs
 * /chords /scales + bouton Outils qui ouvrait un sheet avec 3 outils.
 * Maintenant : 5 items qui pointent vers les hubs ou les pages clés.
 *
 * Items :
 *  1. Home → /dashboard
 *  2. Ma musique → /library (hub)
 *  3. Mon plan → /plan
 *  4. Outils → /tools (hub)
 *  5. Préférences → /settings
 *
 * Pour rester actif quand on est dans une sous-page (ex: /songs, /chords),
 * on check les matchPrefixes. L'ancien sheet outils est supprimé : maintenant
 * on tap "Outils" et on arrive sur le hub /tools qui propose les 4 outils.
 */

type Item = {
  to: string;
  label: string;
  icon: React.ReactNode;
  /** URLs additionnelles qui doivent aussi marquer comme actif */
  matchPrefixes?: string[];
};

const ITEMS: Item[] = [
  {
    to: '/library',
    label: 'Ma musique',
    icon: <Music2 size={20} />,
    matchPrefixes: ['/songs', '/setlists', '/riffs', '/riff-of-the-week', '/library'],
  },
  {
    to: '/plan',
    label: 'Mon plan',
    icon: <Target size={20} />,
    matchPrefixes: ['/plan', '/stats'],
  },
  {
    to: '/tools',
    label: 'Outils',
    icon: <Wrench size={20} />,
    matchPrefixes: ['/tools', '/tuner', '/metronome', '/ear-training'],
  },
  {
    to: '/settings',
    label: 'Préférences',
    icon: <SettingsIcon size={20} />,
    matchPrefixes: ['/settings', '/profile'],
  },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {/* Home — flamme logo RiffLab. Animation flicker active toujours,
            opacity réduite quand inactif pour rester reconnaissable
            comme nav (le "tab actif" doit ressortir). */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            clsx(
              'relative flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider transition-colors',
              isActive ? 'text-gold' : 'text-text-soft hover:text-text'
            )
          }
        >
          {({ isActive }) => (
            <>
              <ActiveIndicator active={isActive} />
              <span
                className={clsx(
                  'flex h-5 w-5 items-center justify-center transition-all',
                  isActive ? 'opacity-100 drop-shadow-[0_0_6px_rgb(var(--gold-glow)/0.55)]' : 'opacity-60'
                )}
              >
                <RiffLabLogo size={20} />
              </span>
              <span>Home</span>
            </>
          )}
        </NavLink>

        {ITEMS.map((it) => {
          const active =
            location.pathname === it.to ||
            (it.matchPrefixes
              ? it.matchPrefixes.some((p) =>
                  p.endsWith('/') ? location.pathname.startsWith(p) : location.pathname === p || location.pathname.startsWith(p + '/')
                )
              : false);
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={clsx(
                'relative flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider transition-colors',
                active ? 'text-gold' : 'text-text-soft hover:text-text'
              )}
            >
              <ActiveIndicator active={active} />
              <span
                className={clsx(
                  'flex items-center justify-center transition-all',
                  active && 'drop-shadow-[0_0_6px_rgb(var(--gold-glow)/0.55)]'
                )}
              >
                {it.icon}
              </span>
              <span>{it.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Barre-indicateur dorée en haut de l'onglet actif + glow. Donne le
 * feedback « tab actif » d'une bottom nav d'app native (vs simple
 * changement de couleur du texte, trop discret en répèt).
 */
function ActiveIndicator({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="absolute inset-x-0 top-0 flex justify-center" aria-hidden>
      <span className="h-0.5 w-8 rounded-full bg-gold shadow-[0_0_8px_rgb(var(--gold-glow)/0.6)]" />
    </span>
  );
}
