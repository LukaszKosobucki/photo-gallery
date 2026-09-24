# Photo Gallery App

> Technical assessment solution built with modern Angular (Signals, Standalone Components, OnPush change detection).

**Live Demo:** [https://lukaszkosobucki.github.io/photo-gallery/](https://lukaszkosobucki.github.io/photo-gallery/)

---

## Requirements Coverage

- [x] **Infinite scroll at `/`**: Headless infinite scrolling with simulated real-world API latency (200–300 ms delay) and bottom loader spinner.
- [x] **Click-to-favorite**: Clicking any photo card directly adds it to favorites without unnecessary buttons.
- [x] **Favorites screen at `/favorites`**: Static grid of saved photos with persistent storage across page reloads via `LocalStorage`, empty state handling, and direct navigation to photo details.
- [x] **Fullscreen single photo view at `/photos/:id`**: High-resolution 3x enlarged hero photo view with "Remove from favorites" action and route param binding.
- [x] **Unified header layout**: Shared responsive navigation toolbar featuring route synchronization and a reactive badge displaying the live count of favorites.

---

## Architecture & Tech Stack

- **Framework:** Angular 19+ (Standalone Components, Signals, `ChangeDetectionStrategy.OnPush`, `withComponentInputBinding()`).
- **State & Reactivity:** Angular Signals (`signal`, `computed`) for reactive state and RxJS for asynchronous simulated network streams.
- **Scroll Detection:** Native `IntersectionObserver` headless pattern for zero-overhead, high-performance viewport detection.
- **Persistence:** Abstracted `FavoritesService` with `FAVORITES_STORAGE` injection token for local storage synchronization.
- **Testing:**
  - **Unit & Integration:** Jest (`jest-preset-angular`) with comprehensive coverage for services, infinite scroll, and components.
  - **End-to-End:** Playwright test suite covering full user journeys (favoriting, persistence on reload, detail view, and removal).
- **CI/CD:** Automated GitHub Actions pipeline verifying linting, unit tests, E2E tests, production build, and zero-downtime deployment to GitHub Pages.

---

## Local Development

### Prerequisites

- **Node.js:** `>= 20.x` (recommended `v22.x` | current environment: `v22.3.0`)
- **npm:** `>= 10.x` (current environment: `10.9.0`)

### Quickstart

```bash
git clone https://github.com/LukaszKosobucki/photo-gallery.git
cd photo-gallery
npm install
npm start
```

App will be running locally at [http://localhost:4200/](http://localhost:4200/).

### Available Scripts

- `npm start` - Starts local development server at `http://localhost:4200/`
- `npm test` - Executes unit and integration test suite via Jest
- `npm run test:watch` - Runs Jest tests in interactive watch mode
- `npm run test:e2e` - Executes Playwright End-to-End test suite headlessly
- `npm run test:e2e:ui` - Opens Playwright interactive UI mode
- `npm run lint` - Runs ESLint checks across Angular templates and TypeScript code
- `npm run build` - Compiles the optimized production build into `dist/photo-gallery/`

---

## CI/CD Pipeline

The project includes an automated GitHub Actions pipeline (`.github/workflows/ci-cd.yml`):

1. **Trigger:** Runs on every push and pull request targeting the `main` branch.
2. **Quality Gates:** Executes linter (`npm run lint`), Jest unit tests (`npm test`), and Playwright E2E tests (`npm run test:e2e`).
3. **Build:** Compiles production bundle with `--base-href /photo-gallery/` and sets up SPA routing fallback (`404.html`).
4. **Deployment:** Automatically publishes the production artifacts to GitHub Pages upon successful completion of all checks.
