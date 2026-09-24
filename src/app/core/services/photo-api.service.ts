import { Injectable } from '@angular/core';
import { defer, delay, Observable, of } from 'rxjs';
import { PaginatedResponse, PaginationParams, Photo } from '../models';

export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_TOTAL_PHOTOS = 100;

@Injectable({
  providedIn: 'root',
})
export class PhotoApiService {
  readonly totalPhotos: number = DEFAULT_TOTAL_PHOTOS;

  calculateDelay(): number {
    return Math.floor(Math.random() * 101) + 200;
  }

  getPhotos(
    params?: Partial<PaginationParams>,
  ): Observable<PaginatedResponse<Photo>> {
    return defer(() => {
      const rawPage = params?.page ?? 1;
      const page = rawPage > 0 ? Math.floor(rawPage) : 1;

      const rawLimit = params?.limit ?? DEFAULT_PAGE_SIZE;
      const limit = rawLimit > 0 ? Math.floor(rawLimit) : DEFAULT_PAGE_SIZE;

      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, this.totalPhotos);

      const data: Photo[] = [];
      if (startIndex < this.totalPhotos) {
        for (let i = startIndex + 1; i <= endIndex; i++) {
          const id = String(i);
          data.push({
            id,
            url: `https://picsum.photos/id/${id}/200/300`,
            title: `Photo #${id}`,
          });
        }
      }

      const hasMore = endIndex < this.totalPhotos;
      const response: PaginatedResponse<Photo> = {
        data,
        page,
        limit,
        total: this.totalPhotos,
        hasMore,
      };

      const delayMs = this.calculateDelay();
      return of(response).pipe(delay(delayMs));
    });
  }

  getPhotoById(id: string): Observable<Photo | null> {
    return defer(() => {
      const numericId = Number(id);
      const isValid =
        !isNaN(numericId) && numericId >= 1 && numericId <= this.totalPhotos;

      const photo: Photo | null = isValid
        ? {
            id,
            url: `https://picsum.photos/id/${id}/200/300`,
            title: `Photo #${id}`,
          }
        : null;

      const delayMs = this.calculateDelay();
      return of(photo).pipe(delay(delayMs));
    });
  }
}
