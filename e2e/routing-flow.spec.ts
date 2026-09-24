import { test, expect } from '@playwright/test';

test.describe('Routing and E2E Flow', () => {
  test('should complete the entire user flow: add to favorites, persist on reload, view details, and remove', async ({ page }) => {
    await page.goto('/');

    const firstGalleryCard = page.locator('app-photo-card').first();
    await expect(firstGalleryCard).toBeVisible({ timeout: 15000 });

    const favoritesBadge = page.locator('.favorites-badge');
    await expect(favoritesBadge).toHaveText('0');

    await firstGalleryCard.click();
    await expect(favoritesBadge).toHaveText('1');

    await page.locator('mat-button-toggle[value="favorites"]').click();
    await expect(page).toHaveURL(/\/favorites$/);

    const favoriteCard = page.locator('app-photo-card').first();
    await expect(favoriteCard).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/favorites$/);
    await expect(page.locator('app-photo-card').first()).toBeVisible();
    await expect(favoritesBadge).toHaveText('1');

    await page.locator('app-photo-card').first().click();
    await expect(page).toHaveURL(/\/photos\/.+/);
    await expect(page.locator('.hero-image')).toBeVisible();

    const removeButton = page.locator('.remove-favorite-btn');
    await expect(removeButton).toBeVisible();
    await removeButton.click();

    await expect(page).toHaveURL(/\/favorites$/);
    await expect(favoritesBadge).toHaveText('0');
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('app-photo-card')).toHaveCount(0);
  });

  test('should redirect unknown routes to home page', async ({ page }) => {
    await page.goto('/unknown-random-path');
    await expect(page).toHaveURL(/localhost:4200\/?$/);
  });

  test('should automatically load additional cards when viewport is large and has no scrollbar', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1600 });
    await page.goto('/');

    const firstCard = page.locator('app-photo-card').first();
    await expect(firstCard).toBeVisible({ timeout: 15000 });

    await expect(async () => {
      const count = await page.locator('app-photo-card').count();
      expect(count).toBeGreaterThan(20);
    }).toPass({ timeout: 15000 });
  });
});
