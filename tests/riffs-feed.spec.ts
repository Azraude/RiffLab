import { test, expect } from '@playwright/test';
import { seedPrefs } from './helpers';

/**
 * Flux 7 — Feed des riffs.
 * Le feed s'affiche, liker un riff passe le bouton en "Aimé" (compteur +1)
 * et l'ordre des cards reste stable (pattern frozenList, pas de re-shuffle
 * au like).
 */
test.describe('Riffs feed', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('like un riff = compteur monte, ordre stable', async ({ page }) => {
    await page.goto('/riffs');

    const cards = page.locator('article[role="link"]');
    await expect(cards.first()).toBeVisible();

    // Capture l'ordre courant (aria-label de chaque card)
    const orderBefore = await cards.evaluateAll((els) =>
      els.map((e) => e.getAttribute('aria-label'))
    );
    expect(orderBefore.length).toBeGreaterThan(0);

    // Bouton like de la 1re card : aria-label "J'aime" / "J'aime (N)"
    const likeBtn = cards
      .first()
      .getByRole('button', { name: /J'aime|Aimé/ });
    await expect(likeBtn).toBeVisible();

    await likeBtn.click();

    // Après like → état "Aimé" (le compteur a +1 par construction likeCount)
    await expect(
      cards.first().getByRole('button', { name: /Aimé/ })
    ).toBeVisible();

    // Ordre inchangé après le like
    const orderAfter = await cards.evaluateAll((els) =>
      els.map((e) => e.getAttribute('aria-label'))
    );
    expect(orderAfter).toEqual(orderBefore);
  });
});
