import { type Locator, type Page, expect } from '@playwright/test';
import { AppRoutes, TestId } from '../constants';

export class PhotoGalleryPage {
  readonly photoCards: Locator;
  readonly firstPhotoCard: Locator;
  readonly sentinel: Locator;

  constructor(private readonly page: Page) {
    this.photoCards = this.page.getByTestId(TestId.PHOTO_CARD);
    this.firstPhotoCard = this.photoCards.first();
    this.sentinel = this.page.getByTestId(TestId.SENTINEL);
  }

  async goto(): Promise<void> {
    await this.page.goto(AppRoutes.GALLERY);
  }

  async setLargeViewport(width = 1920, height = 1600): Promise<void> {
    await this.page.setViewportSize({ width, height });
  }

  async expectPhotosLoaded(timeout = 15000): Promise<void> {
    await expect(this.firstPhotoCard).toBeVisible({ timeout });
  }

  async clickFirstPhoto(): Promise<void> {
    await this.firstPhotoCard.click();
  }

  async getPhotoCount(): Promise<number> {
    return this.photoCards.count();
  }

  async expectPhotoCountGreaterThan(count: number, timeout = 15000): Promise<void> {
    await expect(async () => {
      const currentCount = await this.getPhotoCount();
      expect(currentCount).toBeGreaterThan(count);
    }).toPass({ timeout });
  }
}
