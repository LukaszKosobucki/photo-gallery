import { type Locator, type Page, expect } from '@playwright/test';
import { AppRoutes, TestId, UiLabels } from '../constants';

export class FavoritesPage {
  readonly photoCards: Locator;
  readonly firstPhotoCard: Locator;
  readonly emptyState: Locator;
  readonly emptyStateTitle: Locator;

  constructor(private readonly page: Page) {
    this.photoCards = this.page.getByTestId(TestId.PHOTO_CARD);
    this.firstPhotoCard = this.photoCards.first();
    this.emptyState = this.page.getByTestId(TestId.FAVORITES_EMPTY_STATE);
    this.emptyStateTitle = this.page.getByRole('heading', {
      name: UiLabels.EMPTY_FAVORITES_TITLE,
    });
  }

  async goto(): Promise<void> {
    await this.page.goto(AppRoutes.FAVORITES);
  }

  async expectFavoritePhotosVisible(): Promise<void> {
    await expect(this.firstPhotoCard).toBeVisible();
  }

  async clickFirstPhoto(): Promise<void> {
    await this.firstPhotoCard.click();
  }

  async expectEmptyStateVisible(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
    await expect(this.emptyStateTitle).toBeVisible();
  }

  async expectPhotoCount(count: number): Promise<void> {
    await expect(this.photoCards).toHaveCount(count);
  }
}
