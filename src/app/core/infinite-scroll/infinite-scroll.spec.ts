import { TestBed } from '@angular/core/testing';
import { delay, of, throwError } from 'rxjs';
import { PaginatedResponse } from '../models';
import {
  InfiniteScrollManager,
  useInfiniteScroll,
} from './infinite-scroll';

type MockEntry = Partial<IntersectionObserverEntry> & { isIntersecting: boolean };

class MockIntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '';
  readonly scrollMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  readonly callback: IntersectionObserverCallback;
  readonly observedElements = new Set<Element>();

  static instances: MockIntersectionObserver[] = [];

  constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
    this.callback = callback;
    if (options?.root) this.root = options.root;
    if (options?.rootMargin) this.rootMargin = options.rootMargin;
    MockIntersectionObserver.instances.push(this);
  }

  observe = jest.fn((element: Element) => {
    this.observedElements.add(element);
  });

  unobserve = jest.fn((element: Element) => {
    this.observedElements.delete(element);
  });

  disconnect = jest.fn(() => {
    this.observedElements.clear();
  });

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  triggerIntersect(isIntersecting: boolean, target?: Element): void {
    const el = target ?? Array.from(this.observedElements)[0] ?? document.createElement('div');
    const entry: MockEntry = {
      isIntersecting,
      target: el,
    };
    this.callback([entry as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

describe('InfiniteScroll Module', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
    jest.restoreAllMocks();
  });

  function createMockResponse(page: number, limit: number, total = 30): PaginatedResponse<string> {
    const start = (page - 1) * limit;
    const end = Math.min(start + limit, total);
    const data: string[] = [];
    for (let i = start + 1; i <= end; i++) {
      data.push(`item-${i}`);
    }
    return {
      data,
      page,
      limit,
      total,
      hasMore: end < total,
    };
  }

  describe('InfiniteScrollManager', () => {
    it('should initialize and automatically fetch the first page by default', async () => {
      const fetcher = jest.fn().mockReturnValue(of(createMockResponse(1, 5)));

      const manager = new InfiniteScrollManager<string>({
        fetcher,
        pageSize: 5,
      });

      await Promise.resolve();

      expect(fetcher).toHaveBeenCalledWith({ page: 1, limit: 5 });
      expect(manager.items()).toEqual(['item-1', 'item-2', 'item-3', 'item-4', 'item-5']);
      expect(manager.page()).toBe(1);
      expect(manager.hasMore()).toBe(true);
      expect(manager.isLoading()).toBe(false);
      expect(manager.error()).toBeNull();
    });

    it('should NOT fetch the first page when autoFetchFirstPage is false', () => {
      const fetcher = jest.fn();

      const manager = new InfiniteScrollManager<string>({
        fetcher,
        autoFetchFirstPage: false,
      });

      expect(fetcher).not.toHaveBeenCalled();
      expect(manager.items()).toEqual([]);
      expect(manager.page()).toBe(0);
    });

    it('should fetch consecutive pages and accumulate items', async () => {
      const fetcher = jest
        .fn()
        .mockImplementation(({ page, limit }) => of(createMockResponse(page, limit, 30)));

      const manager = new InfiniteScrollManager<string>({
        fetcher,
        pageSize: 3,
        autoFetchFirstPage: false,
      });

      await manager.loadMore();
      expect(manager.page()).toBe(1);
      expect(manager.items()).toEqual(['item-1', 'item-2', 'item-3']);
      expect(manager.hasMore()).toBe(true);

      await manager.loadMore();
      expect(manager.page()).toBe(2);
      expect(manager.items()).toEqual([
        'item-1',
        'item-2',
        'item-3',
        'item-4',
        'item-5',
        'item-6',
      ]);
      expect(manager.hasMore()).toBe(true);
    });

    it('should lock against multiple concurrent requests while isLoading is true', async () => {
      let resolvePromise!: (val: PaginatedResponse<string>) => void;
      const delayedPromise = new Promise<PaginatedResponse<string>>((resolve) => {
        resolvePromise = resolve;
      });

      const fetcher = jest.fn().mockReturnValue(delayedPromise);

      const manager = new InfiniteScrollManager<string>({
        fetcher,
        autoFetchFirstPage: false,
      });

      const firstCallPromise = manager.loadMore();
      expect(manager.isLoading()).toBe(true);
      expect(fetcher).toHaveBeenCalledTimes(1);

      const secondCallPromise = manager.loadMore();
      const thirdCallPromise = manager.loadMore();

      expect(fetcher).toHaveBeenCalledTimes(1);

      resolvePromise(createMockResponse(1, 10));
      await Promise.all([firstCallPromise, secondCallPromise, thirdCallPromise]);

      expect(manager.isLoading()).toBe(false);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should NOT trigger loadMore when hasMore is false', async () => {
      const fetcher = jest.fn().mockReturnValue(of(createMockResponse(1, 10, 5)));

      const manager = new InfiniteScrollManager<string>({
        fetcher,
        pageSize: 10,
        autoFetchFirstPage: false,
      });

      await manager.loadMore();
      expect(manager.hasMore()).toBe(false);
      expect(fetcher).toHaveBeenCalledTimes(1);

      await manager.loadMore();
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully and allow retrying', async () => {
      let shouldFail = true;
      const fetcher = jest.fn().mockImplementation(({ page, limit }) => {
        if (shouldFail) {
          return throwError(() => new Error('Network timeout'));
        }
        return of(createMockResponse(page, limit));
      });

      const manager = new InfiniteScrollManager<string>({
        fetcher,
        pageSize: 5,
        autoFetchFirstPage: false,
      });

      await manager.loadMore();
      expect(manager.error()).toBe('Network timeout');
      expect(manager.isLoading()).toBe(false);
      expect(manager.items()).toEqual([]);

      shouldFail = false;
      await manager.loadMore();

      expect(manager.error()).toBeNull();
      expect(manager.items().length).toBe(5);
      expect(manager.page()).toBe(1);
    });
  });

  describe('IntersectionObserver sentinel interaction', () => {
    it('should attach sentinel element and observe it', () => {
      const manager = new InfiniteScrollManager<string>({
        fetcher: jest.fn().mockReturnValue(of(createMockResponse(1, 10))),
        autoFetchFirstPage: false,
      });

      const sentinelElement = document.createElement('div');
      const detach = manager.attachSentinel(sentinelElement);

      expect(MockIntersectionObserver.instances.length).toBe(1);
      const observerInstance = MockIntersectionObserver.instances[0];
      expect(observerInstance.observe).toHaveBeenCalledWith(sentinelElement);

      detach();
      expect(observerInstance.disconnect).toHaveBeenCalled();
    });

    it('should trigger loadMore when sentinel enters viewport', async () => {
      const fetcher = jest
        .fn()
        .mockImplementation(({ page, limit }) => of(createMockResponse(page, limit)));

      const manager = new InfiniteScrollManager<string>({
        fetcher,
        pageSize: 5,
        autoFetchFirstPage: false,
      });

      const sentinelElement = document.createElement('div');
      manager.attachSentinel(sentinelElement);

      const observerInstance = MockIntersectionObserver.instances[0];

      observerInstance.triggerIntersect(false, sentinelElement);
      expect(fetcher).not.toHaveBeenCalled();

      observerInstance.triggerIntersect(true, sentinelElement);
      await Promise.resolve();

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(manager.items().length).toBe(5);
    });

    it('should ignore intersection events when already loading', () => {
      const fetcher = jest.fn().mockReturnValue(of(createMockResponse(1, 5)).pipe(delay(500)));

      const manager = new InfiniteScrollManager<string>({
        fetcher,
        pageSize: 5,
        autoFetchFirstPage: false,
      });

      const sentinelElement = document.createElement('div');
      manager.attachSentinel(sentinelElement);

      const observerInstance = MockIntersectionObserver.instances[0];

      observerInstance.triggerIntersect(true, sentinelElement);
      expect(manager.isLoading()).toBe(true);
      expect(fetcher).toHaveBeenCalledTimes(1);

      observerInstance.triggerIntersect(true, sentinelElement);
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should safely handle environments without IntersectionObserver', () => {
      (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = undefined;

      const manager = new InfiniteScrollManager<string>({
        fetcher: jest.fn(),
        autoFetchFirstPage: false,
      });

      const sentinelElement = document.createElement('div');
      const detach = manager.attachSentinel(sentinelElement);

      expect(detach).toBeInstanceOf(Function);
      expect(() => detach()).not.toThrow();
    });
  });

  describe('useInfiniteScroll composable', () => {
    it('should create an InfiniteScrollManager instance and clean up on destroy', () => {
      let createdManager!: InfiniteScrollManager<string>;

      TestBed.runInInjectionContext(() => {
        createdManager = useInfiniteScroll<string>({
          fetcher: jest.fn().mockReturnValue(of(createMockResponse(1, 5))),
          autoFetchFirstPage: false,
        });
      });

      expect(createdManager).toBeInstanceOf(InfiniteScrollManager);
      const destroySpy = jest.spyOn(createdManager, 'destroy');

      TestBed.resetTestingModule();
      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
