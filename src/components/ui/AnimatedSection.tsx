import { motion, type Variants } from 'framer-motion';
import type { ReactNode, ComponentProps } from 'react';

/**
 * Variants partagées pour les sections animées au scroll. Utilisées avec
 * Framer Motion `whileInView` + `viewport={{ once: true, amount: 0.2-0.3 }}`.
 *
 * - `fadeUp` : opacity 0 → 1 + y +24 → 0 sur 0.4s ease-out
 * - `staggerContainer` : déclenche les enfants en cascade (default 80ms)
 * - `staggerItem` : variants enfant compatibles avec staggerContainer
 */
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] },
  },
};

export const staggerContainerVariants = (stagger = 0.08, delayChildren = 0.1): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren,
    },
  },
});

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 1, 0.5, 1] },
  },
};

/**
 * Section animée — wrapper convivial. Sur première apparition dans le
 * viewport, fade + slide-up. Re-render ne re-déclenche pas (once: true).
 */
interface AnimatedSectionProps extends Omit<ComponentProps<typeof motion.div>, 'variants'> {
  children: ReactNode;
  /** Pourcentage de la section visible avant de déclencher. Défaut 0.25. */
  amount?: number;
}
export function AnimatedSection({
  children,
  amount = 0.25,
  className,
  ...rest
}: AnimatedSectionProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Grid animée — wrapper qui anime ses enfants directs en cascade. Use
 * <AnimatedItem> dedans (ou n'importe quel motion component qui suit
 * les variants `staggerItemVariants`).
 */
interface StaggerGridProps extends Omit<ComponentProps<typeof motion.div>, 'variants'> {
  children: ReactNode;
  stagger?: number;
  amount?: number;
}
export function StaggerGrid({
  children,
  stagger = 0.06,
  amount = 0.15,
  className,
  ...rest
}: StaggerGridProps) {
  return (
    <motion.div
      variants={staggerContainerVariants(stagger)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Item enfant à mettre dans <StaggerGrid>. Hérite des variants parent. */
export function StaggerItem({
  children,
  className,
  ...rest
}: Omit<ComponentProps<typeof motion.div>, 'variants'> & { children: ReactNode }) {
  return (
    <motion.div variants={staggerItemVariants} className={className} {...rest}>
      {children}
    </motion.div>
  );
}
