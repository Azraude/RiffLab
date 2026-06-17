import { type Page, expect } from '@playwright/test';

/**
 * Préférences pré-câblées injectées dans localStorage AVANT le chargement
 * de l'app (via addInitScript). Objectif : neutraliser tout ce qui
 * bloquerait un test E2E :
 *
 *  - onboarding + tutorials (overlays plein écran au 1er lancement)
 *  - effets 3D (WebGL lourd / lazy chunks Three.js)
 *  - audio désactivé (pas de tentative Tone.js sans geste réel)
 *
 * Format = celui de zustand `persist` (clé `rifflab-prefs`, version 9).
 * Cf. src/stores/prefsStore.ts.
 */
const SEEDED_PREFS = {
  state: {
    tuning: 'standard',
    capo: 0,
    audioEnabled: false,
    volume: 0.65,
    showNoteNames: true,
    fretboardSkin: 'noir-mat',
    theme: 'dark-gold',
    strumSound: 'electric-clean',
    effects3D: false,
    onboardingCompleted: true,
    tutorialCompleted: true,
    planTutorialSeen: true,
    composerTutorialSeen: true,
    unlockedSecretTheme: false,
    level: 'beginner',
    practicePlan: null,
  },
  version: 9,
};

/**
 * À appeler dans un `beforeEach`. Injecte les prefs avant chaque navigation
 * pour que l'onboarding / tutorial ne s'affichent jamais.
 */
export async function seedPrefs(page: Page): Promise<void> {
  await page.addInitScript((prefs) => {
    window.localStorage.setItem('rifflab-prefs', JSON.stringify(prefs));
    // Force le français : sans ça, i18next-browser-languagedetector lit
    // navigator.language (en-US sous Playwright) → UI en anglais, et les
    // assertions sur les textes FR cassent. Clé = src/i18n/index.ts.
    window.localStorage.setItem('rifflab-locale', 'fr');
  }, SEEDED_PREFS);
}

/**
 * Mock de getUserMedia — retourne un MediaStream valide issu d'un
 * AudioContext (oscillateur → MediaStreamDestination). Permet au Tuner de
 * passer en état 'granted' sans micro réel ni prompt de permission.
 */
export async function mockMicrophone(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const md = navigator.mediaDevices as MediaDevices | undefined;
    if (!md) return;
    md.getUserMedia = async () => {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const dest = ctx.createMediaStreamDestination();
      const osc = ctx.createOscillator();
      osc.frequency.value = 110; // ~A2
      osc.connect(dest);
      osc.start();
      return dest.stream;
    };
  });
}

/**
 * Le `#main-content` rend du contenu visible (≠ écran noir).
 * C'est le garde-fou régression "motion.line → écran noir" (sess récente).
 */
export async function expectNoBlackScreen(page: Page): Promise<void> {
  const main = page.locator('#main-content');
  await expect(main).toBeVisible();
  const text = (await main.innerText()).trim();
  expect(text.length, 'le contenu principal ne doit pas être vide').toBeGreaterThan(0);
}

/** Collecte les erreurs console émises pendant un test. */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}
