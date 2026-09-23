import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Photo Gallery',
    loadComponent: () =>
      import('./pages/photo-gallery/photo-gallery.component').then(
        (m) => m.PhotoGalleryComponent
      ),
  },
  {
    path: 'favorites',
    title: 'Favorites',
    loadComponent: () =>
      import('./pages/favorites/favorites.component').then(
        (m) => m.FavoritesComponent
      ),
  },
  {
    path: 'photos/:id',
    title: 'Photo Details',
    loadComponent: () =>
      import('./pages/photo-details/photo-details.component').then(
        (m) => m.PhotoDetailsComponent
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
