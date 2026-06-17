/**
 * HeroGuitar3D — guitare 3D pour la landing, basée sur un modèle GLB
 * pré-fait (vs le custom-from-primitives qui buggait).
 *
 * Pipeline :
 * - useGLTF de drei charge `/models/guitar-fender-classic.glb` (404 gracieux si absent)
 * - Lévitation Y : sin(t * 0.5) * 0.1
 * - Rotation Y lente : 0.002 rad/frame
 * - Lumières : DirectionalLight gold haut-droite + PointLight bleu nuit
 *   bas-gauche + Ambient faible
 * - Particules dorées Points sprite material en arrière-plan
 * - Pas d'OrbitControls (décoratif uniquement)
 *
 * ⚠️ POLICY CLAUDE.md : Three.js décoratif. Le rendu suit le thème actif
 * via les couleurs lues sur les CSS variables au mount.
 *
 * Voir public/models/README.md pour les sources de modèles libres.
 */
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { Component, Suspense, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';

// ─── CSS variables → THREE.Color (lecture au mount) ─────────────────────
function readGoldColors() {
  if (typeof document === 'undefined') {
    return {
      gold: new THREE.Color('#d4b76a'),
      goldBright: new THREE.Color('#f5d97a'),
    };
  }
  const css = getComputedStyle(document.documentElement);
  const parse = (key: string, fallback: string) => {
    const v = css.getPropertyValue(key).trim();
    if (!v) return new THREE.Color(fallback);
    const [r, g, b] = v.split(' ').map((n) => Number(n) / 255);
    return new THREE.Color(r, g, b);
  };
  return {
    gold: parse('--gold', '#d4b76a'),
    goldBright: parse('--gold-bright', '#f5d97a'),
  };
}

// ─── Guitar mesh ─────────────────────────────────────────────────────────
function Guitar() {
  const ref = useRef<THREE.Group>(null);
  // useGLTF throw une promise si pas trouvé → catch via ErrorBoundary parent
  const { scene } = useGLTF('/models/guitar-fender-classic.glb');

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    // Rotation Y continue
    ref.current.rotation.y += 0.002;
    // Lévitation Y
    ref.current.position.y = Math.sin(t * 0.5) * 0.1;
  });

  // Clone pour ne pas muter le cache si l'utilisateur navigue plusieurs fois
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={ref}>
      <primitive object={clonedScene} scale={1.4} />
    </group>
  );
}

// ─── Particles ──────────────────────────────────────────────────────────
function GoldParticles({ count = 80 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const { goldBright } = useMemo(() => readGoldColors(), []);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 10 - 2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const cur = (attr.array[i * 3 + 1] as number) + delta * 0.18;
      attr.array[i * 3 + 1] = cur > 5 ? -5 : cur;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
        />
      </bufferGeometry>
      <pointsMaterial
        color={goldBright}
        size={0.06}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────
function Scene() {
  const { gold, goldBright } = useMemo(() => readGoldColors(), []);
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.5}
        color={goldBright}
      />
      <pointLight
        position={[-3, -2, -2]}
        intensity={0.8}
        color="#1a1a2e"
      />
      <pointLight position={[2, -1, 2]} intensity={0.4} color={gold} />
      <Suspense fallback={null}>
        <Guitar />
      </Suspense>
      <GoldParticles />
    </>
  );
}

// ─── Error boundary (graceful fallback si .glb absent) ──────────────────
class GLBErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // Le 404 sur le .glb arrive ici. On log à info pour pas spammer la console.
    console.info('[HeroGuitar3D] modèle indisponible — fallback gradient', error);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// ─── Export par défaut (lazy-loadable) ───────────────────────────────────
export default function HeroGuitar3D() {
  const [showFallback, setShowFallback] = useState(false);

  // Précharge avec gestion d'erreur explicite — useGLTF.preload throw si 404,
  // mais Suspense + ErrorBoundary attrape déjà côté Canvas. On garde aussi
  // un check manuel HEAD au mount pour switcher en mode fallback proprement.
  useMemo(() => {
    fetch('/models/guitar-fender-classic.glb', { method: 'HEAD' })
      .then((res) => {
        if (!res.ok) setShowFallback(true);
      })
      .catch(() => setShowFallback(true));
  }, []);

  if (showFallback) return <GoldHaloFallback />;

  return (
    <GLBErrorBoundary fallback={<GoldHaloFallback />}>
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0.3, 5], fov: 35 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ pointerEvents: 'none' }}
      >
        <Scene />
      </Canvas>
    </GLBErrorBoundary>
  );
}

// ─── Fallback : gradient noir + halo gold ───────────────────────────────
function GoldHaloFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgb(var(--gold-glow) / 0.18) 0%, transparent 55%)',
        }}
      />
    </div>
  );
}

// Pré-pousse le modèle dans le cache au chargement du chunk (best-effort)
useGLTF.preload('/models/guitar-fender-classic.glb');
