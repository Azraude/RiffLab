/**
 * SettingsRow — ligne de réglage iOS : icône + label + (valeur mono gold +
 * chevron) OU toggle. Rendue en <Link>, <button> ou <div> selon les props.
 * Tap target ≥ 48px. Séparateur bas sauf `isLast`.
 */
import { Link } from 'react-router-dom';
import { ChevronRight, Lock, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { Toggle } from '@/components/ui/Toggle';

interface SettingsRowProps {
  icon?: LucideIcon;
  label: string;
  /** Valeur affichée à droite (mono gold), avant le chevron. */
  value?: string;
  to?: string;
  onClick?: () => void;
  /** Affiche un toggle à droite au lieu du chevron. */
  toggle?: boolean;
  onToggleChange?: (v: boolean) => void;
  variant?: 'default' | 'danger';
  /** Pas de séparateur bas (dernière row du groupe). */
  isLast?: boolean;
  /** Row non interactive (ex: "À propos"). */
  disabled?: boolean;
  /** Badge cadenas premium. */
  locked?: boolean;
}

export function SettingsRow({
  icon: Icon,
  label,
  value,
  to,
  onClick,
  toggle,
  onToggleChange,
  variant = 'default',
  isLast = false,
  disabled = false,
  locked = false,
}: SettingsRowProps) {
  const interactive = !disabled && !toggle && (to || onClick);

  const inner = (
    <>
      {Icon && (
        <span
          className={clsx(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
            variant === 'danger' ? 'text-danger' : 'text-gold'
          )}
        >
          <Icon size={18} />
        </span>
      )}
      <span
        className={clsx(
          'flex-1 truncate text-sm',
          variant === 'danger' ? 'font-semibold text-danger' : 'text-text'
        )}
      >
        {label}
      </span>
      {locked && <Lock size={13} className="shrink-0 text-text-soft" />}
      {value && (
        <span className="shrink-0 truncate font-mono text-sm text-gold">{value}</span>
      )}
      {!toggle && !disabled && (to || onClick) && (
        <ChevronRight size={16} className="shrink-0 text-text-soft" />
      )}
      {toggle !== undefined && (
        <Toggle
          checked={toggle}
          onChange={(e) => onToggleChange?.(e.currentTarget.checked)}
        />
      )}
    </>
  );

  const base = clsx(
    'flex min-h-[48px] w-full items-center gap-3 px-4 py-2.5 text-left',
    !isLast && 'border-b border-border',
    interactive && 'transition-colors hover:bg-surface active:bg-surface'
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={base}>
        {inner}
      </Link>
    );
  }
  if (onClick && !disabled && !toggle) {
    return (
      <button type="button" onClick={onClick} className={base}>
        {inner}
      </button>
    );
  }
  // Toggle row ou row non-interactive
  return <div className={base}>{inner}</div>;
}
