import { test, expect } from '@playwright/test';
import { seedPrefs, expectNoBlackScreen } from './helpers';

/**
 * Flux 1 — Landing publique.
 * / charge, le hero (h1) est visible, et le CTA principal mène au dashboard.
 *
 * On cible le CTA par son href (/dashboard) plutôt que par son libellé : la
 * copie marketing évolue souvent, le flux non.
 */
test.describe('Landing', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('charge avec hero + CTA visible', async ({ page }) => {
    await page.goto('/');

    // Hero : un titre h1 est rendu
    await expect(page.locator('h1').first()).toBeVisible();

    // Au moins un CTA pointant vers le dashboard
    await expect(page.locator('a[href="/dashboard"]').first()).toBeVisible();
  });

  test('CTA principal → /dashboard', async ({ page }) => {
    await page.goto('/');

    await page.locator('a[href="/dashboard"]').first().click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expectNoBlackScreen(page);
  });
});
