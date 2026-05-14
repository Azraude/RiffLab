import { lazy, Suspense } from 'react';
import type { TuningId, NoteName, ScaleId } from '@/lib/theory';

const Fretboard3D = lazy(() => import('./Fretboard3D'));

interface Fretboard3DLazyProps {
  tuning: TuningId;
  numFrets: number;
  scaleKey: NoteName;
  scaleId: ScaleId;
}

/**
 * Lazy wrapper pour Fretboard3D. Pas de gate mobile ici (contrairement à
 * Hero3D/AmbientStrings) parce que ce toggle est explicitement OPT-IN :
 * le user a cliqué "Vue 3D" — c'est SON choix. La policy "pas de 3D par
 * défaut sur mobile" est respectée tant que ce composant n'apparaît pas
 * automatiquement sur la page Scales.
 *
 * Fallback pendant le chargement du chunk : placeholder dim.
 */
export function Fretboard3DLazy(props: Fretboard3DLazyProps) {
  return (
    <Suspense fallback={<Loading3D />}>
      <Fretboard3D {...props} />
    </Suspense>
  );
}

function Loading3D() {
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border border-border bg-surface-2 flex items-center justify-center text-text-soft text-sm"
      style={{ height: 320 }}
    >
      Chargement de la vue 3D…
    </div>
  );
}
