import { test, expect } from '@playwright/test';
import { seedPrefs, expectNoBlackScreen } from './helpers';

/**
 * Flux 10 — Practice Plan.
 * Le chemin affiche 10 nodes ; cliquer un node actif ouvre le drawer de niveau.
 * (planTutorialSeen=true via seedPrefs → pas de tutorial bloquant.)
 */
test.describe('Practice Plan', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('10 nodes, click node → drawer ouvre', async ({ page }) => {
    await page.goto('/plan');
    await expectNoBlackScreen(page);

    // 10 nodes (aria-label "Niveau N : titre")
    const nodes = page.getByRole('button', { name: /^Niveau \d+ :/ });
    await expect(nodes).toHaveCount(10);

    // Le node actif (current/available) est cliquable
    const activeNode = page
      .locator('[data-tutorial-id="plan-node-active"]')
      .first();
    await expect(activeNode).toBeVisible();
    await activeNode.click();

    // Drawer de niveau ouvert (Radix Dialog)
    const drawer = page.getByRole('dialog');
    await expect(drawer).toBeVisible();
    await expect(drawer.getByText(/Niveau \d+ \/ 10/)).toBeVisible();
    await expect(
      drawer.getByRole('button', { name: 'Fermer' })
    ).toBeVisible();
  });
});
