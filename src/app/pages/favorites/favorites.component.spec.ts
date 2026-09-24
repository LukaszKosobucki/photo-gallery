import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { FavoritesComponent } from './favorites.component';
import { FavoritesService, FAVORITES_STORAGE } from '../../core/services';
import { PhotoCardComponent } from '../../components/photo-card/photo-card.component';
import { Photo } from '../../core/models';

@Component({ template: '' })
class DummyComponent {}

describe('FavoritesComponent (Integration)', () => {
  let fixture: ComponentFixture<FavoritesComponent>;
  let component: FavoritesComponent;
  let favoritesService: FavoritesService;
  let router: Router;
  let mockStorage: Record<string, string>;

  const photo1: Photo = {
    id: '10',
    url: 'https://picsum.photos/id/10/200/300',
    title: 'Photo #10',
  };

  const photo2: Photo = {
    id: '20',
    url: 'https://picsum.photos/id/20/200/300',
    title: 'Photo #20',
  };

  beforeEach(async () => {
    mockStorage = {};

    await TestBed.configureTestingModule({
      imports: [FavoritesComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'photos/:id', component: DummyComponent },
          { path: 'favorites', component: DummyComponent },
        ]),
        {
          provide: FAVORITES_STORAGE,
          useValue: {
            getItem: (key: string) => mockStorage[key] ?? null,
            setItem: (key: string, val: string) => {
              mockStorage[key] = val;
            },
            removeItem: (key: string) => {
              delete mockStorage[key];
            },
            clear: () => {
              mockStorage = {};
            },
          },
        },
      ],
    }).compileComponents();

    favoritesService = TestBed.inject(FavoritesService);
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(FavoritesComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display empty state when there are no favorite photos', () => {
    favoritesService.clearFavorites();
    fixture.detectChanges();

    const emptyStateEl = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyStateEl).toBeTruthy();
    expect(emptyStateEl.textContent).toContain('No favorite photos yet');

    const linkEl = fixture.nativeElement.querySelector('a[routerLink="/"]');
    expect(linkEl).toBeTruthy();
    expect(linkEl.textContent.trim()).toBe('Browse Photos');

    const cards = fixture.debugElement.queryAll(By.directive(PhotoCardComponent));
    expect(cards.length).toBe(0);
  });

  it('should render all favorite photos from FavoritesService', () => {
    favoritesService.addFavorite(photo1);
    favoritesService.addFavorite(photo2);
    fixture.detectChanges();

    const emptyStateEl = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyStateEl).toBeNull();

    const cards = fixture.debugElement.queryAll(By.directive(PhotoCardComponent));
    expect(cards.length).toBe(2);

    const firstCard = cards[0].componentInstance as PhotoCardComponent;
    expect(firstCard.photo()).toEqual(photo1);
    expect(firstCard.isFavorite()).toBe(true);

    const secondCard = cards[1].componentInstance as PhotoCardComponent;
    expect(secondCard.photo()).toEqual(photo2);
    expect(secondCard.isFavorite()).toBe(true);
  });

  it('should navigate to /photos/:id when a photo card is clicked', () => {
    favoritesService.addFavorite(photo1);
    fixture.detectChanges();

    const navigateSpy = jest.spyOn(router, 'navigate');

    const cards = fixture.debugElement.queryAll(By.directive(PhotoCardComponent));
    const cardEl: HTMLElement = cards[0].nativeElement.querySelector('.photo-card');
    cardEl.click();

    expect(navigateSpy).toHaveBeenCalledWith(['/photos', '10']);
  });

  it('should update dynamically when a photo is removed from favorites', () => {
    favoritesService.addFavorite(photo1);
    favoritesService.addFavorite(photo2);
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.directive(PhotoCardComponent)).length).toBe(2);

    favoritesService.removeFavorite('10');
    fixture.detectChanges();

    const cards = fixture.debugElement.queryAll(By.directive(PhotoCardComponent));
    expect(cards.length).toBe(1);
    expect((cards[0].componentInstance as PhotoCardComponent).photo().id).toBe('20');
  });
});
