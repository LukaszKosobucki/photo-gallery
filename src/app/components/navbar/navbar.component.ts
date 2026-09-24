import { Location } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FavoritesService } from '../../core/services';

export type NavTab = 'photos' | 'favorites';

@Component({
  selector: 'app-navbar',
  imports: [MatToolbarModule, MatButtonToggleModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);
  private readonly favoritesService = inject(FavoritesService);
  private lastNavigatedUrl = '';

  readonly currentTab = signal<NavTab>(this.getInitialTab());
  readonly favoritesCount = this.favoritesService.totalFavorites;

  ngOnInit(): void {
    this.updateActiveTab();
    this.subscribeToRouterEvents();
  }

  determineTab(url: string): NavTab {
    const cleanUrl = url.split('?')[0].split('#')[0];
    if (cleanUrl.startsWith('/favorites') || cleanUrl.startsWith('/photos')) {
      return 'favorites';
    }
    return 'photos';
  }

  navigateTo(tab: NavTab): void {
    const targetRoute = tab === 'photos' ? '/' : '/favorites';
    if (this.router.url === targetRoute || this.lastNavigatedUrl === targetRoute) {
      return;
    }
    this.lastNavigatedUrl = targetRoute;
    this.router.navigateByUrl(targetRoute).finally(() => {
      this.lastNavigatedUrl = '';
    });
  }

  private getInitialTab(): NavTab {
    const path = this.location.path() || this.router.url;
    return this.determineTab(path);
  }

  private updateActiveTab(): void {
    const path = this.location.path() || this.router.url;
    this.currentTab.set(this.determineTab(path));
  }

  private subscribeToRouterEvents(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((event) => {
        this.currentTab.set(this.determineTab(event.urlAfterRedirects || event.url));
      });
  }
}
