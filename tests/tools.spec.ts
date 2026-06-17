import { test, expect } from '@playwright/test';
import { seedPrefs, mockMicrophone, expectNoBlackScreen } from './helpers';

/**
 * Flux 11 — Outils : Tuner / Métronome / Ear Training.
 */
test.describe('Tools', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('Tuner — active le micro (mock) et passe en écoute', async ({
    page,
  }) => {
    await mockMicrophone(page);
    await page.goto('/tuner');

    const activate = page.getByRole('button', { name: 'Activer le micro' });
    await expect(activate).toBeVisible();
    await activate.click();

    // Une fois le stream (mocké) accordé → bouton "Arrêter le micro"
    await expect(
      page.getByRole('button', { name: 'Arrêter le micro' })
    ).toBeVisible();
  });

  test('Métronome — play puis pause', async ({ page }) => {
    await page.goto('/metronome');

    const toggle = page.getByRole('button', { name: /Démarrer|Arrêter/ });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  });

  test('Ear Training — choix de mode initialise le quiz', async ({ page }) => {
    await page.goto('/ear-training');
    await expectNoBlackScreen(page);

    // ModePicker : 3 modes
    await page.getByRole('button', { name: 'Intervalles' }).click();

    // Quiz initialisé : bouton "Réécouter" + score visible
    await expect(
      page.getByRole('button', { name: 'Réécouter' })
    ).toBeVisible();
    await expect(page.getByText('Score', { exact: true })).toBeVisible();
  });
});
