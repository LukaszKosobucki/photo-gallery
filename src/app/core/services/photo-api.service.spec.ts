import { TestBed } from '@angular/core/testing';
import { PaginatedResponse, Photo } from '../models';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_TOTAL_PHOTOS,
  PhotoApiService,
} from './photo-api.service';

describe('PhotoApiService', () => {
  let service: PhotoApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PhotoApiService],
    });
    service = TestBed.inject(PhotoApiService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateDelay', () => {
    it('should always return an integer between 200 and 300 ms', () => {
      for (let i = 0; i < 500; i++) {
        const delay = service.calculateDelay();
        expect(Number.isInteger(delay)).toBe(true);
        expect(delay).toBeGreaterThanOrEqual(200);
        expect(delay).toBeLessThanOrEqual(300);
      }
    });

    it('should return 200 when Math.random returns 0', () => {
      const spy = jest.spyOn(Math, 'random').mockReturnValue(0);
      expect(service.calculateDelay()).toBe(200);
      spy.mockRestore();
    });

    it('should return 300 when Math.random returns maximum value approaching 1', () => {
      const spy = jest.spyOn(Math, 'random').mockReturnValue(0.99999);
      expect(service.calculateDelay()).toBe(300);
      spy.mockRestore();
    });
  });

  describe('getPhotos pagination and data structure', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should return the first page with default parameters', () => {
      let result: PaginatedResponse<Photo> | undefined;

      service.getPhotos().subscribe((res) => {
        result = res;
      });

      jest.runAllTimers();

      expect(result).toBeDefined();
      expect(result?.page).toBe(1);
      expect(result?.limit).toBe(DEFAULT_PAGE_SIZE);
      expect(result?.total).toBe(DEFAULT_TOTAL_PHOTOS);
      expect(result?.data.length).toBe(DEFAULT_PAGE_SIZE);
      expect(result?.hasMore).toBe(true);

      expect(result?.data[0]).toEqual({
        id: '1',
        url: 'https://picsum.photos/id/1/200/300',
        title: 'Photo #1',
      });
      expect(result?.data[DEFAULT_PAGE_SIZE - 1]).toEqual({
        id: String(DEFAULT_PAGE_SIZE),
        url: `https://picsum.photos/id/${DEFAULT_PAGE_SIZE}/200/300`,
        title: `Photo #${DEFAULT_PAGE_SIZE}`,
      });
    });

    it('should return the correct subset for page 2 with no overlapping IDs', () => {
      let page1Result: PaginatedResponse<Photo> | undefined;
      let page2Result: PaginatedResponse<Photo> | undefined;

      service.getPhotos({ page: 1, limit: 10 }).subscribe((res) => {
        page1Result = res;
      });
      service.getPhotos({ page: 2, limit: 10 }).subscribe((res) => {
        page2Result = res;
      });

      jest.runAllTimers();

      expect(page1Result?.data.length).toBe(10);
      expect(page2Result?.data.length).toBe(10);

      expect(page2Result?.page).toBe(2);
      expect(page2Result?.data[0].id).toBe('11');
      expect(page2Result?.data[9].id).toBe('20');

      const page1Ids = new Set(page1Result?.data.map((p) => p.id));
      const page2Ids = new Set(page2Result?.data.map((p) => p.id));
      const intersection = [...page1Ids].filter((id) => page2Ids.has(id));
      expect(intersection).toEqual([]);
    });

    it('should mark hasMore as false when reaching the end of dataset', () => {
      let lastPageResult: PaginatedResponse<Photo> | undefined;

      service.getPhotos({ page: 10, limit: 10 }).subscribe((res) => {
        lastPageResult = res;
      });

      jest.runAllTimers();

      expect(lastPageResult?.page).toBe(10);
      expect(lastPageResult?.data.length).toBe(10);
      expect(lastPageResult?.data[9].id).toBe('100');
      expect(lastPageResult?.hasMore).toBe(false);
    });

    it('should return empty data array when requesting a page beyond total items', () => {
      let outOfBoundsResult: PaginatedResponse<Photo> | undefined;

      service.getPhotos({ page: 11, limit: 10 }).subscribe((res) => {
        outOfBoundsResult = res;
      });

      jest.runAllTimers();

      expect(outOfBoundsResult?.data).toEqual([]);
      expect(outOfBoundsResult?.hasMore).toBe(false);
    });

    it('should sanitize negative or zero page and limit values', () => {
      let sanitizedResult: PaginatedResponse<Photo> | undefined;

      service.getPhotos({ page: -3, limit: 0 }).subscribe((res) => {
        sanitizedResult = res;
      });

      jest.runAllTimers();

      expect(sanitizedResult?.page).toBe(1);
      expect(sanitizedResult?.limit).toBe(DEFAULT_PAGE_SIZE);
      expect(sanitizedResult?.data.length).toBe(DEFAULT_PAGE_SIZE);
    });

    it('should format all URLs according to https://picsum.photos/id/{id}/200/300 specification', () => {
      let result: PaginatedResponse<Photo> | undefined;

      service.getPhotos({ page: 1, limit: 5 }).subscribe((res) => {
        result = res;
      });

      jest.runAllTimers();

      result?.data.forEach((photo) => {
        expect(photo.url).toBe(`https://picsum.photos/id/${photo.id}/200/300`);
        expect(photo.title).toBe(`Photo #${photo.id}`);
      });
    });
  });

  describe('artificial delay behavior', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should delay getPhotos response by the calculated delay', () => {
      jest.spyOn(service, 'calculateDelay').mockReturnValue(250);

      let emitted = false;
      service.getPhotos({ page: 1, limit: 10 }).subscribe(() => {
        emitted = true;
      });

      expect(emitted).toBe(false);

      jest.advanceTimersByTime(249);
      expect(emitted).toBe(false);

      jest.advanceTimersByTime(1);
      expect(emitted).toBe(true);
    });

    it('should calculate delay independently for distinct subscriptions', () => {
      const delaySpy = jest
        .spyOn(service, 'calculateDelay')
        .mockReturnValueOnce(210)
        .mockReturnValueOnce(290);

      let call1Emitted = false;
      let call2Emitted = false;

      service.getPhotos({ page: 1 }).subscribe(() => {
        call1Emitted = true;
      });
      service.getPhotos({ page: 2 }).subscribe(() => {
        call2Emitted = true;
      });

      expect(delaySpy).toHaveBeenCalledTimes(2);

      jest.advanceTimersByTime(210);
      expect(call1Emitted).toBe(true);
      expect(call2Emitted).toBe(false);

      jest.advanceTimersByTime(80);
      expect(call2Emitted).toBe(true);
    });
  });

  describe('getPhotoById', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it('should return photo for a valid ID', () => {
      let photo: Photo | null | undefined;

      service.getPhotoById('42').subscribe((res) => {
        photo = res;
      });

      jest.runAllTimers();

      expect(photo).toEqual({
        id: '42',
        url: 'https://picsum.photos/id/42/200/300',
        title: 'Photo #42',
      });
    });

    it('should return null for an invalid or non-existent ID', () => {
      let photo: Photo | null | undefined;

      service.getPhotoById('9999').subscribe((res) => {
        photo = res;
      });

      jest.runAllTimers();

      expect(photo).toBeNull();
    });

    it('should return null for non-numeric ID', () => {
      let photo: Photo | null | undefined;

      service.getPhotoById('invalid-id').subscribe((res) => {
        photo = res;
      });

      jest.runAllTimers();

      expect(photo).toBeNull();
    });
  });
});
