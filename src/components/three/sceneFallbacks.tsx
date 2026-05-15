/**
 * Fallbacks pure-CSS pour les scènes 3D — pas de dépendance à three / R3F.
 *
 * Ces composants doivent rester dans un fichier séparé des helpers R3F
 * (sceneHelpers.tsx) pour permettre à Vite de tree-shaker correctement :
 * les wrappers lazy importent les fallbacks → si on les co-locataires
 * avec du code three, tout le bundle three est pulled in la version non-3D.
 */

/** Affichage de secours : gradient noir + halo gold radial. No WebGL. */
export function Scene3DFallback({ className }: { className?: string }) {
  return (
    <div
      className={className ?? 'absolute inset-0 overflow-hidden pointer-events-none'}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 45%, rgb(var(--gold-glow) / 0.16) 0%, transparent 55%)',
        }}
      />
    </div>
  );
}

/** Skeleton shimmer pour Suspense fallback pendant download du .glb. */
export function Scene3DSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={
        className ?? 'absolute inset-0 overflow-hidden pointer-events-none'
      }
      aria-hidden
    >
      <div className="skeleton-shimmer absolute inset-0 opacity-40" />
    </div>
  );
}
