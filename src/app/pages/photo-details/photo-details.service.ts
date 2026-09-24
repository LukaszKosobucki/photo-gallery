import { computed, inject, Injectable, signal } from '@angular/core';
import { Photo } from '../../core/models';
import { FavoritesService, PhotoApiService } from '../../core/services';

@Injectable()
export class PhotoDetailsService {
  private readonly favoritesService = inject(FavoritesService);
  private readonly photoApiService = inject(PhotoApiService);

  readonly photo = signal<Photo | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly notFound = signal<boolean>(false);

  readonly displayUrl = computed(() => {
    const current = this.photo();
    if (!current?.url) {
      return '';
    }
    return current.url.replace('/200/300', '/600/900');
  });

  loadPhoto(photoId: string | undefined): void {
    if (!photoId) {
      this.photo.set(null);
      this.notFound.set(true);
      this.isLoading.set(false);
      return;
    }

    const favorite = this.favoritesService.getFavoriteById(photoId);
    if (favorite) {
      this.photo.set(favorite);
      this.notFound.set(false);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.notFound.set(false);
    this.photoApiService.getPhotoById(photoId).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res) {
          this.photo.set(res);
          this.notFound.set(false);
        } else {
          this.photo.set(null);
          this.notFound.set(true);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.photo.set(null);
        this.notFound.set(true);
      },
    });
  }
}
