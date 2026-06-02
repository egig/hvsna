# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**hvsna** is a Hijri calendar and Islamic prayer times application with task management. It supports web (PWA) and native mobile (iOS/Android via Capacitor). Features include Hijri date navigation, prayer times based on geolocation, task management with reminders, data sync, and authentication.

## Development Commands

```bash
# Development server with HMR at http://localhost:5173
npm run dev

# Production build
npm run build

# Type checking
npm run typecheck

# Run tests
npm test

# Run tests with UI
npm test:ui

# Sync and build for native mobile
npm run cap:sync

# Run on iOS/Android
npm run ios
npm run android
```

## Architecture

### Tech Stack

- **Framework**: React 19 + React Router 7 (client-side only, no SSR)
- **Styling**: TailwindCSS v4 with Vite plugin
- **Build**: Vite 7 with TypeScript (strict mode)
- **Database**: PouchDB (web: IndexedDB, native: SQLite via pouchdb-adapter-cordova-sqlite)
- **State**: React Context + TanStack Query v5
- **Mobile**: Capacitor (iOS/Android)
- **Testing**: Vitest with UI support
- **Animation**: Framer Motion
- **Path alias**: `@/*` → `./src/*`

### Directory Structure

```sh
src/
  domain/          # Interfaces/contracts (no dependencies on other layers)
    auth/          # ISessionRepository, ITokenStore, AuthErrors
    location/      # ILocationManager, ITimezoneProvider, coordinate types
    network/       # INetworkProvider
    notifications/ # INotificationsProvider
    permissions/   # IPermissionsProvider
    settings/      # ISettingsRepository
    task/          # ITaskRepository

  infra/           # Concrete implementations of domain interfaces
    auth/          # Web + Capacitor session/token storage
    location/      # Browser/Capacitor location drivers, timezone API
    network/       # Browser + Capacitor network detection
    notifications/ # Browser + Capacitor push notifications
    permissions/   # Browser + Capacitor permission handling
    settings/      # PouchDB settings, SettingsUseCasesFactory
    task/          # PouchDBTaskRepository, TaskRepositoryFactory
    index.ts       # Exports all infra providers

  usecases/        # Business logic orchestration
    auth/          # AuthUseCases
    settings/      # SettingsUseCases, SettingsUseCasesFactory
    task/          # TaskUseCases, TaskUseCasesFactory

  modules/         # Feature modules and shared UI
    api/           # Axios HTTP client
    auth/          # Auth context, hooks, sign-in/sign-up pages
    calendar/      # Hijri calendar module (see below)
    components/    # Shared UI primitives
    editor/        # ProseMirror text editor
    feature-flags/ # Feature flag system
    i18n/          # Internationalization
    icons/         # Icon exports
    location/      # Location context + usecase
    navigation/    # Navbar, tab bar, desktop sidebar, page transitions
    network/       # Network context
    platform/      # Platform detection context
    posthog/       # PostHog analytics
    settings/      # Settings context, pages
    sync/          # Data sync
    task/          # Task management module (46 files, see below)

  platforms/       # Platform-specific entry points
    capacitor/     # Capacitor (iOS/Android) main + service worker registration
    web/           # Web (PWA) main + service worker registration

  app.tsx          # Root component with all providers
  routes.tsx       # React Router route definitions
  main.tsx         # Entry point
  config.ts        # App-wide constants (prayer tuning, default location)
  pouchdb.ts       # PouchDB singleton + provider
  tab-layout.tsx   # Tab navigation layout
```

### Clean Architecture Layers

The codebase follows clean architecture with strict layer separation:

1. **Domain** — interfaces only, no implementation, no external deps
2. **Infrastructure** — implements domain interfaces; platform-specific (Capacitor vs Browser)
3. **Use Cases** — business logic orchestration using domain interfaces
4. **Modules** — UI and features; uses contexts/hooks, not infra directly

Infrastructure is injected via React providers (dependency injection). Factories select the right implementation at runtime based on platform detection.

### Key Patterns

#### Platform Abstraction (Capacitor vs Browser)

Each infra capability has both a Browser and Capacitor implementation. Factories select at runtime:

```typescript
// Example from infra/task/TaskRepositoryFactory.ts
export function createTaskRepository(): ITaskRepository {
  return Capacitor.isNativePlatform()
    ? new PouchDBTaskRepository({ adapter: 'cordova-sqlite' })
    : new PouchDBTaskRepository({ adapter: 'idb' });
}
```

#### Hijri Calendar System

Located in `src/modules/calendar/hijri/`. Uses `@tabby_ai/hijri-converter` (not `dayjs-hijri`).

- `HijriDate` class in `hijri-date.ts`
- `HijriMonth` class in `hijri-month.ts`
- Core logic in `core.ts`
- Month indices are 1-based in the application (unlike 0-based in most libraries)

#### Prayer Times

- API: Aladhan (`https://api.aladhan.com/v1/timings`)
- Default method: 20 (Umm al-Qura University)
- Tuning offsets configured in `src/config.ts`
- Default fallback coordinates: (6.2001514, 106.829547) — Jakarta area
- `src/modules/task/prayer-time-service.ts` handles API calls
- `src/modules/prayer-time-utils.ts` handles math

#### Task Management

Located in `src/modules/task/` (41 files). Key files:

- `types.ts` — Task, Project, TaskStatus types
- `task-context.tsx` / `project-context.tsx` — React providers
- `task-repository.ts` / `project-repository.ts` — client-side queries
- `recurring-task.ts` — recurring task logic
- `reminder-service.ts` — reminder scheduling
- CRUD forms: `task-form.tsx`, `task-form-edit.tsx` (mobile and desktop variants)
- Views: `tasks.tsx`, `today.tsx`, `upcoming.tsx`, `inbox.tsx`, `browse.tsx`

#### PouchDB

- Singleton managed in `src/pouchdb.ts` and `src/modules/pouchdb-singleton.ts`
- Web: uses IndexedDB adapter
- Native: uses Cordova SQLite adapter
- Supports CouchDB sync for cross-device data

#### Settings

- Persisted via `PouchDBSettingsRepository` in `src/infra/settings/`
- Context in `src/modules/settings/settings-context.tsx`
- Includes prayer method and general app preferences
- Location/timezone logic lives in `src/infra/location/` and `src/modules/location/`

### Routing

Client-side React Router 7 routes defined in `src/routes.tsx`:

- `/today`, `/upcoming`, `/inbox`, `/recurring`, `/completed`, `/browse` — Task views
- `/search` — Search
- `/tags/:tagName` — Tag detail
- `/hijri-calendar` — Hijri calendar view
- `/settings/general`, `/settings/notifications`, `/settings/hijri-date` — Settings pages
- `/profile`, `/profile/:action` — Profile
- `/signin`, `/signin/:action`, `/signup`, `/signup/:action` — Auth pages
- `/sync` — Sync setup
- `/about`, `/wipe-local` — Utility pages

### Testing

Tests are co-located in `__tests__/` directories within each module:

- `src/modules/calendar/__tests__/`
- `src/modules/task/__tests__/`
- `src/modules/components/__tests__/`
- `src/modules/settings/__tests__/`
- `src/__tests__/` — root setup

```bash
npm test                        # Run all tests
npm test -- <filename>          # Run single file
npm test:ui                     # Interactive test UI
```

### Environment Variables

See `.env.example` for all variables. Key ones:

- API base URL
- PostHog key (analytics)
- Rollbar token (error tracking)
- Feature flags

## Important Conventions

- Months are 1-indexed in app APIs/URLs
- Prayer time tuning is in `src/config.ts` — change there, not inline
- Always handle location failures with fallback coordinates
- Infra implementations are never imported directly in modules — use context/hooks
- Platform-specific code belongs in `src/infra/`, not in modules
