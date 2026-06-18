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
  Sparkles,
  Target,
  BarChart3,
  Wrench,
  Disc3,
  Flame,
  Settings as SettingsIcon,
  UserCircle2,
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

type Section = 'perso' | 'apprendre' | 'communaute';

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
    // Note : /riffs et /riff-of-the-week SORTIS de cette section pour être
    // top-level dans 'Communauté' (refonte sess 27 Phase 0 — Melvin veut
    // les Riffs accessibles en 1 tap, pas planqués dans Ma musique).
    matchPrefixes: ['/songs', '/setlists'],
  },
  {
    to: '/resources',
    label: 'Bibliothèque',
    icon: <BookOpen size={18} />,
    section: 'perso',
    matchPrefixes: ['/chords', '/scales', '/strum-patterns'],
  },

  // Créer & apprendre
  {
    to: '/create',
    label: 'Créer',
    icon: <Wand2 size={18} />,
    section: 'apprendre',
    matchPrefixes: ['/songs/new'],
  },
  // Studio (fusion ex-Progressions + ex-Composer sess PROG-STUDIO) —
  // accès direct depuis sidebar, plus planqué dans Bibliothèque.
  {
    to: '/progressions',
    label: 'Studio',
    icon: <Sparkles size={18} />,
    section: 'apprendre',
    matchPrefixes: ['/progressions', '/composer'],
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

  // Communauté — riffs + mode jam (zone "vibe" partagée)
  {
    to: '/riffs',
    label: 'Riffs',
    icon: <Flame size={18} />,
    section: 'communaute',
    matchPrefixes: ['/riffs', '/riff-of-the-week'],
  },
  { to: '/jam', label: 'Mode jam', icon: <Disc3 size={18} />, section: 'communaute' },
];

const sectionLabels: Record<Section, string> = {
  perso: 'Espace perso',
  apprendre: 'Créer & apprendre',
  communaute: 'Communauté',
};

const SECTION_ORDER: Section[] = ['perso', 'apprendre', 'communaute'];

export function Sidebar() {
  const { t } = useTranslation();
  const grouped = items.reduce<Record<Section, NavItem[]>>(
    (acc, it) => {
      (acc[it.section] ??= []).push(it);
      return acc;
    },
    { perso: [], apprendre: [], communaute: [] }
  );

  return (
    <aside
      data-tutorial-id="sidebar-nav"
      className={clsx(
        'hidden border-r border-border bg-surface md:flex md:flex-col',
        // Sticky full viewport pour que le footer soit toujours visible.
        // overflow-y-auto sur le contenu pour le scroll interne si jamais
        // les items débordent (cas extrême sur petit écran).
        'md:sticky md:top-0 md:h-screen md:overflow-y-auto'
      )}
    >
      {/* Inner padded container — header + nav + footer flex column */}
      <div className="flex h-full flex-col px-5 py-6">
        <Link to="/" className="mb-7 flex items-center gap-2.5">
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

        {/* Footer sidebar — section COMPTE : Mon profil + Préférences + langue + auth.
            Mon profil ajouté sess MEGA pour découvrabilité (avant il fallait
            ouvrir le dropdown AuthMenu pour y accéder). Pas connecté → /profile
            propose un écran "Connecte-toi" (Profile.tsx gère ce cas).
            shrink-0 garantit qu'il reste visible même si nav contenu déborde. */}
        <div className="mt-4 shrink-0 space-y-1.5 border-t border-border pt-4 pb-2">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-surface-2 text-gold'
                  : 'text-text-soft hover:bg-surface-2 hover:text-text'
              )
            }
          >
            <UserCircle2 size={16} className="opacity-80" />
            <span>Mon profil</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-surface-2 text-gold'
                  : 'text-text-soft hover:bg-surface-2 hover:text-text'
              )
            }
          >
            <SettingsIcon size={16} className="opacity-80" />
            <span>{t('nav.settings')}</span>
          </NavLink>
          <LanguageSwitcher />
          <AuthMenu />
        </div>
      </div>
    </aside>
  );
}
