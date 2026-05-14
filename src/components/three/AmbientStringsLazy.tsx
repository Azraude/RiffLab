import { lazy, Suspense, useEffect, useState } from 'react';

const AmbientStrings3D = lazy(() => import('./AmbientStrings3D'));

/**
 * Wrapper qui :
 * - Détecte mobile (< 768px) ou prefers-reduced-motion → fallback CSS
 * - Sinon, lazy-load le composant Three.js (chunk séparé)
 * - Pendant le chargement, affiche le fallback
 */
export function AmbientStringsLazy() {
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    setCanRender3D(mql.matches);
    const handler = (e: MediaQueryListEvent) => setCanRender3D(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (!canRender3D) return <AmbientStringsFallback />;

  return (
    <Suspense fallback={<AmbientStringsFallback />}>
      <AmbientStrings3D />
    </Suspense>
  );
}

/** Fallback CSS : 6 lignes horizontales avec gradient or subtil. */
function AmbientStringsFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent, rgb(var(--gold-glow) / 0.06) 50%, transparent)',
        }}
      />
      <div className="absolute inset-0 flex flex-col justify-center gap-3 px-12 opacity-30">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="block h-px w-full"
            style={{
              background:
                `linear-gradient(to right, transparent, rgb(var(--gold) / ${0.4 + i * 0.05}), transparent)`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
