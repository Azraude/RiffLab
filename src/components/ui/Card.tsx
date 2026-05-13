import type { HTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, hover = false, glow = false, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        'card',
        hover && 'card-hover',
        glow && 'border-border-gold shadow-gold',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx('eyebrow mb-3', className)}>{children}</div>;
}

export function CardHeading({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={clsx('display text-display-sm mb-1', className)}>
      {children}
    </h2>
  );
}
