import { test, expect } from '@playwright/test';
import { seedPrefs } from './helpers';

/**
 * Flux 5 — Gammes.
 * Sélectionner une tonalité + une gamme rend le fretboard SVG avec ses
 * notes (cercles) highlightées. Vue 2D par défaut (pas de 3D).
 */
test.describe('Scales', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('sélection de gamme highlight le fretboard', async ({ page }) => {
    await page.goto('/scales');

    // Les selects tonalité + gamme existent
    const selects = page.locator('select');
    await expect(selects.first()).toBeVisible();

    // Le fretboard SVG rend beaucoup de cercles (cordes, inlays, notes
    // highlightées). On compte sur toute la page pour rester robuste au
    // viewport (les icônes de nav n'en ont quasi pas).
    const circles = page.locator('svg circle');
    await expect.poll(() => circles.count()).toBeGreaterThan(10);

    // Change la tonalité + la gamme → re-render sans crash
    await selects.nth(0).selectOption('C');
    await selects.nth(1).selectOption({ index: 0 });

    await expect.poll(() => circles.count()).toBeGreaterThan(10);
  });
});
