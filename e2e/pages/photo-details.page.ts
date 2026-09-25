import { type Locator, type Page, expect } from '@playwright/test';
import { AppRoutes, TestId } from '../constants';

export class PhotoDetailsPage {
  readonly heroImage: Locator;
  readonly removeFavoriteButton: Locator;
  readonly addFavoriteButton: Locator;
  readonly backButton: Locator;

  constructor(private readonly page: Page) {
    this.heroImage = this.page.getByTestId(TestId.HERO_IMAGE);
    this.removeFavoriteButton = this.page.getByTestId(TestId.REMOVE_FAVORITE_BTN);
    this.addFavoriteButton = this.page.getByTestId(TestId.ADD_FAVORITE_BTN);
    this.backButton = this.page.getByTestId(TestId.BACK_BTN);
  }

  async expectPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(AppRoutes.PHOTO_DETAILS_REGEX);
    await expect(this.heroImage).toBeVisible();
  }

  async expectHeroImageVisible(): Promise<void> {
    await expect(this.heroImage).toBeVisible();
  }

  async removeFavorite(): Promise<void> {
    await expect(this.removeFavoriteButton).toBeVisible();
    await this.removeFavoriteButton.click();
    await expect(this.page).toHaveURL(new RegExp(`${AppRoutes.FAVORITES}$`));
  }

  async addFavorite(): Promise<void> {
    await expect(this.addFavoriteButton).toBeVisible();
    await this.addFavoriteButton.click();
  }

  async goBack(): Promise<void> {
    await this.backButton.click();
  }
}
