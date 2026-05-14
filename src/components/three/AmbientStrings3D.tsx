/**
 * AmbientStrings3D — 6 cordes vibrantes décoratives en arrière-plan,
 * pour le top du Dashboard. Vanilla Three.js, dim et subtile.
 *
 * Chaque corde est une TubeGeometry construite sur une courbe sinusoïdale
 * dont l'amplitude est animée au cours du temps. Effet "the strings are
 * humming" sans aucune fonction réelle.
 *
 * ⚠️ POLICY : Three.js décoratif uniquement.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function AmbientStrings3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const css = getComputedStyle(document.documentElement);
    const goldRgb = css.getPropertyValue('--gold').trim() || '212 183 106';
    const goldBrightRgb = css.getPropertyValue('--gold-bright').trim() || '245 217 122';
    const goldColor = new THREE.Color(
      ...goldRgb.split(' ').map((n) => Number(n) / 255) as [number, number, number]
    );
    const goldBrightColor = new THREE.Color(
      ...goldBrightRgb.split(' ').map((n) => Number(n) / 255) as [number, number, number]
    );

    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-5, 5, h / w * 5, -h / w * 5, 0.1, 100);
    camera.position.z = 10;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // ─── Strings ──────────────────────────────────────────────
    const numStrings = 6;
    const stringGeometries: THREE.TubeGeometry[] = [];
    const stringMeshes: THREE.Mesh[] = [];
    const stringPhases = Array.from({ length: numStrings }, (_, i) => Math.random() * Math.PI * 2);
    const stringFreqs = [0.6, 0.85, 1.1, 1.35, 1.6, 1.85]; // hz simulés
    const stringYPositions = Array.from({ length: numStrings }, (_, i) => 2.4 - i * 0.95);

    const stringMaterials = stringYPositions.map((_, i) => {
      // gradient bass → treble : bass plus sombre, treble plus éclat
      const t = i / (numStrings - 1);
      const color = new THREE.Color().lerpColors(goldColor, goldBrightColor, t);
      return new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.4 + t * 0.25,
      });
    });

    function createStringGeometry(i: number, time: number): THREE.TubeGeometry {
      const baseY = stringYPositions[i];
      const amp = 0.05 + (i / numStrings) * 0.08;
      const freq = stringFreqs[i];
      const phase = stringPhases[i];
      const points: THREE.Vector3[] = [];
      const segments = 60;
      for (let s = 0; s <= segments; s++) {
        const x = -6 + (s / segments) * 12;
        // Sinusoïde modulée — fixed à 0 aux extrémités (chevillet / chevalet)
        const env = Math.sin((s / segments) * Math.PI); // amplitude max au milieu
        const y = baseY + Math.sin(time * freq + phase + s * 0.18) * amp * env;
        points.push(new THREE.Vector3(x, y, 0));
      }
      const curve = new THREE.CatmullRomCurve3(points);
      return new THREE.TubeGeometry(curve, 60, 0.015 + i * 0.005, 6, false);
    }

    for (let i = 0; i < numStrings; i++) {
      const geo = createStringGeometry(i, 0);
      stringGeometries.push(geo);
      const mesh = new THREE.Mesh(geo, stringMaterials[i]);
      scene.add(mesh);
      stringMeshes.push(mesh);
    }

    // ─── Animation ────────────────────────────────────────────
    let frameId = 0;
    const start = performance.now();
    const animate = () => {
      const t = (performance.now() - start) / 1000;
      // Recréer les géométries — coûteux mais pour 6 cordes c'est OK
      for (let i = 0; i < numStrings; i++) {
        stringMeshes[i].geometry.dispose();
        const newGeo = createStringGeometry(i, t);
        stringMeshes[i].geometry = newGeo;
        stringGeometries[i] = newGeo;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    // ─── Resize handler ───────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      const aspect = nw / nh;
      camera.left = -5;
      camera.right = 5;
      camera.top = 5 / aspect;
      camera.bottom = -5 / aspect;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    // ─── Cleanup ──────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      stringGeometries.forEach((g) => g.dispose());
      stringMaterials.forEach((m) => m.dispose());
      renderer.dispose();
      try {
        container.removeChild(renderer.domElement);
      } catch {
        // déjà retiré
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden
    />
  );
}
