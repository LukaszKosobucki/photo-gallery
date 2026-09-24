import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { LoadingSpinnerComponent } from '../../components';
import { FavoritesService } from '../../core/services';
import { PhotoDetailsService } from './photo-details.service';

@Component({
  selector: 'app-photo-details',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, LoadingSpinnerComponent],
  templateUrl: './photo-details.component.html',
  styleUrl: './photo-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PhotoDetailsService],
})
export class PhotoDetailsComponent implements OnInit {
  private readonly detailsService = inject(PhotoDetailsService);
  private readonly favoritesService = inject(FavoritesService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly id = input<string>();

  readonly photo = this.detailsService.photo;
  readonly isLoading = this.detailsService.isLoading;
  readonly notFound = this.detailsService.notFound;
  readonly displayUrl = this.detailsService.displayUrl;

  readonly isFavorite = computed(() => {
    const currentId = this.id();
    return currentId ? this.favoritesService.isFavorite(currentId) : false;
  });

  ngOnInit(): void {
    this.loadPhoto();
  }

  loadPhoto(id?: string): void {
    this.detailsService.loadPhoto(id ?? this.id());
  }

  removeFavorite(): void {
    const photoId = this.id();
    if (photoId) {
      this.favoritesService.removeFavorite(photoId);
      this.router.navigate(['/favorites']);
    }
  }

  addFavorite(): void {
    const currentPhoto = this.photo();
    if (currentPhoto) {
      this.favoritesService.addFavorite(currentPhoto);
    }
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/favorites']);
    }
  }
}
