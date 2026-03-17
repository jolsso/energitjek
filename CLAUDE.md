# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Workflow

Run `npm test` before committing. All tests must pass.

After completing each feature or meaningful unit of work, create a git commit:
- Stage relevant files (not `node_modules`, `dist`, `.env`)
- Write a concise conventional commit message (`feat:`, `fix:`, `refactor:`, etc.)
- Verify the build passes before committing if in doubt

## Commands

```bash
# Dev server
npm run dev

# Type-check
npx tsc --noEmit

# Lint
npm run lint

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run integration tests (requires dev server or starts it automatically)
npm run test:e2e

# Open Playwright interactive UI
npm run test:e2e:ui

# Production build
npm run build

# Run with Docker
docker compose up --build
```

## Architecture

Fully client-side React + TypeScript SPA. No backend — all computation runs in the browser. Data never touches our servers.

### Stack
- **React 18** + **TypeScript** (Vite)
- **Tailwind CSS** for styling
- **Zustand** for state management (with localStorage persistence for user inputs)
- **TanStack Query** for async data fetching
- **Recharts** for visualisation
- **React Hook Form** + **Zod** for form validation (when added)

### External APIs (all called directly from the browser)
| API | Purpose | Auth |
|---|---|---|
| PVGIS (EU Commission) | Historical hourly PV production | None |
| Nominatim (OpenStreetMap) | Address → coordinates | None |
| Energidataservice | Spot prices & tariffs | None |
| Eloverblik | Actual consumption data | OAuth2 PKCE |

### Source layout
```
src/
├── components/
│   ├── layout/       # Header, shell
│   ├── forms/        # Input forms (address, solar config, consumption)
│   └── results/      # Charts and summary cards
├── hooks/            # useSimulation, etc.
├── lib/              # API clients + calculation logic
│   ├── geocoding.ts
│   ├── pvgis.ts
│   ├── energidataservice.ts
│   ├── simulation.ts
│   └── utils.ts
├── store/            # Zustand app store
│   └── appStore.ts
└── types/            # Shared TypeScript types
    └── index.ts
```

### Calculation pipeline
1. User enters address → `geocoding.ts` → `(lat, lon)`
2. `pvgis.ts` fetches hourly production profile for the configured solar system
3. `simulation.ts` joins production + consumption + optional pricing → hourly savings
4. Results displayed in `ResultsPanel`

### Privacy
- User inputs (address, config) are persisted in **localStorage only** — never sent to our servers
- Hourly consumption data (sensitive) is explicitly excluded from localStorage persistence
- The address string is discarded after geocoding; only coordinates are retained
- Content-Security-Policy in `nginx.conf` whitelists only the three trusted external APIs

### Deployment
Static files served by nginx via Docker. `Dockerfile` is a two-stage build (node builder → nginx).
