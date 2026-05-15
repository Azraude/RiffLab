/**
 * FloatingGuitar3D — guitare flottante réutilisable.
 *
 * Props :
 * - `model` : 'rose' | 'classic' (chemin /models/guitar-fender-{rose,classic}.glb)
 * - `rotationSpeed` : rad/frame, défaut 0.002
 * - `cameraDistance` : float, défaut 4.5 (plus serré = gros plan manche)
 * - `cameraY` : float, défaut 0.2
 * - `intensity` : 'subtle' | 'normal' — règle les lumières et particules
 *
 * Idéal pour décor de carte ou page hero secondaire. La position absolute
 * est laissée au parent (le composant remplit son container).
 */
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  StudioLights,
  FloatingGroup,
  GoldParticles,
  GLBErrorBoundary,
} from './sceneHelpers';
import { Scene3DFallback } from './sceneFallbacks';

export type GuitarModel = 'rose' | 'classic';

const MODEL_PATHS: Record<GuitarModel, string> = {
  rose: '/models/guitar-fender-rose.glb',
  classic: '/models/guitar-fender-classic.glb',
};

interface Props {
  model: GuitarModel;
  rotationSpeed?: number;
  cameraDistance?: number;
  cameraY?: number;
  intensity?: 'subtle' | 'normal';
}

function GuitarMesh({ model }: { model: GuitarModel }) {
  const { scene } = useGLTF(MODEL_PATHS[model]);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} scale={1.4} />;
}

function Scene({ model, rotationSpeed, intensity }: Props) {
  const isSubtle = intensity === 'subtle';
  return (
    <>
      <StudioLights
        keyIntensity={isSubtle ? 0.9 : 1.4}
        fillIntensity={isSubtle ? 0.4 : 0.7}
        ambientIntensity={isSubtle ? 0.18 : 0.22}
        extraGoldFill={!isSubtle}
      />
      <Suspense fallback={null}>
        <FloatingGroup
          rotationSpeed={rotationSpeed ?? 0.002}
          levitationAmp={0.05}
          levitationFreq={0.3}
        >
          <GuitarMesh model={model} />
        </FloatingGroup>
      </Suspense>
      <GoldParticles
        count={isSubtle ? 30 : 50}
        spread={10}
        height={8}
        opacity={isSubtle ? 0.25 : 0.4}
      />
    </>
  );
}

export default function FloatingGuitar3D({
  model,
  rotationSpeed = 0.002,
  cameraDistance = 4.5,
  cameraY = 0.2,
  intensity = 'normal',
}: Props) {
  const [showFallback, setShowFallback] = useState(false);
  const modelPath = MODEL_PATHS[model];

  useEffect(() => {
    fetch(modelPath, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) {
          console.warn(`[FloatingGuitar3D] ${modelPath} retourne ${res.status} — fallback`);
          setShowFallback(true);
        }
      })
      .catch(() => setShowFallback(true));
  }, [modelPath]);

  if (showFallback) return <Scene3DFallback />;

  return (
    <GLBErrorBoundary fallback={<Scene3DFallback />} modelPath={modelPath}>
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, cameraY, cameraDistance], fov: 38 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <Scene
            model={model}
            rotationSpeed={rotationSpeed}
            cameraDistance={cameraDistance}
            cameraY={cameraY}
            intensity={intensity}
          />
        </Suspense>
      </Canvas>
    </GLBErrorBoundary>
  );
}

// Préchargements opportunistes (uniquement si l'utilisateur arrive sur
// une page qui appelle FloatingGuitar3D, sinon le code n'est même pas
// chargé grâce à lazy())
useGLTF.preload('/models/guitar-fender-rose.glb');
useGLTF.preload('/models/guitar-fender-classic.glb');
