import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render mat-spinner with default diameter', () => {
    const spinnerDebugEl = fixture.debugElement.query(By.directive(MatProgressSpinner));
    expect(spinnerDebugEl).toBeTruthy();
    expect(component.diameter()).toBe(40);
  });

  it('should accept custom diameter input', () => {
    fixture.componentRef.setInput('diameter', 60);
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.directive(MatProgressSpinner)).componentInstance as MatProgressSpinner;
    expect(spinner.diameter).toBe(60);
  });

  it('should render message when provided', () => {
    fixture.componentRef.setInput('message', 'Loading photos...');
    fixture.detectChanges();

    const messageEl = fixture.nativeElement.querySelector('.spinner-message');
    expect(messageEl).toBeTruthy();
    expect(messageEl.textContent.trim()).toBe('Loading photos...');
  });

  it('should not render message paragraph when message is empty', () => {
    const messageEl = fixture.nativeElement.querySelector('.spinner-message');
    expect(messageEl).toBeNull();
  });
});
