import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import clsx from 'clsx';

type Variant = 'primary' | 'ghost' | 'subtle' | 'hero';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gold text-bg font-semibold hover:bg-gold-bright hover:shadow-gold hover:-translate-y-px',
  ghost:
    'border border-border-gold text-text hover:border-gold-soft hover:bg-gold/5',
  subtle: 'text-text-muted hover:text-text hover:bg-surface-2',
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

/**
 * Bouton principal. Variants : primary | ghost | subtle. Le primary
 * applique un `whileTap` framer-motion (scale 0.97) pour un feedback
 * tactile premium. Les autres variants restent statiques pour ne pas
 * surcharger l'UI quand ils sont en grand nombre (filtres, tags).
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    const wantsTap = variant === 'primary' || variant === 'hero';
    const tap = variant === 'hero' ? { scale: 0.96 } : { scale: 0.97 };
    return (
      <motion.button
        ref={ref}
        whileTap={wantsTap ? tap : undefined}
        className={clsx(
          'inline-flex items-center justify-center gap-2 transition-all duration-200 ease-out-quart disabled:cursor-not-allowed disabled:opacity-50',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {/* Wrap children dans une span relative pour les passer au-dessus
            du pseudo-element ::before du variant hero (sheen) */}
        {variant === 'hero' ? <span className="relative inline-flex items-center gap-2">{children}</span> : children}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
