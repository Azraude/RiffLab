import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Settings as SettingsIcon } from 'lucide-react';
import clsx from 'clsx';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Boutons / actions custom à afficher à droite du titre. Sur mobile, l'icône
   *  Réglages est injectée APRÈS ces actions. Sur desktop, seules les actions
   *  custom sont visibles (Réglages est dans la sidebar). */
  children?: ReactNode;
  /** Affiche le lien Réglages (gear) sur mobile. Default: true.
   *  Mettre à false sur la page Settings elle-même. */
  showSettingsLink?: boolean;
  className?: string;
}

/**
 * Header de page unifié — title + subtitle + actions.
 *
 * Sur mobile, une icône gear vers /settings est ajoutée automatiquement
 * (puisque MobileNav n'a plus d'entrée Réglages). Sur desktop, la sidebar
 * a déjà Préférences donc on n'injecte rien.
 */
export function PageHeader({
  title,
  subtitle,
  children,
  showSettingsLink = true,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={clsx(
        'mb-8 flex flex-col gap-3 md:mb-9 md:flex-row md:items-center md:justify-between',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="display text-display-md">{title}</h1>
        {subtitle && <p className="mt-1 text-text-muted">{subtitle}</p>}
      </div>

      {(children || showSettingsLink) && (
        <div className="flex items-center gap-2">
          {children}
          {showSettingsLink && (
            <Link
              to="/settings"
              aria-label="Réglages"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-muted hover:border-gold-soft hover:text-text md:hidden"
            >
              <SettingsIcon size={18} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
