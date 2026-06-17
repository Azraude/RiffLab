import { test, expect } from '@playwright/test';
import { seedPrefs } from './helpers';

/**
 * Flux 12 — Changement de thème.
 * /settings → choisir un thème met à jour data-theme sur <html> et les
 * variables CSS de couleur (toutes les couleurs s'adaptent).
 */
test.describe('Theme switching', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('changer de thème met à jour data-theme + couleurs', async ({
    page,
  }) => {
    await page.goto('/settings');

    const html = page.locator('html');
    // Thème seedé par défaut
    await expect(html).toHaveAttribute('data-theme', 'dark-gold');

    const readBg = () =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue('--bg')
          .trim()
      );
    const bgBefore = await readBg();

    // Bascule sur "Pure White" (contraste fort, changement net)
    await page.getByRole('button', { name: 'Thème Pure White' }).click();

    await expect(html).toHaveAttribute('data-theme', 'pure-white');
    const bgAfter = await readBg();
    expect(bgAfter).not.toBe(bgBefore);
  });
});
