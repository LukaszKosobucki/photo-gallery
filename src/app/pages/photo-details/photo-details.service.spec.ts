import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PhotoDetailsService } from './photo-details.service';
import { FavoritesService, PhotoApiService, FAVORITES_STORAGE } from '../../core/services';
import { Photo } from '../../core/models';

describe('PhotoDetailsService', () => {
  let service: PhotoDetailsService;
  let favoritesService: FavoritesService;
  let photoApiSpy: jest.Mocked<PhotoApiService>;
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

  beforeEach(() => {
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

    TestBed.configureTestingModule({
      providers: [
        PhotoDetailsService,
        FavoritesService,
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
    });

    service = TestBed.inject(PhotoDetailsService);
    favoritesService = TestBed.inject(FavoritesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.photo()).toBeNull();
    expect(service.isLoading()).toBe(false);
    expect(service.notFound()).toBe(false);
    expect(service.displayUrl()).toBe('');
  });

  it('should handle undefined or empty photo id', () => {
    service.loadPhoto(undefined);

    expect(service.photo()).toBeNull();
    expect(service.notFound()).toBe(true);
    expect(service.isLoading()).toBe(false);
    expect(service.displayUrl()).toBe('');
  });

  it('should load photo directly from FavoritesService when present', () => {
    favoritesService.addFavorite(favoritePhoto);

    service.loadPhoto('10');

    expect(photoApiSpy.getPhotoById).not.toHaveBeenCalled();
    expect(service.photo()).toEqual(favoritePhoto);
    expect(service.notFound()).toBe(false);
    expect(service.isLoading()).toBe(false);
    expect(service.displayUrl()).toBe('https://picsum.photos/id/10/600/900');
  });

  it('should fetch photo from PhotoApiService when not in favorites', () => {
    service.loadPhoto('25');

    expect(photoApiSpy.getPhotoById).toHaveBeenCalledWith('25');
    expect(service.photo()).toEqual(apiPhoto);
    expect(service.notFound()).toBe(false);
    expect(service.isLoading()).toBe(false);
    expect(service.displayUrl()).toBe('https://picsum.photos/id/25/600/900');
  });

  it('should set notFound when photo is not found in API', () => {
    service.loadPhoto('999');

    expect(photoApiSpy.getPhotoById).toHaveBeenCalledWith('999');
    expect(service.photo()).toBeNull();
    expect(service.notFound()).toBe(true);
    expect(service.isLoading()).toBe(false);
    expect(service.displayUrl()).toBe('');
  });

  it('should set notFound on API error', () => {
    photoApiSpy.getPhotoById.mockReturnValueOnce(throwError(() => new Error('Network error')));

    service.loadPhoto('50');

    expect(service.photo()).toBeNull();
    expect(service.notFound()).toBe(true);
    expect(service.isLoading()).toBe(false);
    expect(service.displayUrl()).toBe('');
  });
});
