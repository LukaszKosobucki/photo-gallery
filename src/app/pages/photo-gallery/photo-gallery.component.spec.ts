import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { PhotoGalleryComponent } from './photo-gallery.component';
import { PhotoApiService, FavoritesService, FAVORITES_STORAGE } from '../../core/services';
import { Photo, PaginatedResponse } from '../../core/models';
import { PhotoCardComponent } from '../../components/photo-card/photo-card.component';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';

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

describe('PhotoGalleryComponent (Integration)', () => {
  let fixture: ComponentFixture<PhotoGalleryComponent>;
  let component: PhotoGalleryComponent;
  let photoApiSpy: jest.Mocked<PhotoApiService>;
  let favoritesService: FavoritesService;
  let mockStorage: Record<string, string>;

  const originalIntersectionObserver = globalThis.IntersectionObserver;

  function generatePhotos(startId: number, count: number): Photo[] {
    return Array.from({ length: count }, (_, i) => {
      const id = String(startId + i);
      return {
        id,
        url: `https://picsum.photos/id/${id}/200/300`,
        title: `Photo #${id}`,
      };
    });
  }

  const page1Photos = generatePhotos(1, 20);
  const page2Photos = generatePhotos(21, 20);

  const mockPage1Response: PaginatedResponse<Photo> = {
    data: page1Photos,
    page: 1,
    limit: 20,
    total: 60,
    hasMore: true,
  };

  const mockPage2Response: PaginatedResponse<Photo> = {
    data: page2Photos,
    page: 2,
    limit: 20,
    total: 60,
    hasMore: true,
  };

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
    mockStorage = {};

    photoApiSpy = {
      totalPhotos: 30,
      calculateDelay: jest.fn().mockReturnValue(0),
      getPhotos: jest.fn().mockImplementation((params?: Partial<{ page: number; limit: number }>) => {
        if (params?.page === 2) {
          return of(mockPage2Response);
        }
        return of(mockPage1Response);
      }),
      getPhotoById: jest.fn(),
    } as unknown as jest.Mocked<PhotoApiService>;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
    jest.restoreAllMocks();
  });

  async function createComponent(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [PhotoGalleryComponent],
      providers: [
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
    fixture = TestBed.createComponent(PhotoGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
  }

  it('should render the first page of photos on initialization', async () => {
    await createComponent();

    expect(photoApiSpy.getPhotos).toHaveBeenCalledWith({ page: 1, limit: 20 });

    const photoCards = fixture.debugElement.queryAll(By.directive(PhotoCardComponent));
    expect(photoCards.length).toBe(20);

    const firstCardInstance = photoCards[0].componentInstance as PhotoCardComponent;
    expect(firstCardInstance.photo()).toEqual(page1Photos[0]);
    expect(firstCardInstance.isFavorite()).toBe(false);
  });

  it('should load and append the next page when sentinel element enters viewport', async () => {
    await createComponent();

    expect(MockIntersectionObserver.instances.length).toBeGreaterThan(0);
    const observerInstance = MockIntersectionObserver.instances[0];

    const sentinelEl = fixture.nativeElement.querySelector('.sentinel');
    expect(sentinelEl).toBeTruthy();
    expect(observerInstance.observe).toHaveBeenCalledWith(sentinelEl);

    observerInstance.triggerIntersect(true, sentinelEl);
    await Promise.resolve();
    fixture.detectChanges();

    expect(photoApiSpy.getPhotos).toHaveBeenCalledWith({ page: 2, limit: 20 });

    const photoCards = fixture.debugElement.queryAll(By.directive(PhotoCardComponent));
    expect(photoCards.length).toBe(40);
  });

  it('should add a photo to favorites when card is clicked and update UI', async () => {
    await createComponent();

    expect(favoritesService.isFavorite('1')).toBe(false);

    const photoCards = fixture.debugElement.queryAll(By.directive(PhotoCardComponent));
    const firstCard = photoCards[0];
    const cardEl: HTMLElement = firstCard.nativeElement.querySelector('.photo-card');
    cardEl.click();
    fixture.detectChanges();

    expect(favoritesService.isFavorite('1')).toBe(true);
    expect(component.isFavorite('1')).toBe(true);

    const firstCardInstance = firstCard.componentInstance as PhotoCardComponent;
    expect(firstCardInstance.isFavorite()).toBe(true);

    const favoriteIndicator = firstCard.nativeElement.querySelector('.favorite-indicator');
    expect(favoriteIndicator).toBeTruthy();
  });

  it('should display loading spinner when fetching photos', async () => {
    await createComponent();

    expect(fixture.debugElement.query(By.directive(LoadingSpinnerComponent))).toBeNull();

    component.scrollManager.isLoading.set(true);
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.directive(LoadingSpinnerComponent));
    expect(spinner).toBeTruthy();
  });

  it('should render error message and retry button on failure', async () => {
    photoApiSpy.getPhotos.mockReturnValueOnce(throwError(() => new Error('Failed to load gallery')));

    await TestBed.configureTestingModule({
      imports: [PhotoGalleryComponent],
      providers: [
        { provide: PhotoApiService, useValue: photoApiSpy },
        {
          provide: FAVORITES_STORAGE,
          useValue: {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
            clear: () => {},
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoGalleryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const errorMessage = fixture.nativeElement.querySelector('.error-message');
    expect(errorMessage).toBeTruthy();
    expect(errorMessage.textContent).toContain('Failed to load gallery');

    const retryBtn = fixture.nativeElement.querySelector('.error-container button');
    expect(retryBtn).toBeTruthy();

    photoApiSpy.getPhotos.mockReturnValueOnce(of(mockPage1Response));
    retryBtn.click();
    await Promise.resolve();
    fixture.detectChanges();

    const photoCards = fixture.debugElement.queryAll(By.directive(PhotoCardComponent));
    expect(photoCards.length).toBe(20);
  });
});
