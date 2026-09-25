import { type Locator, type Page, expect } from '@playwright/test';
import { AppRoutes, TestId } from '../constants';

export class NavbarPom {
  readonly photosTab: Locator;
  readonly favoritesTab: Locator;
  readonly favoritesBadge: Locator;

  constructor(private readonly page: Page) {
    this.photosTab = this.page.getByTestId(TestId.NAV_PHOTOS_TAB);
    this.favoritesTab = this.page.getByTestId(TestId.NAV_FAVORITES_TAB);
    this.favoritesBadge = this.page.getByTestId(TestId.FAVORITES_BADGE);
  }

  async navigateToPhotos(): Promise<void> {
    await this.photosTab.click();
    await expect(this.page).toHaveURL(new RegExp(`${AppRoutes.HOME}$`));
  }

  async navigateToFavorites(): Promise<void> {
    await this.favoritesTab.click();
    await expect(this.page).toHaveURL(new RegExp(`${AppRoutes.FAVORITES}$`));
  }

  async expectFavoritesCount(count: number | string): Promise<void> {
    await expect(this.favoritesBadge).toHaveText(String(count));
  }
}
