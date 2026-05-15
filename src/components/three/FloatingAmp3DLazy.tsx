import { lazy, Suspense } from 'react';
import { useCanRender3D } from '@/hooks/useCanRender3D';
import { Scene3DFallback, Scene3DSkeleton } from './sceneFallbacks';

const FloatingAmp3D = lazy(() => import('./FloatingAmp3D'));

/**
 * Lazy wrapper pour FloatingAmp3D — même pattern que les autres lazy
 * scenes. Gate useCanRender3D + Suspense skeleton.
 */
export function FloatingAmp3DLazy() {
  const canRender = useCanRender3D();
  if (!canRender) return <Scene3DFallback />;

  return (
    <Suspense fallback={<Scene3DSkeleton />}>
      <FloatingAmp3D />
    </Suspense>
  );
}
