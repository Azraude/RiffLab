/**
 * Helpers réutilisables pour les scènes 3D RiffLab.
 *
 * Toutes les scènes partagent :
 * - Le même setup de lumières (key gold haut-droite + fill bleu nuit
 *   bas-gauche + ambient faible)
 * - Une animation de rotation Y lente + lévitation Y sin
 * - Des particules dorées drift-up en arrière-plan
 *
 * On factorise ici pour cohérence visuelle + maintenance.
 *
 * ⚠️ POLICY CLAUDE.md : Three.js décoratif uniquement.
 */
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';

// ─── Canvas transparency callback ────────────────────────────────────
/**
 * onCreated handler à passer aux <Canvas> R3F pour garantir un fond
 * totalement transparent. Trois.js par défaut clear avec un noir opaque
 * même quand `gl: { alpha: true }` est passé — il faut explicitement
 * setClearAlpha(0) ET scene.background = null pour qu'un GLB ne montre
 * pas la couleur de fond Three par défaut (qui ressemble à de l'espace
 * noir avec les lights actuelles).
 */
export function ensureTransparentScene({
  gl,
  scene,
}: {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
}) {
  gl.setClearColor(0x000000, 0);
  gl.setClearAlpha(0);
  scene.background = null;
}

// ─── GLB cleanup : enlève les skyboxes ───────────────────────────────
/**
 * Traverse un GLB et masque toute mesh qui ressemble à un skybox ou
 * une env-sphère (ces meshes sont souvent baked dans les modèles
 * téléchargés depuis Sketchfab — résultat "fond espace" qu'on ne veut
 * surtout pas dans une app premium musique).
 *
 * Heuristique : nom contenant sky/background/environment/sphere/dome,
 * ou très grande sphère (rayon > 50), ou très grande box (size > 100).
 * Mutate in-place.
 */
export function stripSkyboxes(root: THREE.Object3D) {
  root.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const name = obj.name.toLowerCase();
    const hits = [
      'sky',
      'background',
      'environment',
      'env_',
      'dome',
      'panorama',
      'backdrop',
    ];
    if (hits.some((h) => name.includes(h))) {
      obj.visible = false;
      return;
    }
    // Géométrie très large = potentiel skybox
    const geo = obj.geometry;
    if (geo instanceof THREE.SphereGeometry) {
      const p = geo.parameters;
      if (p && p.radius > 50) obj.visible = false;
      return;
    }
    if (geo instanceof THREE.BoxGeometry) {
      const p = geo.parameters;
      if (p && (p.width > 100 || p.height > 100 || p.depth > 100)) {
        obj.visible = false;
      }
    }
  });
}

// ─── CSS variables → THREE.Color ─────────────────────────────────────
/** Lit les variables CSS du thème actif et renvoie des THREE.Color. */
export function readGoldColors() {
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

// ─── Lights ──────────────────────────────────────────────────────────
/**
 * Setup studio standard : KeyLight gold haut-droite, FillLight bleu nuit
 * bas-gauche, ambient faible. Intensités passables en props pour adapter
 * à chaque scène (un hero a plus de pêche qu'un décor de carte).
 */
export function StudioLights({
  keyIntensity = 1.4,
  fillIntensity = 0.7,
  ambientIntensity = 0.22,
  extraGoldFill = true,
}: {
  keyIntensity?: number;
  fillIntensity?: number;
  ambientIntensity?: number;
  extraGoldFill?: boolean;
}) {
  const { gold, goldBright } = useMemo(() => readGoldColors(), []);
  return (
    <>
      <ambientLight intensity={ambientIntensity} color="#0a0a0a" />
      <directionalLight
        position={[3.5, 4.5, 4]}
        intensity={keyIntensity}
        color={goldBright}
      />
      <pointLight position={[-3.5, -2, -2]} intensity={fillIntensity} color="#1a1a2e" />
      {extraGoldFill && (
        <pointLight position={[2, -1.5, 2]} intensity={0.4} color={gold} />
      )}
    </>
  );
}

// ─── Floating wrapper ────────────────────────────────────────────────
/**
 * Wrap des enfants avec rotation Y lente + lévitation Y sin. Utilisé
 * dans toutes les scènes pour la même "respiration" décorative.
 */
export function FloatingGroup({
  children,
  rotationSpeed = 0.001,
  levitationAmp = 0.05,
  levitationFreq = 0.3,
}: {
  children: ReactNode;
  /** rad/frame (~60fps → 0.001 = 1 tour en ~100s) */
  rotationSpeed?: number;
  /** Amplitude vertical sinusoïdal */
  levitationAmp?: number;
  /** Fréquence (Hz) */
  levitationFreq?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += rotationSpeed;
    ref.current.position.y =
      Math.sin(state.clock.elapsedTime * levitationFreq) * levitationAmp;
  });
  return <group ref={ref}>{children}</group>;
}

// ─── Gold particles ──────────────────────────────────────────────────
/**
 * 50 particules dorées qui montent lentement, wrap autour. Couleur
 * lue depuis les CSS variables → suit le thème actif.
 */
export function GoldParticles({
  count = 50,
  spread = 12,
  height = 10,
  opacity = 0.4,
  size = 0.05,
}: {
  count?: number;
  spread?: number;
  height?: number;
  opacity?: number;
  size?: number;
}) {
  const ref = useRef<THREE.Points>(null);
  const { goldBright } = useMemo(() => readGoldColors(), []);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * spread;
      arr[i * 3 + 1] = (Math.random() - 0.5) * height - 1;
      arr[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6 - 1;
    }
    return arr;
  }, [count, spread, height]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.attributes.position as THREE.BufferAttribute;
    const halfHeight = height / 2;
    for (let i = 0; i < count; i++) {
      const cur = (attr.array[i * 3 + 1] as number) + delta * 0.15;
      attr.array[i * 3 + 1] = cur > halfHeight ? -halfHeight : cur;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} />
      </bufferGeometry>
      <pointsMaterial
        color={goldBright}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </points>
  );
}

// Re-export les fallbacks depuis sceneFallbacks pour rester compat avec
// les imports `from './sceneHelpers'` côté composants R3F (qui paient déjà
// le coût three). Les wrappers Lazy *ne doivent pas* importer depuis ce
// fichier — ils importent directement depuis sceneFallbacks.
export { Scene3DFallback, Scene3DSkeleton } from './sceneFallbacks';

// ─── GLBErrorBoundary ────────────────────────────────────────────────
import { Component } from 'react';

interface BoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  modelPath?: string;
}
interface BoundaryState {
  hasError: boolean;
}
/**
 * Catch les Suspense throws de useGLTF (404, parse error, etc.) et
 * affiche le fallback. Log l'erreur en info pour pas spammer prod.
 */
export class GLBErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { hasError: false };
  static getDerivedStateFromError(): BoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    console.warn(
      `[3D] Échec du chargement de ${this.props.modelPath ?? 'modèle 3D'} — fallback`,
      error
    );
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
