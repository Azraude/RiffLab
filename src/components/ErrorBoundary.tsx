/**
 * ErrorBoundary — ceinture-bretelles contre l'écran noir (hotfix).
 *
 * Contexte du bug : aucune ErrorBoundary n'existait. Conséquence : la moindre
 * erreur de render d'une page (ou surtout l'échec d'un `import()` de chunk lazy
 * 3D après un déploiement, quand le Service Worker a purgé les anciens chunks)
 * faisait throw → React démontait TOUT le root → écran noir total. Refresh =
 * nouvelle index.html + nouveaux chunks → ça remarche.
 *
 * Deux comportements :
 *  1. **Erreur de chunk** (chunk lazy disparu après deploy) → reload auto UNE
 *     fois (guardé par sessionStorage pour éviter une boucle de reload). C'est
 *     la vraie root-cause de l'écran noir à la nav.
 *  2. **Autre erreur de render** → fallback lisible avec bouton « Recharger »,
 *     au lieu d'un écran noir. La nav (sidebar) reste utilisable car la
 *     boundary autour de l'<Outlet> se remonte à chaque changement de route.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Fallback custom. Si absent, fallback par défaut (carte + bouton reload). */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  isChunkError: boolean;
}

/** Détecte un échec de chargement de module/chunk dynamique (toutes variantes
 *  navigateur : Chrome / Firefox / Safari / Vite preload). */
function isChunkLoadError(error: unknown): boolean {
  const msg =
    (error instanceof Error ? error.message : String(error ?? '')) || '';
  const name = error instanceof Error ? error.name : '';
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk [\d]+ failed/i.test(msg) ||
    /dynamically imported module/i.test(msg) ||
    /importing a module script failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
}

/** Reload guardé : on ne recharge pas plus d'une fois par fenêtre de 10s, pour
 *  ne jamais boucler si le reload ne résout pas le problème. */
const RELOAD_GUARD_KEY = 'rifflab-chunk-reload-ts';
function reloadOnceForChunkError(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) ?? '0');
    const nowTs = Date.now();
    if (nowTs - last < 10_000) return false; // déjà rechargé récemment
    sessionStorage.setItem(RELOAD_GUARD_KEY, String(nowTs));
    window.location.reload();
    return true;
  } catch {
    // sessionStorage indispo → on tente quand même un reload simple
    window.location.reload();
    return true;
  }
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, isChunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    if (isChunkLoadError(error)) {
      // Tente un reload auto (cas le plus courant de l'écran noir post-deploy).
      reloadOnceForChunkError();
      return;
    }
    // Autre erreur : on log pour le debug, le fallback prend le relais.
    console.error('[ErrorBoundary] render error:', error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    // Pendant le reload auto (chunk error), on évite de flasher le fallback.
    if (this.state.isChunkError) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-8 text-center text-sm text-text-muted">
          Mise à jour de l'app… rechargement en cours.
        </div>
      );
    }

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <div className="display text-display-sm text-text">Oups, un souci d'affichage</div>
        <p className="max-w-sm text-sm text-text-muted">
          Cette page n'a pas pu se charger. Recharge pour réessayer — tes données
          locales sont intactes.
        </p>
        <button
          type="button"
          onClick={this.handleReload}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-gold-bright to-gold px-5 font-semibold text-bg shadow-gold-strong hover:-translate-y-px"
        >
          Recharger la page
        </button>
      </div>
    );
  }
}
