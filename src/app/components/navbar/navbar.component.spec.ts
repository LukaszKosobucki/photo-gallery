import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NavbarComponent } from './navbar.component';

@Component({ template: '' })
class DummyComponent {}

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'favorites', component: DummyComponent },
          { path: 'photos/:id', component: DummyComponent },
          { path: 'photos', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display Photos and Favorites options', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Photos');
    expect(compiled.textContent).toContain('Favorites');
  });

  it('should set active tab to photos when on root path /', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();
    expect(component.currentTab()).toBe('photos');
  });

  it('should set active tab to favorites when on /favorites', async () => {
    await router.navigateByUrl('/favorites');
    fixture.detectChanges();
    expect(component.currentTab()).toBe('favorites');
  });

  it('should set active tab to favorites when on /photos/:id', async () => {
    await router.navigateByUrl('/photos/123');
    fixture.detectChanges();
    expect(component.currentTab()).toBe('favorites');
  });

  it('should set active tab to favorites when on /photos', async () => {
    await router.navigateByUrl('/photos');
    fixture.detectChanges();
    expect(component.currentTab()).toBe('favorites');
  });

  it('should navigate to / when clicking photos', async () => {
    await router.navigateByUrl('/favorites');
    fixture.detectChanges();

    const navigateSpy = jest.spyOn(router, 'navigateByUrl');
    const compiled = fixture.nativeElement as HTMLElement;
    const photosButton = compiled.querySelector<HTMLElement>(
      'mat-button-toggle[value="photos"] button'
    );
    photosButton?.click();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith('/');
  });

  it('should navigate to /favorites when clicking favorites', async () => {
    await router.navigateByUrl('/');
    fixture.detectChanges();

    const navigateSpy = jest.spyOn(router, 'navigateByUrl');
    const compiled = fixture.nativeElement as HTMLElement;
    const favoritesButton = compiled.querySelector<HTMLElement>(
      'mat-button-toggle[value="favorites"] button'
    );
    favoritesButton?.click();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith('/favorites');
  });

  it('should navigate to /favorites when clicking favorites while on /photos/123', async () => {
    await router.navigateByUrl('/photos/123');
    fixture.detectChanges();

    const navigateSpy = jest.spyOn(router, 'navigateByUrl');
    const compiled = fixture.nativeElement as HTMLElement;
    const favoritesButton = compiled.querySelector<HTMLElement>(
      'mat-button-toggle[value="favorites"] button'
    );
    favoritesButton?.click();
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith('/favorites');
  });

  it('should initialize immediately with favorites when loaded on /favorites to avoid flashing photos', async () => {
    await router.navigateByUrl('/favorites');
    const reloadFixture = TestBed.createComponent(NavbarComponent);
    expect(reloadFixture.componentInstance.currentTab()).toBe('favorites');
    reloadFixture.detectChanges();
    expect(reloadFixture.componentInstance.currentTab()).toBe('favorites');
  });

  it('should update active tab in ngOnInit', async () => {
    await router.navigateByUrl('/favorites');
    const newFixture = TestBed.createComponent(NavbarComponent);
    const newComponent = newFixture.componentInstance;
    newFixture.detectChanges();
    expect(newComponent.currentTab()).toBe('favorites');
  });
});
