import { test, expect } from '@playwright/test';
import { seedPrefs, expectNoBlackScreen } from './helpers';

/**
 * Flux 9 — Setlists.
 * Créer une setlist → ajouter un song (depuis la lib seedée) → lancer le
 * mode lecture.
 */
test.describe('Setlists', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('créer, ajouter un song, lancer le mode play', async ({
    page,
  }, testInfo) => {
    const isMobile = testInfo.project.name === 'mobile';
    const name = `Setlist E2E ${Date.now()}`;

    // S'assure que le seed (3 songs) est en base : on visite /songs d'abord
    await page.goto('/songs');
    await expect(page.getByRole('heading', { name: 'Wonderwall' })).toBeVisible();

    await page.goto('/setlists');
    await expectNoBlackScreen(page);

    // Point d'entrée création : FAB (mobile, aria-label) / bouton header (desktop)
    if (isMobile) {
      // force: le FAB feedback "Donner mon avis" (fixed, même coin) se
      // superpose au FAB setlist → click bloqué sinon.
      await page
        .getByRole('button', { name: 'Nouvelle setlist' })
        .click({ force: true });
    } else {
      await page
        .getByRole('button', { name: '+ Nouvelle setlist' })
        .click();
    }

    // Sheet "Nouvelle setlist"
    const nameInput = page.getByPlaceholder(/Répèt du jeudi/);
    await expect(nameInput).toBeVisible();
    await nameInput.fill(name);
    await page.getByRole('button', { name: 'Créer' }).click();

    // → détail de la nouvelle setlist
    await expect(page).toHaveURL(/\/setlists\/[^/]+$/);
    await expect(page.getByRole('heading', { name })).toBeVisible();

    // Ajouter un son
    await page.getByRole('button', { name: /Ajouter un son/ }).click();
    // Sheet "Ajouter un son" → clique le 1er song dispo (Wonderwall)
    await page
      .getByRole('button', { name: /Wonderwall/ })
      .first()
      .click();

    // Le son apparaît dans la liste + le CTA lecture s'affiche
    await expect(page.getByText('1 song', { exact: false })).toBeVisible();
    const playLink = page.getByRole('link', {
      name: /Démarrer le mode lecture/,
    });
    await expect(playLink).toBeVisible();

    // Lance le mode lecture
    await playLink.click();
    await expect(page).toHaveURL(/\/setlists\/[^/]+\/play$/);
    await expectNoBlackScreen(page);
  });
});
