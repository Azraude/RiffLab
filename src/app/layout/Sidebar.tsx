import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RiffLabLogo } from '@/components/brand/RiffLabLogo';
import { AuthMenu } from '@/components/auth/AuthMenu';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import {
  LayoutDashboard,
  Music2,
  BookOpen,
  Wand2,
  Target,
  BarChart3,
  Wrench,
  Disc3,
  Settings as SettingsIcon,
} from 'lucide-react';
import clsx from 'clsx';

/**
 * Sidebar refondée sess 26 : 17 entrées → 8 + Préférences en footer.
 *
 * Logique : moins de bruit visuel, navigation par hubs au lieu de
 * tout exposer en top-level. Les pages individuelles (Songs, Chords,
 * etc.) restent accessibles via leurs URLs + via les hubs (cards).
 *
 * Pour rester safe sur les bookmarks et liens partagés : aucune
 * ancienne URL n'est cassée par cette refonte. Les outils ont des
 * doublons d'URL (/tools/tuner ET /tuner) qui rendent la même page.
 */

type Section = 'perso' | 'apprendre';

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  section: Section;
  /** URLs additionnelles qui doivent aussi highlight cet item comme actif
   *  (ex: /tools englobe /tuner, /metronome, /tools/*). */
  matchPrefixes?: string[];
};

const items: NavItem[] = [
  // Espace perso — quotidien
  { to: '/dashboard', label: 'Aujourd\'hui', icon: <LayoutDashboard size={18} />, section: 'perso' },
  {
    to: '/library',
    label: 'Ma musique',
    icon: <Music2 size={18} />,
    section: 'perso',
    matchPrefixes: ['/songs', '/setlists', '/riffs', '/riff-of-the-week'],
  },
  {
    to: '/resources',
    label: 'Bibliothèque',
    icon: <BookOpen size={18} />,
    section: 'perso',
    matchPrefixes: ['/chords', '/scales', '/progressions', '/strum-patterns'],
  },

  // Créer & apprendre
  {
    to: '/create',
    label: 'Créer',
    icon: <Wand2 size={18} />,
    section: 'apprendre',
    matchPrefixes: ['/composer', '/songs/new'],
  },
  { to: '/plan', label: 'Mon plan', icon: <Target size={18} />, section: 'apprendre' },
  { to: '/stats', label: 'Stats', icon: <BarChart3 size={18} />, section: 'apprendre' },
  {
    to: '/tools',
    label: 'Outils',
    icon: <Wrench size={18} />,
    section: 'apprendre',
    matchPrefixes: ['/tools/', '/tuner', '/metronome', '/ear-training'],
  },
  { to: '/jam', label: 'Mode jam', icon: <Disc3 size={18} />, section: 'apprendre' },
];

const sectionLabels: Record<Section, string> = {
  perso: 'Espace perso',
  apprendre: 'Créer & apprendre',
};

const SECTION_ORDER: Section[] = ['perso', 'apprendre'];

export function Sidebar() {
  const { t } = useTranslation();
  const grouped = items.reduce<Record<Section, NavItem[]>>(
    (acc, it) => {
      (acc[it.section] ??= []).push(it);
      return acc;
    },
    { perso: [], apprendre: [] }
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

      <nav className="flex-1">
        {SECTION_ORDER.map((sec) => (
          <div key={sec} className="mb-2">
            <div className="label-small mb-1 mt-3 px-2">{sectionLabels[sec]}</div>
            {grouped[sec].map((it) => (
              <NavLink
                key={it.to}
                to={it.to}
                end={!it.matchPrefixes}
                className={({ isActive }) => {
                  const customActive =
                    isActive ||
                    (it.matchPrefixes
                      ? it.matchPrefixes.some((p) =>
                          window.location.pathname.startsWith(p)
                        )
                      : false);
                  return clsx(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    customActive
                      ? 'bg-surface-2 text-gold'
                      : 'text-text-muted hover:bg-surface-2 hover:text-text'
                  );
                }}
              >
                <span className="opacity-90">{it.icon}</span>
                {it.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer sidebar : Préférences (icône discrete) + langue + auth.
          Séparé visuellement par une bordure pour distinguer du nav
          principal — c'est de l'admin, pas du workflow quotidien. */}
      <div className="mt-4 space-y-2 border-t border-border pt-4">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'bg-surface-2 text-gold'
                : 'text-text-soft hover:bg-surface-2 hover:text-text'
            )
          }
        >
          <SettingsIcon size={16} className="opacity-80" />
          <span className="text-xs">{t('nav.settings')}</span>
        </NavLink>
        <LanguageSwitcher />
        <AuthMenu />
      </div>
    </aside>
  );
}
