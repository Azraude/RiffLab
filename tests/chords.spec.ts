import { test, expect } from '@playwright/test';
import { seedPrefs, collectConsoleErrors } from './helpers';

/**
 * Flux 4 — Bibliothèque d'accords.
 * Filtrer par tonalité + qualité réduit la liste ; taper une carte déclenche
 * le handler de lecture sans crash.
 */
test.describe('Chords', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('filtre par root + qualité, puis joue un accord', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/chords');

    // Filtre tonalité : chip "C" (mono, aria-pressed) — preuve que la page
    // des accords est montée. Indépendant de la langue.
    const rootC = page.getByRole('button', { name: 'C', exact: true });
    await expect(rootC.first()).toBeVisible();
    await rootC.first().click();
    await expect(rootC.first()).toHaveAttribute('aria-pressed', 'true');

    // Filtre qualité : "Mineur" (label QUALITY_LABELS)
    const minor = page.getByRole('button', { name: /Mineur/ }).first();
    if (await minor.count()) {
      await minor.click();
      await expect(minor).toHaveAttribute('aria-pressed', 'true');
    }

    // Une carte d'accord doit s'afficher après filtrage (Cm)
    const cmCard = page.getByText('Cm', { exact: true }).first();
    await expect(cmCard).toBeVisible();

    // Taper la carte → handler onPlay (strum). Ne doit pas crasher.
    await cmCard.click();

    // Aucune erreur console liée au clic d'accord
    expect(
      errors.filter((e) => /chord|strum|audio/i.test(e)),
      `erreurs audio: ${errors.join(' | ')}`
    ).toHaveLength(0);
  });
});
