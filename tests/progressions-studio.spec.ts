import { test, expect } from '@playwright/test';
import { seedPrefs } from './helpers';

/**
 * Flux 6 — Studio de progressions (onglet Compose).
 * 4 slots présents au mount → "Tout générer" remplit les slots → unlock d'un
 * slot le vide et change l'état (suggestions / slot actif).
 */
test.describe('Progressions Studio', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('4 slots au mount, génération puis unlock', async ({ page }) => {
    await page.goto('/progressions');

    // Onglet Compose actif par défaut → 4 slots (aria-label "Slot N vide")
    const slots = page.getByRole('button', { name: /^Slot \d/ });
    await expect(slots).toHaveCount(4);
    for (let i = 1; i <= 4; i++) {
      await expect(
        page.getByRole('button', { name: new RegExp(`^Slot ${i} vide`) })
      ).toBeVisible();
    }

    // "Tout générer" remplit les 4 slots
    await page.getByRole('button', { name: /Tout générer/ }).click();

    // Tous les slots sont désormais lockés ("tap pour unlock")
    const locked = page.getByRole('button', { name: /tap pour unlock/ });
    await expect(locked).toHaveCount(4);

    // Unlock du slot 1 → il redevient vide + slot actif change l'UI
    await locked.first().click();
    await expect(
      page.getByRole('button', { name: /^Slot 1 vide/ })
    ).toBeVisible();
    // Les autres slots restent lockés
    await expect(
      page.getByRole('button', { name: /tap pour unlock/ })
    ).toHaveCount(3);
  });
});
