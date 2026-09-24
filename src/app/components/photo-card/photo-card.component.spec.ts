import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhotoCardComponent } from './photo-card.component';
import { Photo } from '../../core/models';

describe('PhotoCardComponent', () => {
  let component: PhotoCardComponent;
  let fixture: ComponentFixture<PhotoCardComponent>;

  const mockPhoto: Photo = {
    id: '15',
    url: 'https://picsum.photos/id/15/200/300',
    title: 'Photo #15',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhotoCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PhotoCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('photo', mockPhoto);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render image with correct src and alt', () => {
    const imgEl: HTMLImageElement = fixture.nativeElement.querySelector('img');
    expect(imgEl.src).toBe(mockPhoto.url);
    expect(imgEl.alt).toBe(mockPhoto.title);
  });

  it('should reflect favorite state visually', () => {
    expect(fixture.nativeElement.querySelector('.favorite-indicator')).toBeNull();

    fixture.componentRef.setInput('isFavorite', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.favorite-indicator')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.photo-card.favorite')).toBeTruthy();
  });

  it('should emit cardClick with photo when card is clicked', () => {
    const clickSpy = jest.fn();
    component.cardClick.subscribe(clickSpy);

    const cardEl: HTMLElement = fixture.nativeElement.querySelector('.photo-card');
    cardEl.click();

    expect(clickSpy).toHaveBeenCalledWith(mockPhoto);
  });

  it('should emit cardClick when Enter or Space key is pressed', () => {
    const clickSpy = jest.fn();
    component.cardClick.subscribe(clickSpy);

    const cardEl: HTMLElement = fixture.nativeElement.querySelector('.photo-card');
    cardEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(clickSpy).toHaveBeenCalledTimes(1);

    cardEl.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it('should update loading state when image finishes loading', () => {
    expect(component.imageLoading()).toBe(true);

    const imgEl: HTMLImageElement = fixture.nativeElement.querySelector('img');
    imgEl.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(component.imageLoading()).toBe(false);
    expect(fixture.nativeElement.querySelector('.image-placeholder.shimmer')).toBeNull();
  });

  it('should update error state when image fails to load', () => {
    const imgEl: HTMLImageElement = fixture.nativeElement.querySelector('img');
    imgEl.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(component.imageError()).toBe(true);
    expect(fixture.nativeElement.querySelector('.image-placeholder.error')).toBeTruthy();
  });
});
