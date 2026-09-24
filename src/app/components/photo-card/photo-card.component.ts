import { Component, input, output, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Photo } from '../../core/models';

@Component({
  selector: 'app-photo-card',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './photo-card.component.html',
  styleUrl: './photo-card.component.scss',
})
export class PhotoCardComponent {
  readonly photo = input.required<Photo>();
  readonly isFavorite = input<boolean>(false);

  readonly cardClick = output<Photo>();

  readonly imageLoading = signal<boolean>(true);
  readonly imageError = signal<boolean>(false);

  onCardClick(): void {
    this.cardClick.emit(this.photo());
  }

  onImageLoad(): void {
    this.imageLoading.set(false);
  }

  onImageError(): void {
    this.imageLoading.set(false);
    this.imageError.set(true);
  }
}
