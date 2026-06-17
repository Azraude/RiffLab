import { test, expect } from '@playwright/test';
import { seedPrefs, expectNoBlackScreen } from './helpers';

/**
 * Flux 2 — Navigation depuis le dashboard.
 * On clique chaque item de nav visible (sidebar desktop / bottom nav mobile)
 * et on vérifie qu'AUCUN écran noir ne survient (régression motion.line).
 *
 * Les liens de nav sont des <a href>. On cible par href, indépendamment du
 * label i18n, en scopant au conteneur de nav visible selon le viewport.
 */

// Routes présentes dans la sidebar desktop (cf. Sidebar.tsx).
const DESKTOP_ROUTES = [
  '/dashboard',
  '/library',
  '/resources',
  '/create',
  '/progressions',
  '/plan',
  '/stats',
  '/tools',
  '/riffs',
  '/jam',
];

// Routes de la bottom nav mobile (cf. MobileNav.tsx — 5 items).
const MOBILE_ROUTES = ['/dashboard', '/library', '/riffs', '/plan', '/settings'];

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('chaque item de nav charge sa page sans écran noir', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile';
    const routes = isMobile ? MOBILE_ROUTES : DESKTOP_ROUTES;
    // Conteneur de nav : <aside> sidebar desktop / <nav> bottom mobile.
    // NB: la sidebar contient AUSSI un <nav> (caché sur mobile) → on filtre
    // par :visible pour ne cibler que la nav réellement affichée.
    const navScope = isMobile
      ? 'nav'
      : 'aside[data-tutorial-id="sidebar-nav"]';

    await page.goto('/dashboard');
    await expectNoBlackScreen(page);

    for (const route of routes) {
      const link = page
        .locator(`${navScope} a[href="${route}"]:visible`)
        .first();
      await expect(link, `lien nav ${route} visible`).toBeVisible();
      await link.click();

      await expect(page).toHaveURL(new RegExp(`${route}$`));
      await expectNoBlackScreen(page);
    }
  });
});
