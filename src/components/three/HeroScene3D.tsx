/**
 * HeroScene3D — scène studio complète (2 amplis + guitare posée) en hero
 * de la landing. Charge `public/models/studio-scene.glb`.
 *
 * ⚠️ Le modèle fait actuellement ~110 MB → blacklisté du repo tant qu'il
 * n'est pas compressé via gltf.report. Sur Vercel, le fallback gradient
 * s'affiche jusqu'à ce que la version compressée soit poussée. En dev
 * local, Melvin a le fichier en place → la scène apparaît.
 *
 * Camera angle légèrement bas (perspective héroïque). Pas d'OrbitControls
 * (policy CLAUDE.md décoratif uniquement).
 */
import { Canvas, useThree } from '@react-three/fiber';
import { useGLTF, Preload } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useState } from 'react';
import {
  StudioLights,
  FloatingGroup,
  GoldParticles,
  Scene3DFallback,
  Scene3DSkeleton,
  GLBErrorBoundary,
} from './sceneHelpers';

const MODEL_PATH = '/models/studio-scene.glb';

// ─── Studio mesh ─────────────────────────────────────────────────────
function StudioModel() {
  const { scene } = useGLTF(MODEL_PATH);
  const cloned = useMemo(() => scene.clone(), [scene]);
  return <primitive object={cloned} scale={1.2} position={[0, -0.2, 0]} />;
}

// ─── Camera helper : auto-zoom léger sur breakpoint ──────────────────
function HeroCamera() {
  const { size, camera } = useThree();
  useEffect(() => {
    // Camera position en angle bas (perspective héroïque)
    // Plus serré en portrait pour ne pas avoir un studio minuscule
    const isPortrait = size.width / size.height < 1;
    if ('isPerspectiveCamera' in camera && (camera as { isPerspectiveCamera: boolean }).isPerspectiveCamera) {
      camera.position.set(isPortrait ? 0 : 0.6, 0.8, isPortrait ? 6.5 : 5.5);
      camera.lookAt(0, 0.1, 0);
    }
  }, [camera, size]);
  return null;
}

// ─── Scene ───────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <HeroCamera />
      <StudioLights keyIntensity={1.5} fillIntensity={0.8} extraGoldFill />
      <Suspense fallback={null}>
        <FloatingGroup rotationSpeed={0.001} levitationAmp={0.05} levitationFreq={0.3}>
          <StudioModel />
        </FloatingGroup>
      </Suspense>
      <GoldParticles count={50} spread={14} height={9} opacity={0.4} />
      {/* Précharge les autres modèles 3D de l'app pendant que le user
          regarde le hero — ils seront déjà en cache quand il navigue. */}
      <Preload all />
    </>
  );
}

// ─── Export ──────────────────────────────────────────────────────────
export default function HeroScene3D() {
  const [showFallback, setShowFallback] = useState(false);

  // Pré-check HEAD pour éviter le throw Suspense bruyant si le .glb
  // est absent (cas Vercel tant que studio-scene.glb pas compressé)
  useEffect(() => {
    fetch(MODEL_PATH, { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) {
          console.warn(
            `[HeroScene3D] ${MODEL_PATH} retourne ${res.status} — fallback. Compresse le fichier via gltf.report et push pour qu'il s'affiche en prod.`
          );
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
        camera={{ position: [0.6, 0.8, 5.5], fov: 38 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </GLBErrorBoundary>
  );
}

useGLTF.preload(MODEL_PATH);
