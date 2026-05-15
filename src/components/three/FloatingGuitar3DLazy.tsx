import { lazy, Suspense } from 'react';
import { useCanRender3D } from '@/hooks/useCanRender3D';
import { Scene3DFallback, Scene3DSkeleton } from './sceneFallbacks';

const FloatingGuitar3D = lazy(() => import('./FloatingGuitar3D'));

interface Props {
  model: 'rose' | 'classic';
  rotationSpeed?: number;
  cameraDistance?: number;
  cameraY?: number;
  intensity?: 'subtle' | 'normal';
}

/**
 * Lazy wrapper pour FloatingGuitar3D. Gate via useCanRender3D + Suspense
 * avec Scene3DSkeleton pendant le download. Si Three.js n'est pas
 * autorisé (mobile, low-end, prefs OFF), affiche directement le
 * gradient fallback sans charger le chunk.
 */
export function FloatingGuitar3DLazy(props: Props) {
  const canRender = useCanRender3D();
  if (!canRender) return <Scene3DFallback />;

  return (
    <Suspense fallback={<Scene3DSkeleton />}>
      <FloatingGuitar3D {...props} />
    </Suspense>
  );
}
