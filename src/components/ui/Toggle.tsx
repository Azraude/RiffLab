import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

type ToggleProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & {
  label?: string;
};

/**
 * Toggle switch — palette stricte noir / or RiffLab.
 *  - Track 44×24px (wrapper hits the 44px tap target target via padding)
 *  - OFF: bg-border, thumb blanc à gauche
 *  - ON: bg-gold, thumb blanc à droite, ombre dorée
 *  - Pas de bleu iOS — c'est volontaire.
 */
export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  ({ checked, onChange, disabled, className, label, ...props }, ref) => (
    <label
      className={clsx(
        'relative inline-flex items-center cursor-pointer select-none',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
        {...props}
      />
      <span
        className={clsx(
          'relative h-6 w-11 rounded-full transition-colors duration-200 ease-out-quart',
          'bg-border peer-checked:bg-gold',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-gold-bright peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-bg',
          'peer-checked:shadow-gold'
        )}
      >
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm',
            'transition-transform duration-200 ease-out-quart'
          )}
          style={{ transform: checked ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </span>
      {label && <span className="ml-3 text-sm">{label}</span>}
    </label>
  )
);
Toggle.displayName = 'Toggle';
