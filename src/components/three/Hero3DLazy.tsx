import { lazy, Suspense, useEffect, useState } from 'react';

/**
 * Hero3DLazy — wrapper qui :
 * 1. Détecte mobile / reduced-motion → fallback CSS gradient
 * 2. Sinon, lazy-load Three.js (chunk séparé)
 * 3. Affiche le fallback en attendant le chunk
 *
 * Le seuil mobile est 768px (= breakpoint md Tailwind). En dessous, pas
 * de 3D : on respecte la policy CLAUDE.md "Pas de Three.js sur mobile en
 * vue par défaut (perf)".
 */
const Hero3D = lazy(() => import('./Hero3D'));

export function Hero3DLazy() {
  const [canRender3D, setCanRender3D] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
    setCanRender3D(mql.matches);
    const handler = (e: MediaQueryListEvent) => setCanRender3D(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  if (!canRender3D) return <HeroFallback />;

  return (
    <Suspense fallback={<HeroFallback />}>
      <Hero3D />
    </Suspense>
  );
}

/** Fallback CSS : gradient or radial + animated dots (poussière). */
function HeroFallback() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 35%, rgb(var(--gold-glow) / 0.18) 0%, transparent 55%)',
        }}
      />
      {/* Quelques particules CSS-only pour l'ambiance */}
      <div className="absolute inset-0">
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="absolute block h-1 w-1 rounded-full bg-gold-bright opacity-50"
            style={{
              left: `${(i * 53) % 100}%`,
              top: `${(i * 37) % 100}%`,
              animation: `float-up ${5 + (i % 4) * 1.5}s linear ${i * 0.4}s infinite`,
              animationFillMode: 'both',
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 0.4; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-60px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
