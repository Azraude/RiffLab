import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Music2,
  Disc3,
  Grid3x3,
  Waves,
  Timer,
  Mic,
  BarChart3,
  ListMusic,
  Workflow,
  Ear,
  Activity,
  Target,
  Sparkles,
  Settings as SettingsIcon,
} from 'lucide-react';
import clsx from 'clsx';

type Section = 'perso' | 'library' | 'tools' | 'account';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  section: Section;
};

const items: NavItem[] = [
  // Espace perso — quotidien
  { to: '/dashboard', label: "Aujourd'hui", icon: <LayoutDashboard size={18} />, section: 'perso' },
  { to: '/songs', label: 'Mes sons', icon: <Music2 size={18} />, section: 'perso' },
  { to: '/setlists', label: 'Setlists', icon: <ListMusic size={18} />, section: 'perso' },
  { to: '/riff-of-the-week', label: 'Riff du moment', icon: <Sparkles size={18} />, section: 'perso' },
  { to: '/jam', label: 'Mode jam', icon: <Disc3 size={18} />, section: 'perso' },

  // Bibliothèques — référence
  { to: '/chords', label: 'Accords', icon: <Grid3x3 size={18} />, section: 'library' },
  { to: '/scales', label: 'Gammes', icon: <Waves size={18} />, section: 'library' },
  { to: '/progressions', label: 'Progressions', icon: <Workflow size={18} />, section: 'library' },
  { to: '/strum-patterns', label: 'Rythmiques', icon: <Activity size={18} />, section: 'library' },

  // Outils — utilitaires
  { to: '/tuner', label: 'Tuner', icon: <Mic size={18} />, section: 'tools' },
  { to: '/metronome', label: 'Métronome', icon: <Timer size={18} />, section: 'tools' },
  { to: '/ear-training', label: 'Oreille', icon: <Ear size={18} />, section: 'tools' },

  // Compte — tracking + paramètres
  { to: '/stats', label: 'Stats', icon: <BarChart3 size={18} />, section: 'account' },
  { to: '/plan', label: 'Mon plan', icon: <Target size={18} />, section: 'account' },
  { to: '/settings', label: 'Préférences', icon: <SettingsIcon size={18} />, section: 'account' },
];

const sectionLabels: Record<Section, string> = {
  perso: 'Espace perso',
  library: 'Bibliothèques',
  tools: 'Outils',
  account: 'Compte',
};

const SECTION_ORDER: Section[] = ['perso', 'library', 'tools', 'account'];

export function Sidebar() {
  const grouped = items.reduce<Record<Section, NavItem[]>>(
    (acc, it) => {
      (acc[it.section] ??= []).push(it);
      return acc;
    },
    { perso: [], library: [], tools: [], account: [] }
  );

  return (
    <aside className="hidden border-r border-border bg-surface px-5 py-7 md:flex md:flex-col">
      <Link to="/" className="mb-8 flex items-center gap-3">
        <span className="inline-block h-2 w-2 rounded-full bg-gold-bright shadow-gold" />
        <span className="display text-[28px] tracking-wide">RiffLab</span>
      </Link>

      {SECTION_ORDER.map((sec) => (
        <div key={sec} className="mb-2">
          <div className="label-small mb-1 px-2 mt-3">{sectionLabels[sec]}</div>
          {grouped[sec].map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-surface-2 text-gold'
                    : 'text-text-muted hover:bg-surface-2 hover:text-text'
                )
              }
            >
              <span className="opacity-90">{it.icon}</span>
              {it.label}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
