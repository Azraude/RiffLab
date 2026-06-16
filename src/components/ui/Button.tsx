import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

type Variant = 'primary' | 'ghost' | 'subtle' | 'hero' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  /** Affiche un spinner inline + désactive le bouton. Le contenu reste
   *  en place (largeur stable) sous un voile semi-transparent. */
  loading?: boolean;
  /** Bouton icône seul : ratio carré (tap target = hauteur du size). */
  icon?: boolean;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gold text-bg font-semibold hover:bg-gold-bright hover:shadow-gold hover:-translate-y-px',
  ghost:
    'border border-border-gold text-text hover:border-gold-soft hover:bg-gold/5',
  subtle: 'text-text-muted hover:text-text hover:bg-surface-2',
  danger:
    'border border-danger/40 text-danger hover:bg-danger/10 hover:border-danger/60',
  // Hero : actions critiques. Gradient gold-bright → gold, glow doré
  // permanent, sheen horizontal qui balaye au hover.
  hero:
    'relative overflow-hidden bg-gradient-to-b from-gold-bright to-gold text-bg font-semibold shadow-gold-strong hover:-translate-y-px before:absolute before:inset-y-0 before:-left-full before:w-full before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:transition-all before:duration-700 hover:before:left-full',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs rounded-lg md:h-8',
  md: 'h-11 px-4 text-sm rounded-xl md:h-10',
  lg: 'h-12 px-6 text-[15px] rounded-xl',
};

// Icon-only : carré, on neutralise le padding horizontal pour garder un
// tap target carré ≥44px (mobile) au lieu d'un rectangle étiré.
const iconSizes: Record<Size, string> = {
  sm: 'h-9 w-9 px-0 rounded-lg md:h-8 md:w-8',
  md: 'h-11 w-11 px-0 rounded-xl md:h-10 md:w-10',
  lg: 'h-12 w-12 px-0 rounded-xl',
};

const spinnerSize: Record<Size, number> = { sm: 14, md: 16, lg: 18 };

/**
 * Bouton principal. Variants : primary | ghost | subtle | danger | hero.
 * Le primary/hero applique un `whileTap` framer-motion (scale ~0.97) pour
 * un feedback tactile premium + une vibration haptique légère (10ms) sur
 * mobile. Les autres variants restent statiques pour ne pas surcharger
 * l'UI quand ils sont en grand nombre (filtres, tags).
 *
 * `loading` : spinner inline + bouton désactivé (contenu masqué, largeur
 * conservée). `icon` : bouton icône seul carré (tap target préservé).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', loading = false, icon = false, disabled, className, children, onClick, ...props },
    ref
  ) => {
    const wantsTap = variant === 'primary' || variant === 'hero';
    const tap = variant === 'hero' ? { scale: 0.96 } : { scale: 0.97 };

    const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
      // Haptique légère sur les actions primaires (mobile uniquement, no-op
      // ailleurs). Subtil — donne le « clic » physique d'une app native.
      if (wantsTap && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      onClick?.(e);
    };

    const inner = (
      <>
        {loading && (
          <Loader2 size={spinnerSize[size]} className="absolute animate-spin" aria-hidden />
        )}
        <span className={clsx('inline-flex items-center gap-2', loading && 'opacity-0')}>
          {children}
        </span>
      </>
    );

    return (
      <motion.button
        ref={ref}
        whileTap={wantsTap && !loading && !disabled ? tap : undefined}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        onClick={handleClick}
        className={clsx(
          'relative inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out-quart disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          icon ? iconSizes[size] : sizes[size],
          className
        )}
        {...props}
      >
        {/* Wrap dans une span relative pour passer au-dessus du
            pseudo-element ::before du variant hero (sheen) */}
        {variant === 'hero' ? <span className="relative inline-flex items-center justify-center gap-2">{inner}</span> : inner}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
