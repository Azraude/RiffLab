/**
 * Wrapper Google AdSense — chargement du script + push d'un slot.
 *
 * Tant que VITE_ADSENSE_CLIENT_ID est vide (cas actuel : validation AdSense
 * pas faite), isAdSenseEnabled() = false → AdSlot affiche un placeholder
 * cross-promo RiffLab+. Cf docs/ADSENSE-INTEGRATION.md pour activer.
 */
export const ADSENSE_CLIENT_ID: string =
  (import.meta.env.VITE_ADSENSE_CLIENT_ID as string | undefined) ?? '';

let loaded = false;

export function isAdSenseEnabled(): boolean {
  return ADSENSE_CLIENT_ID.length > 0;
}

/** Injecte le script adsbygoogle une seule fois (no-op si pas configuré). */
export function initAdSense(): void {
  if (loaded || !isAdSenseEnabled() || typeof document === 'undefined') return;
  loaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
  document.head.appendChild(script);
}

/** Demande à AdSense de remplir le dernier <ins> rendu. */
export function pushAd(): void {
  if (!isAdSenseEnabled()) return;
  try {
    const w = window as unknown as { adsbygoogle?: unknown[] };
    w.adsbygoogle = w.adsbygoogle ?? [];
    w.adsbygoogle.push({});
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('AdSense push failed', err);
  }
}
