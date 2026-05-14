/**
 * Fretboard3D — vue 3D décorative du manche pour Scales (Phase 4.7).
 *
 * ⚠️ POLICY CLAUDE.md : Three.js décoratif uniquement. Le Fretboard SVG 2D
 * reste la vue de TRAVAIL. La 3D est un toggle off-by-default que le user
 * peut activer pour le plaisir, mais le scan rapide en répèt doit toujours
 * passer par le 2D.
 *
 * - 15 frets x 6 cordes, perspective tilt fixe (pas de control souris pour
 *   éviter le problème "fiddly avec la souris")
 * - Auto-rotation gentle autour de l'axe X (oscillation back-and-forth)
 * - Notes de la gamme : sphères or-soft sur les positions valides
 * - Tonique : sphère or-bright plus grosse
 * - Frets : pastilles or, inlays nacre
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TUNINGS, scaleNotes, type TuningId, type NoteName, type ScaleId } from '@/lib/theory';

interface Fretboard3DProps {
  tuning: TuningId;
  numFrets: number;
  scaleKey: NoteName;
  scaleId: ScaleId;
}

export default function Fretboard3D({
  tuning,
  numFrets,
  scaleKey,
  scaleId,
}: Fretboard3DProps) {
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
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
    camera.position.set(0, 4.5, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // ─── Lights ───────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const key = new THREE.DirectionalLight(goldBrightColor, 1);
    key.position.set(5, 8, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(-5, 2, -3);
    scene.add(rim);

    // ─── Fretboard group ──────────────────────────────────────
    const boardGroup = new THREE.Group();
    scene.add(boardGroup);

    // Dimensions
    const BOARD_LENGTH = 12;
    const BOARD_WIDTH = 2.6;
    const BOARD_DEPTH = 0.18;
    const STRING_COUNT = 6;
    const FRET_X = (i: number) => {
      // Espacement progressif inspiré des frets réelles (compression vers l'aigu)
      const t = i / numFrets;
      // simple : linéaire pour rester lisible en 3D
      return -BOARD_LENGTH / 2 + t * BOARD_LENGTH;
    };
    const STRING_Z = (i: number) => {
      return -BOARD_WIDTH / 2 + (i / (STRING_COUNT - 1)) * BOARD_WIDTH;
    };

    // Board itself
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(BOARD_LENGTH, BOARD_DEPTH, BOARD_WIDTH),
      new THREE.MeshStandardMaterial({
        color: 0x0f0f10,
        metalness: 0.2,
        roughness: 0.85,
      })
    );
    board.position.y = -BOARD_DEPTH / 2;
    boardGroup.add(board);

    // Frets (or)
    for (let i = 0; i <= numFrets; i++) {
      const fret = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, BOARD_DEPTH + 0.06, BOARD_WIDTH + 0.05),
        new THREE.MeshStandardMaterial({
          color: goldBrightColor,
          metalness: 0.92,
          roughness: 0.18,
        })
      );
      fret.position.set(FRET_X(i), 0, 0);
      boardGroup.add(fret);
    }

    // Inlays (nacre simulée)
    const inlayMat = new THREE.MeshStandardMaterial({
      color: 0xe8e6e0,
      metalness: 0.5,
      roughness: 0.4,
    });
    const inlayPositions = [3, 5, 7, 9];
    inlayPositions.forEach((i) => {
      if (i > numFrets) return;
      const cx = (FRET_X(i - 1) + FRET_X(i)) / 2;
      const inlay = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), inlayMat);
      inlay.rotation.x = -Math.PI / 2;
      inlay.position.set(cx, 0.005, 0);
      boardGroup.add(inlay);
    });
    // Double inlays au 12e
    if (12 <= numFrets) {
      const cx = (FRET_X(11) + FRET_X(12)) / 2;
      [-0.6, 0.6].forEach((zOff) => {
        const inlay = new THREE.Mesh(new THREE.CircleGeometry(0.16, 24), inlayMat);
        inlay.rotation.x = -Math.PI / 2;
        inlay.position.set(cx, 0.005, zOff);
        boardGroup.add(inlay);
      });
    }

    // Strings (cylindres très fins)
    const stringMat = new THREE.MeshStandardMaterial({
      color: 0xb0b0b0,
      metalness: 0.9,
      roughness: 0.3,
    });
    const stringRadii = [0.025, 0.022, 0.020, 0.016, 0.012, 0.010]; // bass → treble
    for (let i = 0; i < STRING_COUNT; i++) {
      const str = new THREE.Mesh(
        new THREE.CylinderGeometry(stringRadii[i], stringRadii[i], BOARD_LENGTH + 0.4, 8),
        stringMat
      );
      str.rotation.z = Math.PI / 2;
      str.position.set(0, 0.08, STRING_Z(i));
      boardGroup.add(str);
    }

    // ─── Notes de la gamme ────────────────────────────────────
    const notePCs = new Set(scaleNotes(scaleKey, scaleId));
    const tonicPC = scaleNotes(scaleKey, scaleId)[0];
    const openTuning = TUNINGS[tuning];

    const noteMaterial = new THREE.MeshStandardMaterial({
      color: goldColor,
      metalness: 0.6,
      roughness: 0.35,
      emissive: goldColor.clone().multiplyScalar(0.25),
    });
    const tonicMaterial = new THREE.MeshStandardMaterial({
      color: goldBrightColor,
      metalness: 0.6,
      roughness: 0.25,
      emissive: goldBrightColor.clone().multiplyScalar(0.5),
    });

    for (let stringIdx = 0; stringIdx < STRING_COUNT; stringIdx++) {
      // Index 0 = corde de mi grave (bass), 5 = mi aigu (treble). On affiche
      // bass en bas du board (Z négatif) car en vue dessus, c'est l'usage.
      const openMidi = openTuning[stringIdx];
      const zPos = STRING_Z(STRING_COUNT - 1 - stringIdx); // flip pour mettre bass devant
      for (let fret = 0; fret <= numFrets; fret++) {
        const midi = openMidi + fret;
        const pc = midi % 12;
        if (!notePCs.has(pc)) continue;
        // Position sur la fret = milieu entre fret-1 et fret (sauf 0 = avant la nut)
        let xPos: number;
        if (fret === 0) xPos = FRET_X(0) - 0.25;
        else xPos = (FRET_X(fret - 1) + FRET_X(fret)) / 2;

        const isTonic = pc === tonicPC;
        const radius = isTonic ? 0.16 : 0.12;
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(radius, 16, 16),
          isTonic ? tonicMaterial : noteMaterial
        );
        dot.position.set(xPos, 0.14, zPos);
        boardGroup.add(dot);
      }
    }

    // Tilt initial — vue 3/4 supérieure
    boardGroup.rotation.set(-0.35, 0, 0);

    // ─── Animation : oscillation gentle (pas de control souris) ─
    let frameId = 0;
    const start = performance.now();
    const animate = () => {
      const t = (performance.now() - start) / 1000;
      // Oscillation ±0.08 rad autour du tilt initial, et un léger yaw
      boardGroup.rotation.x = -0.35 + Math.sin(t * 0.4) * 0.06;
      boardGroup.rotation.y = Math.sin(t * 0.3) * 0.12;
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
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
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
  }, [tuning, numFrets, scaleKey, scaleId]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-border-gold bg-gradient-to-b from-bg to-surface"
      style={{ height: 320 }}
      aria-label={`Vue 3D du manche pour ${scaleKey}`}
    />
  );
}
