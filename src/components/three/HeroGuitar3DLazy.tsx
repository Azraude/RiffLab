import { lazy, Suspense, useEffect, useState } from 'react';

const HeroGuitar3D = lazy(() => import('./HeroGuitar3D'));

/**
 * Wrapper qui :
 * - Détecte mobile (< 768px) ou prefers-reduced-motion → fallback CSS
 *   gradient + halo gold (policy CLAUDE.md "pas de Three.js sur mobile
 *   par défaut")
 * - Sinon, lazy-import du chunk R3F + drei + three
 * - Pendant le chargement, affiche le fallback gradient
 *
 * Si le fichier /models/guitar.glb est absent (placeholder), le composant
 * interne catch et affiche son propre fallback — pas besoin de logique ici.
 */
export function HeroGuitar3DLazy() {
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(
      '(min-width: 768px) and (prefers-reduced-motion: no-preference)'
    );
    setCanRender3D(mql.matches);
    const handler = (e: MediaQueryListEvent) => setCanRender3D(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (!canRender3D) return <GradientFallback />;

  return (
    <Suspense fallback={<GradientFallback />}>
      <HeroGuitar3D />
    </Suspense>
  );
}

function GradientFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 35%, rgb(var(--gold-glow) / 0.14) 0%, transparent 55%)',
        }}
      />
    </div>
  );
}
