import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { InfiniteScrollManager } from './infinite-scroll';
import { InfiniteScrollSentinelDirective } from './infinite-scroll-sentinel.directive';

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
}

@Component({
  standalone: true,
  imports: [InfiniteScrollSentinelDirective],
  template: `
    <div class="content">Content</div>
    @if (showSentinel()) {
      <div id="sentinel" [appInfiniteScrollSentinel]="scrollManager()"></div>
    }
  `,
})
class TestHostComponent {
  readonly scrollManager = signal<InfiniteScrollManager<string> | null>(
    new InfiniteScrollManager<string>({
      fetcher: jest.fn().mockReturnValue(of({ data: [], page: 1, limit: 10, total: 0, hasMore: false })),
      autoFetchFirstPage: false,
    })
  );
  readonly showSentinel = signal<boolean>(true);
}

describe('InfiniteScrollSentinelDirective', () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(async () => {
    MockIntersectionObserver.instances = [];
    globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
    jest.restoreAllMocks();
  });

  it('should attach the sentinel element to the manager via directive', () => {
    expect(MockIntersectionObserver.instances.length).toBe(1);
    const observerInstance = MockIntersectionObserver.instances[0];

    const sentinelEl = fixture.nativeElement.querySelector('#sentinel');
    expect(observerInstance.observe).toHaveBeenCalledWith(sentinelEl);
  });

  it('should detach when the host component is destroyed', () => {
    const observerInstance = MockIntersectionObserver.instances[0];

    fixture.destroy();
    expect(observerInstance.disconnect).toHaveBeenCalled();
  });

  it('should detach and clean up when sentinel element is removed from DOM', () => {
    const observerInstance = MockIntersectionObserver.instances[0];

    component.showSentinel.set(false);
    fixture.detectChanges();

    expect(observerInstance.disconnect).toHaveBeenCalled();
  });

  it('should re-attach when manager instance changes', () => {
    const newManager = new InfiniteScrollManager<string>({
      fetcher: jest.fn().mockReturnValue(of({ data: [], page: 1, limit: 10, total: 0, hasMore: false })),
      autoFetchFirstPage: false,
    });

    component.scrollManager.set(newManager);
    fixture.detectChanges();

    expect(MockIntersectionObserver.instances.length).toBe(2);
    const secondObserver = MockIntersectionObserver.instances[1];
    const sentinelEl = fixture.nativeElement.querySelector('#sentinel');
    expect(secondObserver.observe).toHaveBeenCalledWith(sentinelEl);
  });

  it('should handle null manager gracefully without throwing', () => {
    component.scrollManager.set(null);
    expect(() => fixture.detectChanges()).not.toThrow();
  });
});
