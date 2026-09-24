import { TestBed } from '@angular/core/testing';
import {
  FavoritesService,
  FAVORITES_STORAGE,
  FAVORITES_STORAGE_KEY,
} from './favorites.service';
import { Photo } from '../models';

describe('FavoritesService', () => {
  let service: FavoritesService;
  let mockStorage: Record<string, string>;
  let storageSpy: {
    getItem: jest.Mock;
    setItem: jest.Mock;
    removeItem: jest.Mock;
    clear: jest.Mock;
  };

  const photo1: Photo = {
    id: '1',
    url: 'https://picsum.photos/id/1/200/300',
    title: 'Photo #1',
  };

  const photo2: Photo = {
    id: '2',
    url: 'https://picsum.photos/id/2/200/300',
    title: 'Photo #2',
  };

  const photo3: Photo = {
    id: '3',
    url: 'https://picsum.photos/id/3/200/300',
    title: 'Photo #3',
  };

  function createService(initialStorageState: Record<string, string> = {}): FavoritesService {
    mockStorage = { ...initialStorageState };
    storageSpy = {
      getItem: jest.fn((key: string) => mockStorage[key] ?? null),
      setItem: jest.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: jest.fn(() => {
        mockStorage = {};
      }),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        FavoritesService,
        { provide: FAVORITES_STORAGE, useValue: storageSpy },
      ],
    });

    return TestBed.inject(FavoritesService);
  }

  beforeEach(() => {
    service = createService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with an empty list when storage is empty', () => {
      expect(service.favorites()).toEqual([]);
      expect(service.totalFavorites()).toBe(0);
      expect(service.favoriteIds().size).toBe(0);
    });

    it('should load pre-existing favorites from storage', () => {
      const stored = [photo1, photo2];
      const customService = createService({
        [FAVORITES_STORAGE_KEY]: JSON.stringify(stored),
      });

      expect(customService.favorites()).toEqual(stored);
      expect(customService.totalFavorites()).toBe(2);
      expect(customService.isFavorite('1')).toBe(true);
      expect(customService.isFavorite('2')).toBe(true);
      expect(customService.isFavorite('3')).toBe(false);
    });

    it('should handle corrupted JSON in storage gracefully by defaulting to empty array', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const customService = createService({
        [FAVORITES_STORAGE_KEY]: 'invalid{json:data',
      });

      expect(customService.favorites()).toEqual([]);
      expect(customService.totalFavorites()).toBe(0);
      warnSpy.mockRestore();
    });

    it('should ignore non-array data stored in storage', () => {
      const customService = createService({
        [FAVORITES_STORAGE_KEY]: JSON.stringify({ notAnArray: true }),
      });

      expect(customService.favorites()).toEqual([]);
      expect(customService.totalFavorites()).toBe(0);
    });
  });

  describe('addFavorite & duplicate prevention', () => {
    it('should add a photo to favorites and persist it to storage', () => {
      service.addFavorite(photo1);

      expect(service.favorites()).toEqual([photo1]);
      expect(service.totalFavorites()).toBe(1);
      expect(service.isFavorite('1')).toBe(true);
      expect(storageSpy.setItem).toHaveBeenCalledWith(
        FAVORITES_STORAGE_KEY,
        JSON.stringify([photo1])
      );
    });

    it('should prevent adding duplicate photos with the same id', () => {
      service.addFavorite(photo1);
      expect(service.totalFavorites()).toBe(1);

      service.addFavorite(photo1);
      service.addFavorite({ ...photo1, title: 'Different title but same ID' });

      expect(service.favorites()).toEqual([photo1]);
      expect(service.totalFavorites()).toBe(1);
      expect(storageSpy.setItem).toHaveBeenCalledTimes(1);
    });

    it('should allow adding multiple distinct photos', () => {
      service.addFavorite(photo1);
      service.addFavorite(photo2);
      service.addFavorite(photo3);

      expect(service.favorites()).toEqual([photo1, photo2, photo3]);
      expect(service.totalFavorites()).toBe(3);
      expect(service.isFavorite('1')).toBe(true);
      expect(service.isFavorite('2')).toBe(true);
      expect(service.isFavorite('3')).toBe(true);
      expect(storageSpy.setItem).toHaveBeenCalledTimes(3);
    });

    it('should ignore invalid or empty photo objects', () => {
      service.addFavorite(null as unknown as Photo);
      service.addFavorite(undefined as unknown as Photo);
      service.addFavorite({ url: 'https://example.com' } as unknown as Photo);

      expect(service.favorites()).toEqual([]);
      expect(service.totalFavorites()).toBe(0);
      expect(storageSpy.setItem).not.toHaveBeenCalled();
    });
  });

  describe('removeFavorite', () => {
    beforeEach(() => {
      service.addFavorite(photo1);
      service.addFavorite(photo2);
      storageSpy.setItem.mockClear();
    });

    it('should remove a photo by id and update storage', () => {
      service.removeFavorite('1');

      expect(service.favorites()).toEqual([photo2]);
      expect(service.totalFavorites()).toBe(1);
      expect(service.isFavorite('1')).toBe(false);
      expect(service.isFavorite('2')).toBe(true);
      expect(storageSpy.setItem).toHaveBeenCalledWith(
        FAVORITES_STORAGE_KEY,
        JSON.stringify([photo2])
      );
    });

    it('should do nothing if trying to remove an id that is not in favorites', () => {
      service.removeFavorite('999');

      expect(service.favorites()).toEqual([photo1, photo2]);
      expect(service.totalFavorites()).toBe(2);
      expect(storageSpy.setItem).not.toHaveBeenCalled();
    });

    it('should ignore empty id input', () => {
      service.removeFavorite('');

      expect(service.favorites()).toEqual([photo1, photo2]);
      expect(service.totalFavorites()).toBe(2);
      expect(storageSpy.setItem).not.toHaveBeenCalled();
    });
  });

  describe('toggleFavorite', () => {
    it('should add photo if it was not in favorites', () => {
      service.toggleFavorite(photo1);

      expect(service.isFavorite('1')).toBe(true);
      expect(service.favorites()).toEqual([photo1]);
    });

    it('should remove photo if it was already in favorites', () => {
      service.addFavorite(photo1);
      expect(service.isFavorite('1')).toBe(true);

      service.toggleFavorite(photo1);
      expect(service.isFavorite('1')).toBe(false);
      expect(service.favorites()).toEqual([]);
    });

    it('should safely handle toggle with invalid input', () => {
      service.toggleFavorite(null as unknown as Photo);
      expect(service.favorites()).toEqual([]);
    });
  });

  describe('getFavoriteById', () => {
    it('should return the photo object when present', () => {
      service.addFavorite(photo1);

      expect(service.getFavoriteById('1')).toEqual(photo1);
    });

    it('should return undefined when not found', () => {
      expect(service.getFavoriteById('unknown')).toBeUndefined();
    });
  });

  describe('clearFavorites', () => {
    it('should clear all favorite photos and persist empty array', () => {
      service.addFavorite(photo1);
      service.addFavorite(photo2);
      storageSpy.setItem.mockClear();

      service.clearFavorites();

      expect(service.favorites()).toEqual([]);
      expect(service.totalFavorites()).toBe(0);
      expect(service.favoriteIds().size).toBe(0);
      expect(storageSpy.setItem).toHaveBeenCalledWith(
        FAVORITES_STORAGE_KEY,
        JSON.stringify([])
      );
    });
  });

  describe('storage error handling', () => {
    it('should catch storage write errors gracefully without crashing state', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      storageSpy.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      service.addFavorite(photo1);

      expect(service.favorites()).toEqual([photo1]);
      expect(service.isFavorite('1')).toBe(true);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
