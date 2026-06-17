import { useEffect, useState } from 'react';
import { usePrefs } from '@/stores/prefsStore';

/**
 * Kill-switch global de perte de contexte WebGL.
 *
 * Root cause de l'écran noir à la navigation (hotfix) : chaque page
 * décorative monte un `<Canvas>` Three.js = un contexte WebGL. Le navigateur
 * en limite ~8-16 ; à force de naviguer, les anciens contextes ne sont pas
 * libérés assez vite → `THREE.WebGLRenderer: Context Lost` → canvas noir qui
 * recouvre la page + boucle de render qui throw.
 *
 * Dès la PREMIÈRE perte de contexte, on coupe TOUT le 3D de l'app (tous les
 * `useCanRender3D` repassent à false → les Canvas se démontent → fallback
 * gradient). Dégradation propre, plus jamais d'écran noir pour la session.
 * `webglcontextlost` ne bubble pas → on écoute en phase capture sur window.
 */
let webglContextLost = false;
const lossListeners = new Set<() => void>();
let globalHandlerInstalled = false;

function installGlobalContextLossHandler(): void {
  if (globalHandlerInstalled || typeof window === 'undefined') return;
  globalHandlerInstalled = true;
  window.addEventListener(
    'webglcontextlost',
    (e) => {
      // preventDefault = on assume la perte (pas de comportement bruyant).
      try {
        e.preventDefault();
      } catch {
        /* noop */
      }
      if (webglContextLost) return;
      webglContextLost = true;
      lossListeners.forEach((fn) => {
        try {
          fn();
        } catch {
          /* noop */
        }
      });
    },
    true // capture : l'event est dispatché sur le <canvas>, ne bubble pas
  );
}

/**
 * Hook central pour décider si on rend une scène Three.js ou son fallback.
 *
 * Composition (toutes les conditions doivent être vraies) :
 * 1. `prefs.effects3D` est `true` (default true, toggleable dans Préférences)
 * 2. `prefers-reduced-motion` est `no-preference` (accessibilité)
 * 3. Viewport ≥ 768px (policy CLAUDE.md : pas de Three.js sur mobile)
 * 4. Device non-low-end (`deviceMemory`/`hardwareConcurrency` ≥ 4 si dispo)
 * 5. Aucun contexte WebGL perdu durant la session (kill-switch ci-dessus)
 */
export function useCanRender3D(): boolean {
  const effects3D = usePrefs((s) => s.effects3D);
  const [mediaOk, setMediaOk] = useState(false);
  const [deviceOk, setDeviceOk] = useState(false);
  const [lost, setLost] = useState(webglContextLost);

  useEffect(() => {
    installGlobalContextLossHandler();
    // S'abonner aux pertes de contexte → couper le 3D dès la 1ère.
    const onLoss = () => setLost(true);
    lossListeners.add(onLoss);
    if (webglContextLost) setLost(true);

    // Media query gate : viewport + reduced-motion
    const mql = window.matchMedia(
      '(min-width: 768px) and (prefers-reduced-motion: no-preference)'
    );
    setMediaOk(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMediaOk(e.matches);
    mql.addEventListener('change', onChange);

    // Device gate : low-end detection (Chrome only, fallback true sinon)
    const nav = navigator as Navigator & {
      deviceMemory?: number;
    };
    const memOk = nav.deviceMemory == null || nav.deviceMemory >= 4;
    const cpuOk =
      nav.hardwareConcurrency == null || nav.hardwareConcurrency >= 4;
    setDeviceOk(memOk && cpuOk);

    return () => {
      lossListeners.delete(onLoss);
      mql.removeEventListener('change', onChange);
    };
  }, []);

  return effects3D && mediaOk && deviceOk && !lost;
}
