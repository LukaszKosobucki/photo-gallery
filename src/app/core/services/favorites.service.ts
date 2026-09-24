import {
  computed,
  inject,
  Injectable,
  InjectionToken,
  signal,
  Signal,
} from '@angular/core';
import { Photo } from '../models';

export const FAVORITES_STORAGE_KEY = 'photo_gallery_favorites';

export const FAVORITES_STORAGE = new InjectionToken<Storage>(
  'FAVORITES_STORAGE',
  {
    providedIn: 'root',
    factory: () =>
      typeof window !== 'undefined' ? window.localStorage : ({} as Storage),
  },
);

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private readonly storage = inject(FAVORITES_STORAGE);

  private readonly _favorites = signal<Photo[]>(this.loadFromStorage());

  readonly favorites: Signal<Photo[]> = this._favorites.asReadonly();

  readonly favoriteIds: Signal<Set<string>> = computed(
    () => new Set(this._favorites().map((photo) => photo.id)),
  );

  readonly totalFavorites: Signal<number> = computed(
    () => this._favorites().length,
  );

  isFavorite(id: string): boolean {
    return this.favoriteIds().has(id);
  }

  addFavorite(photo: Photo): void {
    if (!photo?.id) {
      return;
    }

    const current = this._favorites();
    const alreadyExists = current.some((item) => item.id === photo.id);
    if (alreadyExists) {
      return;
    }

    const updated = [...current, photo];
    this.updateState(updated);
  }

  removeFavorite(id: string): void {
    if (!id) {
      return;
    }

    const current = this._favorites();
    const updated = current.filter((item) => item.id !== id);
    if (updated.length !== current.length) {
      this.updateState(updated);
    }
  }

  toggleFavorite(photo: Photo): void {
    if (!photo?.id) {
      return;
    }

    if (this.isFavorite(photo.id)) {
      this.removeFavorite(photo.id);
    } else {
      this.addFavorite(photo);
    }
  }

  clearFavorites(): void {
    this.updateState([]);
  }

  getFavoriteById(id: string): Photo | undefined {
    return this._favorites().find((item) => item.id === id);
  }

  private updateState(items: Photo[]): void {
    this._favorites.set(items);
    this.saveToStorage(items);
  }

  private loadFromStorage(): Photo[] {
    try {
      if (!this.storage || typeof this.storage.getItem !== 'function') {
        return [];
      }
      const raw = this.storage.getItem(FAVORITES_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is Photo =>
            typeof item === 'object' &&
            item !== null &&
            typeof item.id === 'string',
        );
      }
      return [];
    } catch (error) {
      console.warn('Failed to load favorites from storage:', error);
      return [];
    }
  }

  private saveToStorage(items: Photo[]): void {
    try {
      if (this.storage && typeof this.storage.setItem === 'function') {
        this.storage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (error) {
      console.warn('Failed to save favorites to storage:', error);
    }
  }
}
