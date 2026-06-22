/**
 * SettingsRow + SettingsGroup — primitives partagées iOS-style.
 *
 * Utilisés dans Profile.tsx (sess SET-MOBILENAV) et Settings.tsx.
 * Pattern : container border rounded 2xl + rows h-14 px-4 séparés par
 * border-b/40 last:none. Chaque row a un icône colorée gauche, label
 * central, sous-texte optionnel, et chevron droite si navigable.
 */
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';

/** Container card-style qui wrap des `<SettingsRow>` empilés. */
export function SettingsGroup({
  label,
  children,
}: {
  /** Label MONO UPPERCASE rendu au-dessus du groupe (optionnel). */
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="px-1 font-mono text-[10px] uppercase tracking-wider text-gold-soft">
          {label}
        </div>
      )}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface">
        {children}
      </div>
    </div>
  );
}

interface SettingsRowProps {
  icon?: React.ReactNode;
  label: string;
  /** Texte secondaire sous le label (gris). */
  sub?: string;
  /** Si fourni → la row est un Link. */
  to?: string;
  /** Si fourni (et pas `to`) → la row est un button. */
  onClick?: () => void;
  /** Affiche un ChevronRight si la row est navigable. Auto-on si `to`. */
  chevron?: boolean;
  /** Style danger (rouge subtle). */
  danger?: boolean;
  /** Children à afficher à droite (toggle, valeur, etc.) au lieu du chevron. */
  trailing?: React.ReactNode;
}

export function SettingsRow({
  icon,
  label,
  sub,
  to,
  onClick,
  chevron,
  danger = false,
  trailing,
}: SettingsRowProps) {
  const showChevron = chevron ?? !!to;

  const className = clsx(
    'flex h-14 w-full items-center gap-3 border-b border-border/40 px-4 text-left transition-colors last:border-0',
    danger ? 'text-danger hover:bg-danger/5' : 'text-text hover:bg-surface-2',
    !to && !onClick && 'cursor-default',
  );

  const content = (
    <>
      {icon && (
        <span
          className={clsx(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
            danger ? 'bg-danger/10 text-danger' : 'bg-gold/10 text-gold',
          )}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        {sub && <div className="mt-0.5 text-xs text-text-soft">{sub}</div>}
      </div>
      {trailing && <span className="shrink-0">{trailing}</span>}
      {showChevron && !trailing && (
        <ChevronRight size={16} className="shrink-0 text-text-soft" />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  // Row inerte (info-only)
  return <div className={className}>{content}</div>;
}
