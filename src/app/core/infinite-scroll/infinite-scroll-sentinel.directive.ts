import {
  Directive,
  ElementRef,
  effect,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { InfiniteScrollManager } from './infinite-scroll';

@Directive({
  selector: '[appInfiniteScrollSentinel]',
  standalone: true,
})
export class InfiniteScrollSentinelDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  readonly manager = input<InfiniteScrollManager<unknown> | null>(null, {
    alias: 'appInfiniteScrollSentinel',
  });
  private cleanupFn?: () => void;

  constructor() {
    effect(() => {
      this.cleanupFn?.();
      const mgr = this.manager();
      if (mgr && this.elementRef.nativeElement) {
        this.cleanupFn = mgr.attachSentinel(this.elementRef.nativeElement);
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanupFn?.();
  }
}
