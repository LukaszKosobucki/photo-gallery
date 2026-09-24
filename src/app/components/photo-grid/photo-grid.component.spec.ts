import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhotoGridComponent } from './photo-grid.component';

@Component({
  standalone: true,
  imports: [PhotoGridComponent],
  template: `
    <app-photo-grid>
      <div class="test-item">Item 1</div>
      <div class="test-item">Item 2</div>
    </app-photo-grid>
  `,
})
class TestHostComponent {}

describe('PhotoGridComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, PhotoGridComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('should create grid component', () => {
    const gridEl = fixture.nativeElement.querySelector('app-photo-grid');
    expect(gridEl).toBeTruthy();
  });

  it('should project content into grid container', () => {
    const items = fixture.nativeElement.querySelectorAll('.photo-grid .test-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent.trim()).toBe('Item 1');
    expect(items[1].textContent.trim()).toBe('Item 2');
  });
});
