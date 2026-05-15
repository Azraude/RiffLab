import { lazy, Suspense } from 'react';
import { useCanRender3D } from '@/hooks/useCanRender3D';
import { Scene3DFallback, Scene3DSkeleton } from './sceneFallbacks';

const HeroScene3D = lazy(() => import('./HeroScene3D'));

/**
 * Lazy wrapper pour HeroScene3D. Gate via useCanRender3D : mobile,
 * reduced-motion, low-end devices, et prefs.effects3D = false renvoient
 * tous le fallback gradient noir + halo gold.
 *
 * Pendant le téléchargement du chunk Three.js + du .glb (~110 MB pour
 * studio-scene non compressé), le skeleton shimmer s'affiche pour pas
 * de flash blanc.
 */
export function HeroScene3DLazy() {
  const canRender = useCanRender3D();
  if (!canRender) return <Scene3DFallback />;

  return (
    <Suspense fallback={<Scene3DSkeleton />}>
      <HeroScene3D />
    </Suspense>
  );
}
