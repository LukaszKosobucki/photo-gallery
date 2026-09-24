import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  LoadingSpinnerComponent,
  PhotoCardComponent,
  PhotoGridComponent,
} from '../../components';
import {
  InfiniteScrollSentinelDirective,
  useInfiniteScroll,
} from '../../core/infinite-scroll';
import { Photo } from '../../core/models';
import { FavoritesService, PhotoApiService } from '../../core/services';

@Component({
  selector: 'app-photo-gallery',
  standalone: true,
  imports: [
    MatButtonModule,
    PhotoGridComponent,
    PhotoCardComponent,
    LoadingSpinnerComponent,
    InfiniteScrollSentinelDirective,
  ],
  templateUrl: './photo-gallery.component.html',
  styleUrl: './photo-gallery.component.scss',
})
export class PhotoGalleryComponent {
  private readonly photoApiService = inject(PhotoApiService);
  private readonly favoritesService = inject(FavoritesService);

  readonly scrollManager = useInfiniteScroll<Photo>({
    fetcher: (params) => this.photoApiService.getPhotos(params),
    pageSize: 20,
    autoFetchFirstPage: true,
  });

  isFavorite(id: string): boolean {
    return this.favoritesService.isFavorite(id);
  }

  onPhotoClick(photo: Photo): void {
    this.favoritesService.addFavorite(photo);
  }
}
