import { test, expect } from '@playwright/test';
import { seedPrefs, expectNoBlackScreen } from './helpers';

/**
 * Flux 3 — CRUD song minimal.
 * Créer un song via /songs/new → arrivée sur /songs/:id → présent dans /songs.
 */
test.describe('Songs', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('créer un song, le voir dans la liste et ouvrir le détail', async ({
    page,
  }) => {
    const title = `Test E2E ${Date.now()}`;

    // /songs/new ouvre directement le Sheet avec le SongForm
    await page.goto('/songs/new');
    const titleInput = page.getByPlaceholder('ex: Wonderwall');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);

    await page.getByRole('button', { name: 'Enregistrer' }).click();

    // Save réussi → /songs/:id
    await expect(page).toHaveURL(/\/songs\/[^/]+$/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expectNoBlackScreen(page);

    // Présent dans la liste
    await page.goto('/songs');
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    // Click → détail
    await page.getByRole('heading', { name: title }).click();
    await expect(page).toHaveURL(/\/songs\/[^/]+$/);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
  });
});
