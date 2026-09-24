import { DestroyRef, inject, signal } from '@angular/core';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { PaginatedResponse, PaginationParams } from '../models';

export interface InfiniteScrollOptions<T> {
  fetcher: (params: PaginationParams) => Observable<PaginatedResponse<T>> | Promise<PaginatedResponse<T>>;
  pageSize?: number;
  initialPage?: number;
  autoFetchFirstPage?: boolean;
}

export class InfiniteScrollManager<T> {
  readonly items = signal<T[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly hasMore = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly page = signal<number>(0);
  readonly _isLoading = this.isLoading;

  private observer?: IntersectionObserver;
  private sentinel?: Element;

  constructor(private readonly options: InfiniteScrollOptions<T>) {
    if (options.autoFetchFirstPage !== false) {
      void this.loadMore();
    }
  }

  async loadMore(): Promise<void> {
    if (this.isLoading() || !this.hasMore()) return;

    this.isLoading.set(true);
    this.error.set(null);

    const targetPage = this.page() + 1;
    try {
      const res$ = this.options.fetcher({
        page: targetPage,
        limit: this.options.pageSize ?? 20,
      });
      const res = isObservable(res$) ? await firstValueFrom(res$) : await res$;

      if (!res.data.length) {
        this.hasMore.set(false);
      } else {
        this.items.update((prev) => [...prev, ...res.data]);
        this.page.set(res.page ?? targetPage);
        this.hasMore.set(res.hasMore);
      }
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to fetch items');
    } finally {
      this.isLoading.set(false);
      this.recheckSentinel();
    }
  }

  private recheckSentinel(): void {
    if (!this.sentinel || !this.hasMore()) return;

    requestAnimationFrame(() => {
      if (this.sentinel && this.hasMore() && !this.isLoading()) {
        this.observer?.unobserve(this.sentinel);
        this.observer?.observe(this.sentinel);
      }
    });
  }

  attachSentinel(element: Element): () => void {
    this.sentinel = element;
    this.observer?.disconnect();

    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting && !this.isLoading() && this.hasMore()) {
            void this.loadMore();
          }
        },
        { rootMargin: '150px' }
      );
      this.observer.observe(element);
    }

    return () => this.destroy();
  }

  destroy(): void {
    this.observer?.disconnect();
    this.sentinel = undefined;
  }
}

export function useInfiniteScroll<T>(options: InfiniteScrollOptions<T>): InfiniteScrollManager<T> {
  const manager = new InfiniteScrollManager<T>(options);
  inject(DestroyRef, { optional: true })?.onDestroy(() => manager.destroy());
  return manager;
}
