# AGENTS.md

## Monorepo layout

npm workspaces, single package today: [packages/app/](packages/app/) (`@hvsna/app`) — the Vite/React client. Root `package.json` only holds workspace config and delegates scripts (e.g. `npm run dev` → `npm run dev -w @hvsna/app`); run everything from the repo root. `../hvsna-sync2` (the Cloudflare Worker backend) is still a separate sibling repo, not yet part of this monorepo.

## Commands

```sh
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # vite build → packages/app/dist/
npm run typecheck    # tsc (noEmit strict mode)
npm test             # vitest run --reporter=tree (co-located __tests__/ dirs)
npm test -- <file>   # single test file
npm run test:ui      # vitest --ui
npm run test:e2e     # Playwright (packages/app/e2e/tests/, mobile Chrome emulation)
```

No lint configured. Pre-commit hook (husky) runs `npm test`.

## Architecture

The sync backend lives in a sibling repo, `../hvsna-sync2` (a Cloudflare Worker package — its own `package.json`/`node_modules`, run its `npm test`/`npm run typecheck` there separately). Path alias `@/*` → `./src/*` in `packages/app`.

### Entry point
`packages/app/index.html` → `packages/app/src/main.tsx` → `<App platform="web" Router={BrowserRouter} Routes={ResponsiveRoutes} />`. Client-side React only (no SSR).

### Clean architecture — three layers (all under `packages/app/src/`)
1. `domain/` — interfaces only, no deps
2. `infra/` — local-storage implementations of domain interfaces (`Sqlite*Repository` classes; `LocalReminderRegistryRepository` uses `localStorage` directly)
3. `modules/` — UI + business logic; never imports infra directly, uses `useRepositories()` from `RepositoriesProvider`

### Database
**Client**: `wa-sqlite` (`AccessHandlePoolVFS`, OPFS-backed) running in a dedicated Web Worker (`packages/app/src/modules/sqlite/worker.ts`), talked to via `SqliteClient` (`packages/app/src/modules/sqlite/client.ts`) and exposed through `SqliteProvider`/`useSqliteClient()`. No ORM client-side — repositories hand-write parameterized SQL.

**Backend**: one Cloudflare Worker (in `../hvsna-sync2`) fronting a Cloudflare D1 database *per user* (control-plane mapping in a separate, statically-bound D1 database). Per-user databases are reached via D1's HTTP/REST API, not a native binding, since bindings are static and can't target "whichever DB belongs to this user" at runtime — see `../hvsna-sync2/src/lib/d1-http-client.ts`. Schema lives in a Drizzle schema file (`../hvsna-sync2/src/db/schema.ts`); `drizzle-kit` generates the migrations in `../hvsna-sync2/migrations/user/`. Those `.sql` files are copied verbatim into `packages/app/src/modules/sqlite/migrations/user/` (imported via Vite `?raw`) to bootstrap the client's own SQLite database from the exact same DDL — re-copy and update `packages/app/src/modules/sqlite/schema.ts`'s `userMigrations` list whenever the worker schema changes.

Sync (`packages/app/src/modules/sync/`) is **not implemented yet** — `SyncProvider` is a stub (`syncUnavailable: true`) showing "coming soon" UI. The client schema already carries the scaffolding for a future push/pull design (`_dirty` flags on `tasks`/`recurring_tasks`/`settings`, a `_sync_state` key/value table for cursor bookkeeping — see `packages/app/src/modules/sqlite/schema.ts`), but nothing reads or writes it yet.

Auth is the pre-existing hand-rolled system: `AuthService`/`AuthServiceFactory` + `WebSessionRepository`/`InMemoryTokenStore` in `packages/app/src/infra/auth/`, domain interfaces in `packages/app/src/domain/auth/`, wired through `AuthProvider`/`useAuth()` in `packages/app/src/modules/auth/`. Untouched by this migration — only the storage layer (PouchDB → SQLite) changed.

### Routing
Client-side React Router 7. Routes split by screen size (under `packages/app/src/`):
- `screens/desktop/routes-desktop.tsx`
- `screens/mobile/routes.ts`
- `routes.tsx` — responsive wrapper that selects between them

### State
React Context + TanStack Query v5.

## Conventions

- **TypeScript strict mode** with `verbatimModuleSyntax: true` — use `import type` for type-only imports
- **Hijri months are 1-indexed** (not 0-based)
- **Prayer time tuning** in `packages/app/src/config.ts` (`PRAYER_TIMES_CONFIG.tune`), comma-separated format: `Imsak,Fajr,Sunrise,Dhuhr,Asr,Sunset,Maghrib,Isha,Midnight`
- **Location failure must fallback** to Jakarta area (6.2001514, 106.829547)
- **Infra never imported in modules** — always through context/hooks
- **Feature flags** driven by `MODE` env var (`development`|`staging`|`production`), prefixed `VITE_` in env vars
- Tests co-located in `__tests__/` directories within each module

## Testing quirks

- Vitest uses `jsdom` environment + `@testing-library/jest-dom` matchers
- E2E uses Playwright with Pixel 5 emulation, 15s action timeout (Framer Motion), geolocation enabled by default
- E2E runs serially per-browser (`fullyParallel: false` — SQLite/OPFS storage is per-origin, shared across tests in the same browser context)
- E2E resets local state via `window.__hvsnaResetLocalData` (dev-only hook set in `main.tsx`), not direct storage manipulation — see `packages/app/e2e/helpers/db-reset.ts`

## Key files

- `packages/app/src/config.ts` — prayer tuning, timezone→coordinate map
- `packages/app/src/app.tsx` — root provider tree (AuthProvider → SettingsProvider → LocationProvider → TaskProvider)
- `packages/app/src/modules/calendar/hijri/` — HijriDate/HijriMonth classes using `@tabby_ai/hijri-converter`
- `packages/app/src/modules/sync/` — sync UI/context; currently a stub (see Database section) pending a push/pull rebuild against the Cloudflare Worker
- `../hvsna-sync2/` — the Cloudflare Worker backend, in its own repo; run `npm test`/`npm run typecheck` there separately from the main app
