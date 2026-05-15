import { useEffect, useState } from 'react';
import { usePrefs } from '@/stores/prefsStore';

/**
 * Hook central pour décider si on rend une scène Three.js ou son fallback.
 *
 * Composition (toutes les conditions doivent être vraies) :
 * 1. `prefs.effects3D` est `true` (default true, toggleable dans
 *    Préférences)
 * 2. `prefers-reduced-motion` est `no-preference` (accessibilité)
 * 3. Viewport ≥ 768px (policy CLAUDE.md : pas de Three.js sur mobile
 *    par défaut)
 * 4. Device non-low-end : `navigator.deviceMemory >= 4` (feature-
 *    detected, fallback `true` si non supporté) ET
 *    `navigator.hardwareConcurrency >= 4` (idem)
 *
 * Tout le reste = fallback gradient.
 */
export function useCanRender3D(): boolean {
  const effects3D = usePrefs((s) => s.effects3D);
  const [mediaOk, setMediaOk] = useState(false);
  const [deviceOk, setDeviceOk] = useState(false);

  useEffect(() => {
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

    return () => mql.removeEventListener('change', onChange);
  }, []);

  return effects3D && mediaOk && deviceOk;
}
