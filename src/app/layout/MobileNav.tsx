import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Music2, Grid3x3, Waves, Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';

const items = [
  { to: '/dashboard', label: 'Jour', icon: <LayoutDashboard size={20} /> },
  { to: '/songs', label: 'Sons', icon: <Music2 size={20} /> },
  { to: '/chords', label: 'Accords', icon: <Grid3x3 size={20} /> },
  { to: '/scales', label: 'Gammes', icon: <Waves size={20} /> },
  { to: '/settings', label: 'Réglages', icon: <SettingsIcon size={20} /> },
];

export function MobileNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center gap-1 py-3 text-[10px] uppercase tracking-wider transition-colors',
                isActive ? 'text-gold' : 'text-text-soft hover:text-text'
              )
            }
          >
            {it.icon}
            <span>{it.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
