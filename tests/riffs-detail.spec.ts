import { test, expect } from '@playwright/test';
import { seedPrefs, collectConsoleErrors, expectNoBlackScreen } from './helpers';

/**
 * Flux 8 — Détail d'un riff.
 * Click sur une card → page détail, le tab/player est visible, et AUCUNE
 * erreur 400 console (garde-fou régression "comments 400").
 */
test.describe('Riff detail', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('ouvre le détail sans erreur 400', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const bad400: string[] = [];
    page.on('response', (res) => {
      if (res.status() === 400) bad400.push(res.url());
    });

    await page.goto('/riffs');
    const firstCard = page.locator('article[role="link"]').first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();

    // Page détail
    await expect(page).toHaveURL(/\/riffs\/[^/]+$/);
    await expectNoBlackScreen(page);

    // Zone du tab + CTA "Écouter le riff"
    await expect(page.locator('#tab-area')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Écouter le riff' })
    ).toBeVisible();

    // Aucune réponse 400 + aucune erreur console mentionnant 400
    expect(bad400, `réponses 400: ${bad400.join(', ')}`).toHaveLength(0);
    expect(
      errors.filter((e) => /\b400\b/.test(e)),
      `erreurs 400: ${errors.join(' | ')}`
    ).toHaveLength(0);
  });
});
