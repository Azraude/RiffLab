/**
 * Hero3D — guitare flottante stylisée pour la landing (decorative only).
 *
 * Vanilla Three.js (pas de R3F) pour garder le chunk minimal. Tout est
 * construit en primitives : body torique, neck cylindrique, headstock
 * trapézoïdal, cordes en lignes, particules de poussière dorée.
 *
 * ⚠️ POLICY : Three.js décoratif uniquement. Ne JAMAIS l'utiliser pour
 * un outil fonctionnel (fretboard de travail, diagrammes, etc.).
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ─── Scene setup ──────────────────────────────────────────
    const scene = new THREE.Scene();

    // Lecture des CSS variables pour suivre le thème actif.
    const css = getComputedStyle(document.documentElement);
    const goldRgb = css.getPropertyValue('--gold').trim() || '212 183 106';
    const goldBrightRgb = css.getPropertyValue('--gold-bright').trim() || '245 217 122';
    const goldColor = new THREE.Color(...goldRgb.split(' ').map((n) => Number(n) / 255) as [number, number, number]);
    const goldBrightColor = new THREE.Color(
      ...goldBrightRgb.split(' ').map((n) => Number(n) / 255) as [number, number, number]
    );

    const w = container.clientWidth;
    const h = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100);
    camera.position.set(0, 0.5, 12);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // ─── Lights ───────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
    const key = new THREE.DirectionalLight(goldBrightColor, 1.2);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(goldColor, 0.6);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    // ─── Guitar group ─────────────────────────────────────────
    const guitar = new THREE.Group();
    scene.add(guitar);

    // Body : "8" stylisé via deux tores
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      metalness: 0.4,
      roughness: 0.45,
      emissive: goldColor.clone().multiplyScalar(0.04),
    });

    const upperBody = new THREE.Mesh(
      new THREE.TorusGeometry(1.2, 0.55, 24, 64),
      bodyMaterial
    );
    upperBody.rotation.x = Math.PI / 2;
    upperBody.position.y = 0.3;
    guitar.add(upperBody);

    const lowerBody = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.6, 24, 64),
      bodyMaterial
    );
    lowerBody.rotation.x = Math.PI / 2;
    lowerBody.position.y = -1.5;
    guitar.add(lowerBody);

    // Sound hole (disque or éteint)
    const soundHole = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.45, 32),
      new THREE.MeshBasicMaterial({ color: goldColor, side: THREE.DoubleSide })
    );
    soundHole.position.set(0, -0.5, 0.62);
    guitar.add(soundHole);

    // Neck (cylindre orienté vers le haut)
    const neckMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      metalness: 0.2,
      roughness: 0.7,
    });
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.22, 5, 16),
      neckMaterial
    );
    neck.position.y = 3.2;
    guitar.add(neck);

    // Frets (petites pastilles or)
    const fretMat = new THREE.MeshStandardMaterial({
      color: goldBrightColor,
      metalness: 0.95,
      roughness: 0.15,
    });
    for (let i = 0; i < 8; i++) {
      const fret = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.018, 8, 24),
        fretMat
      );
      fret.rotation.z = Math.PI / 2;
      fret.position.set(0, 1.4 + i * 0.55, 0);
      guitar.add(fret);
    }

    // Headstock (boîte trapézoïdale simulée par BoxGeometry)
    const headstock = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.1, 0.25),
      neckMaterial
    );
    headstock.position.y = 6;
    guitar.add(headstock);

    // Strings (6 lignes or fines, du bas du body au haut du headstock)
    const stringMat = new THREE.LineBasicMaterial({
      color: goldBrightColor,
      transparent: true,
      opacity: 0.7,
    });
    for (let i = 0; i < 6; i++) {
      const xOffset = -0.18 + (i * 0.36) / 5;
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(xOffset, -2.4, 0.65),
        new THREE.Vector3(xOffset, 6, 0.25),
      ]);
      guitar.add(new THREE.Line(geo, stringMat));
    }

    // Initial tilt
    guitar.rotation.set(-0.15, 0.4, 0.05);

    // ─── Particules (poussière dorée) ─────────────────────────
    const particleCount = 60;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 1;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: goldBrightColor,
      size: 0.05,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ─── Animation ────────────────────────────────────────────
    let frameId = 0;
    let last = performance.now();
    const animate = (t: number) => {
      const dt = (t - last) / 1000;
      last = t;
      // Rotation lente de la guitare
      guitar.rotation.y += dt * 0.18;
      guitar.position.y = Math.sin(t / 1800) * 0.15;
      // Particules : drift léger
      const pos = particles.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < particleCount; i++) {
        pos.array[i * 3 + 1] = (pos.array[i * 3 + 1] as number) + dt * 0.08;
        if ((pos.array[i * 3 + 1] as number) > 6) {
          pos.array[i * 3 + 1] = -6;
        }
      }
      pos.needsUpdate = true;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    // ─── Resize handler ───────────────────────────────────────
    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    // ─── Cleanup ──────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
          obj.geometry?.dispose?.();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose?.());
          else mat?.dispose?.();
        }
      });
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
