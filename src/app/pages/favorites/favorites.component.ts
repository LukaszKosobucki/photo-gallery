import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Photo } from '../../core/models';
import { FavoritesService } from '../../core/services';
import { PhotoCardComponent, PhotoGridComponent } from '../../components';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    PhotoGridComponent,
    PhotoCardComponent,
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesComponent {
  private readonly favoritesService = inject(FavoritesService);
  private readonly router = inject(Router);

  readonly favorites = this.favoritesService.favorites;

  onPhotoClick(photo: Photo): void {
    this.router.navigate(['/photos', photo.id]);
  }
}
