import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { PhotoDetailsComponent } from './photo-details.component';
import { FavoritesService, PhotoApiService, FAVORITES_STORAGE } from '../../core/services';
import { Photo } from '../../core/models';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { By } from '@angular/platform-browser';

@Component({ template: '' })
class DummyComponent {}

describe('PhotoDetailsComponent', () => {
  let component: PhotoDetailsComponent;
  let fixture: ComponentFixture<PhotoDetailsComponent>;
  let favoritesService: FavoritesService;
  let photoApiSpy: jest.Mocked<PhotoApiService>;
  let router: Router;
  let mockStorage: Record<string, string>;

  const favoritePhoto: Photo = {
    id: '10',
    url: 'https://picsum.photos/id/10/200/300',
    title: 'Photo #10',
  };

  const apiPhoto: Photo = {
    id: '25',
    url: 'https://picsum.photos/id/25/200/300',
    title: 'Photo #25',
  };

  beforeEach(async () => {
    mockStorage = {};

    photoApiSpy = {
      totalPhotos: 100,
      calculateDelay: jest.fn().mockReturnValue(0),
      getPhotos: jest.fn(),
      getPhotoById: jest.fn().mockImplementation((id: string) => {
        if (id === '25') {
          return of(apiPhoto);
        }
        return of(null);
      }),
    } as unknown as jest.Mocked<PhotoApiService>;

    await TestBed.configureTestingModule({
      imports: [PhotoDetailsComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'favorites', component: DummyComponent },
          { path: 'photos/:id', component: PhotoDetailsComponent },
        ]),
        { provide: PhotoApiService, useValue: photoApiSpy },
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
    fixture = TestBed.createComponent(PhotoDetailsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should display photo directly from FavoritesService when ID is in favorites', () => {
    favoritesService.addFavorite(favoritePhoto);
    fixture.componentRef.setInput('id', '10');
    fixture.detectChanges();

    expect(photoApiSpy.getPhotoById).not.toHaveBeenCalled();

    const imgEl: HTMLImageElement = fixture.nativeElement.querySelector('.hero-image');
    expect(imgEl).toBeTruthy();
    expect(imgEl.src).toBe(favoritePhoto.url.replace('/200/300', '/600/900'));

    const removeBtn = fixture.nativeElement.querySelector('.remove-favorite-btn');
    expect(removeBtn).toBeTruthy();
  });

  it('should fallback to PhotoApiService when photo is not in favorites', () => {
    fixture.componentRef.setInput('id', '25');
    fixture.detectChanges();

    expect(photoApiSpy.getPhotoById).toHaveBeenCalledWith('25');

    const imgEl: HTMLImageElement = fixture.nativeElement.querySelector('.hero-image');
    expect(imgEl).toBeTruthy();
    expect(imgEl.src).toBe(apiPhoto.url.replace('/200/300', '/600/900'));

    const addBtn = fixture.nativeElement.querySelector('.add-favorite-btn');
    expect(addBtn).toBeTruthy();
  });

  it('should display not-found state when photo does not exist', () => {
    fixture.componentRef.setInput('id', '999');
    fixture.detectChanges();

    const notFoundEl = fixture.nativeElement.querySelector('.not-found-state');
    expect(notFoundEl).toBeTruthy();
    expect(notFoundEl.textContent).toContain('Photo Not Found');

    const heroEl = fixture.nativeElement.querySelector('.hero-viewer');
    expect(heroEl).toBeNull();
  });

  it('should display loading spinner when fetching photo from API', () => {
    const pendingSubject = new Subject<Photo | null>();
    photoApiSpy.getPhotoById.mockReturnValueOnce(pendingSubject.asObservable());

    fixture.componentRef.setInput('id', '50');
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.directive(LoadingSpinnerComponent));
    expect(spinner).toBeTruthy();

    pendingSubject.next(apiPhoto);
    pendingSubject.complete();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(LoadingSpinnerComponent))).toBeNull();
    const imgEl: HTMLImageElement = fixture.nativeElement.querySelector('.hero-image');
    expect(imgEl).toBeTruthy();
    expect(imgEl.src).toBe(apiPhoto.url.replace('/200/300', '/600/900'));
  });

  it('should call removeFavorite and navigate to /favorites when clicking remove button', () => {
    favoritesService.addFavorite(favoritePhoto);
    fixture.componentRef.setInput('id', '10');
    fixture.detectChanges();

    const removeSpy = jest.spyOn(favoritesService, 'removeFavorite');
    const navigateSpy = jest.spyOn(router, 'navigate');

    const removeBtn: HTMLElement = fixture.nativeElement.querySelector('.remove-favorite-btn');
    removeBtn.click();

    expect(removeSpy).toHaveBeenCalledWith('10');
    expect(navigateSpy).toHaveBeenCalledWith(['/favorites']);
  });

  it('should add photo to favorites when clicking add favorite button', () => {
    fixture.componentRef.setInput('id', '25');
    fixture.detectChanges();

    const addSpy = jest.spyOn(favoritesService, 'addFavorite');

    const addBtn: HTMLElement = fixture.nativeElement.querySelector('.add-favorite-btn');
    addBtn.click();
    fixture.detectChanges();

    expect(addSpy).toHaveBeenCalledWith(apiPhoto);
    expect(favoritesService.isFavorite('25')).toBe(true);

    const removeBtn = fixture.nativeElement.querySelector('.remove-favorite-btn');
    expect(removeBtn).toBeTruthy();
  });

  it('should navigate when clicking back button', () => {
    fixture.componentRef.setInput('id', '25');
    fixture.detectChanges();

    const navigateSpy = jest.spyOn(router, 'navigate');
    const backBtn: HTMLElement = fixture.nativeElement.querySelector('.back-btn');
    backBtn.click();

    expect(navigateSpy).toHaveBeenCalled();
  });
});
