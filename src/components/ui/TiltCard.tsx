import { useEffect, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import clsx from 'clsx';

/**
 * TiltCard — wrap des cards interactives avec un effet 3D tilt subtil suivant
 * la souris. Désactivé sur écran tactile / sans hover (perf + ergonomie).
 *
 * Max ±8° de rotation, springé pour éviter le jitter. Reset smooth au
 * mouseLeave. La perspective vit sur le wrapper pour que la transformation
 * inner reste prévisible quoi qu'il y ait à l'intérieur (Link, Card, etc.).
 */
interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Intensité max en degrés. Défaut 8. */
  maxTilt?: number;
}

export function TiltCard({ children, className, maxTilt = 8 }: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [maxTilt, -maxTilt]), {
    stiffness: 240,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-maxTilt, maxTilt]), {
    stiffness: 240,
    damping: 22,
  });

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // hover: hover & pointer: fine = écran avec souris (pas tactile, pas
    // stylet imprécis). matchMedia est synchro et réactif au branchement
    // d'une souris à chaud.
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)');
    setEnabled(mql.matches);
    const handler = (e: MediaQueryListEvent) => setEnabled(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={clsx(className)} style={{ perspective: 900 }}>
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          x.set((e.clientX - rect.left) / rect.width - 0.5);
          y.set((e.clientY - rect.top) / rect.height - 0.5);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
        className="h-full w-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
