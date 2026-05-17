import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RiffLabLogo } from '@/components/brand/RiffLabLogo';
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
  Flame,
  Target,
  Sparkles,
  Settings as SettingsIcon,
} from 'lucide-react';
import clsx from 'clsx';

type Section = 'perso' | 'library' | 'tools' | 'account';

type NavItem = {
  to: string;
  /** Clé i18n dans nav.* (ex: 'today', 'songs') */
  labelKey: string;
  icon: React.ReactNode;
  section: Section;
};

const items: NavItem[] = [
  // Espace perso — quotidien
  { to: '/dashboard', labelKey: 'today', icon: <LayoutDashboard size={18} />, section: 'perso' },
  { to: '/songs', labelKey: 'songs', icon: <Music2 size={18} />, section: 'perso' },
  { to: '/setlists', labelKey: 'setlists', icon: <ListMusic size={18} />, section: 'perso' },
  { to: '/riff-of-the-week', labelKey: 'riffOfTheWeek', icon: <Sparkles size={18} />, section: 'perso' },
  { to: '/jam', labelKey: 'jam', icon: <Disc3 size={18} />, section: 'perso' },

  // Bibliothèques — référence
  { to: '/chords', labelKey: 'chords', icon: <Grid3x3 size={18} />, section: 'library' },
  { to: '/scales', labelKey: 'scales', icon: <Waves size={18} />, section: 'library' },
  { to: '/progressions', labelKey: 'progressions', icon: <Workflow size={18} />, section: 'library' },
  { to: '/riffs', labelKey: 'riffs', icon: <Flame size={18} />, section: 'library' },
  { to: '/strum-patterns', labelKey: 'strumPatterns', icon: <Activity size={18} />, section: 'library' },

  // Outils — utilitaires
  { to: '/tuner', labelKey: 'tuner', icon: <Mic size={18} />, section: 'tools' },
  { to: '/metronome', labelKey: 'metronome', icon: <Timer size={18} />, section: 'tools' },
  { to: '/ear-training', labelKey: 'earTraining', icon: <Ear size={18} />, section: 'tools' },

  // Compte — tracking + paramètres
  { to: '/stats', labelKey: 'stats', icon: <BarChart3 size={18} />, section: 'account' },
  { to: '/plan', labelKey: 'plan', icon: <Target size={18} />, section: 'account' },
  { to: '/settings', labelKey: 'settings', icon: <SettingsIcon size={18} />, section: 'account' },
];

const sectionLabelKeys: Record<Section, string> = {
  perso: 'sectionPerso',
  library: 'sectionLibrary',
  tools: 'sectionTools',
  account: 'sectionAccount',
};

const SECTION_ORDER: Section[] = ['perso', 'library', 'tools', 'account'];

export function Sidebar() {
  const { t } = useTranslation();
  const grouped = items.reduce<Record<Section, NavItem[]>>(
    (acc, it) => {
      (acc[it.section] ??= []).push(it);
      return acc;
    },
    { perso: [], library: [], tools: [], account: [] }
  );

  return (
    <aside
      data-tutorial-id="sidebar-nav"
      className="hidden border-r border-border bg-surface px-5 py-7 md:flex md:flex-col"
    >
      <Link to="/" className="mb-8 flex items-center gap-2.5">
        <RiffLabLogo size={26} />
        <span className="display text-[28px] tracking-wide">RiffLab</span>
      </Link>

      {SECTION_ORDER.map((sec) => (
        <div key={sec} className="mb-2">
          <div className="label-small mb-1 px-2 mt-3">{t(`nav.${sectionLabelKeys[sec]}`)}</div>
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
              {t(`nav.${it.labelKey}`)}
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  );
}
