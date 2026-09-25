import { test, expect } from '@playwright/test';
import { AppRoutes } from './constants';
import {
  FavoritesPage,
  NavbarPom,
  PhotoDetailsPage,
  PhotoGalleryPage,
} from './pages';

test.describe('Routing and E2E Flow', () => {
  let galleryPage: PhotoGalleryPage;
  let favoritesPage: FavoritesPage;
  let photoDetailsPage: PhotoDetailsPage;
  let navbar: NavbarPom;

  test.beforeEach(async ({ page }) => {
    galleryPage = new PhotoGalleryPage(page);
    favoritesPage = new FavoritesPage(page);
    photoDetailsPage = new PhotoDetailsPage(page);
    navbar = new NavbarPom(page);
  });

  test('should complete the entire user flow: add to favorites, persist on reload, view details, and remove', async ({ page }) => {
    await galleryPage.goto();
    await galleryPage.expectPhotosLoaded();
    await navbar.expectFavoritesCount(0);

    await galleryPage.clickFirstPhoto();
    await navbar.expectFavoritesCount(1);

    await navbar.navigateToFavorites();
    await favoritesPage.expectFavoritePhotosVisible();

    await page.reload();
    await favoritesPage.expectFavoritePhotosVisible();
    await navbar.expectFavoritesCount(1);

    await favoritesPage.clickFirstPhoto();
    await photoDetailsPage.expectHeroImageVisible();

    await photoDetailsPage.removeFavorite();

    await navbar.expectFavoritesCount(0);
    await favoritesPage.expectEmptyStateVisible();
    await favoritesPage.expectPhotoCount(0);
  });

  test('should redirect unknown routes to home page', async ({ page }) => {
    await page.goto(AppRoutes.UNKNOWN);
    await expect(page).toHaveURL(/localhost:4200\/?$/);
  });

  test('should automatically load additional cards when viewport is large and has no scrollbar', async () => {
    await galleryPage.setLargeViewport();
    await galleryPage.goto();
    await galleryPage.expectPhotosLoaded();
    await galleryPage.expectPhotoCountGreaterThan(20);
  });
});
