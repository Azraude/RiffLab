/**
 * FloatingAmp3D — ampli flottant pour décorer la page Métronome.
 * Charge `public/models/amp.glb` (8.5 MB). Camera fixe, rotation Y
 * lente, particules dorées subtiles. Décoratif uniquement.
 */
import { Canvas } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  StudioLights,
  FloatingGroup,
  GoldParticles,
  GLBErrorBoundary,
  ensureTransparentScene,
  stripSkyboxes,
} from './sceneHelpers';
import { Scene3DFallback } from './sceneFallbacks';

const MODEL_PATH = '/models/amp.glb';

function AmpMesh() {
  const { scene } = useGLTF(MODEL_PATH);
  const cloned = useMemo(() => {
    const c = scene.clone();
    stripSkyboxes(c);
    return c;
  }, [scene]);
  return <primitive object={cloned} scale={1.3} />;
}

function Scene() {
  return (
    <>
      <StudioLights
        keyIntensity={1.0}
        fillIntensity={0.5}
        ambientIntensity={0.2}
        extraGoldFill={false}
      />
      <Suspense fallback={null}>
        <FloatingGroup rotationSpeed={0.0015} levitationAmp={0.04} levitationFreq={0.25}>
          <AmpMesh />
        </FloatingGroup>
      </Suspense>
      <GoldParticles count={30} spread={10} height={8} opacity={0.25} />
    </>
  );
}

export default function FloatingAmp3D() {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    fetch(MODEL_PATH, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) {
          console.warn(`[FloatingAmp3D] ${MODEL_PATH} retourne ${res.status} — fallback`);
          setShowFallback(true);
        }
      })
      .catch(() => setShowFallback(true));
  }, []);

  if (showFallback) return <Scene3DFallback />;

  return (
    <GLBErrorBoundary fallback={<Scene3DFallback />} modelPath={MODEL_PATH}>
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0.3, 4.5], fov: 38 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, premultipliedAlpha: false }}
        onCreated={ensureTransparentScene}
        style={{ pointerEvents: 'none', background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </GLBErrorBoundary>
  );
}

useGLTF.preload(MODEL_PATH);
