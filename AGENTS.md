# AGENTS.md

## Monorepo layout

npm workspaces, three packages: [packages/app/](packages/app/) (`@hvsna/app`) — the Vite/React client — [packages/website/](packages/website/) (`@hvsna/website`) — the marketing/docs site — and [packages/api/](packages/api/) (`@hvsna/api`) — the backend (React Router v8 framework mode, deployed to Vercel). Root `package.json` only holds workspace config and delegates scripts (e.g. `npm run dev` → `npm run dev -w @hvsna/app`); run everything from the repo root. `../hvsna-sync2` (the old Cloudflare Worker backend) is a separate sibling repo, fully decoupled — no longer referenced by anything in this monorepo.

[android/](android/) is a native Android app (Kotlin, Jetpack Compose, Room) — a from-scratch reimplementation of the same task/reminder/prayer-time/Hijri-calendar concept as `packages/app`, not an npm workspace and sharing no code with it (own Room-based `TaskDatabase` instead of `wa-sqlite`). Has its own `android/CLAUDE.md` with build/test commands (Gradle) and architecture notes — read that file before working in `android/`.

[icons/](icons/) is the one thing actually shared between `packages/app` and `android/`: vendored Tabler Icons SVGs (MIT), the single source of truth for iconography on both platforms — see `icons/README.md`. `scripts/gen-icons.mjs` (`npm run gen:icons`) generates typed React components into `packages/app/src/modules/icons/generated/` and Android vector drawables into `android/app/src/main/res/drawable/` from those SVGs; neither generated tree is meant to be hand-edited. Web's `packages/app/src/modules/icons/index.ts` barrel curates which generated components are actually exported (as `Hv*`-prefixed names); Android references drawables directly by resource ID (`R.drawable.ic_*`).

## Commands

```sh
npm run dev          # Vite dev server at http://localhost:5173 (@hvsna/app)
npm run build        # vite build → packages/app/dist/
npm run typecheck    # tsc (noEmit strict mode)
npm test             # vitest run --reporter=tree (co-located __tests__/ dirs)
npm test -- <file>   # single test file
npm run test:ui      # vitest --ui
npm run test:e2e     # Playwright (packages/app/e2e/tests/, mobile Chrome emulation)

npm run dev:website        # Vite dev server at http://localhost:5174 (@hvsna/website)
npm run build:website      # client + SSR build, then prerenders every route to static HTML
npm run typecheck:website  # tsc (noEmit strict mode)

npm run dev:api        # React Router dev server at http://localhost:3000 (@hvsna/api)
npm run build:api       # react-router build
npm run typecheck:api   # tsc (noEmit strict mode)
npm run test:api        # vitest run --reporter=tree (DB layer mocked)
```
`packages/api` also has `db:generate` / `db:migrate` (drizzle-kit) — run with `npm run db:generate -w @hvsna/api` etc.

`npm run gen:icons` regenerates the web/Android icon output from `icons/*.svg` — run it after adding, removing, or updating a vendored icon (see `icons/README.md`).

No lint configured. Pre-commit hook (husky) runs `npm run test --workspaces --if-present` — every workspace with a `test` script (`@hvsna/app`, `@hvsna/api`; `@hvsna/website` has no test suite so it's skipped automatically).

## Architecture

Path alias `@/*` → `./src/*` in both `packages/app` and `packages/api`.

### Entry point
`packages/app/index.html` → `packages/app/src/main.tsx` → `<App platform="web" Router={BrowserRouter} Routes={ResponsiveRoutes} />`. Client-side React only (no SSR).

### Clean architecture — three layers (all under `packages/app/src/`)
1. `domain/` — interfaces only, no deps
2. `infra/` — local-storage implementations of domain interfaces (`Sqlite*Repository` classes; `LocalReminderRegistryRepository` uses `localStorage` directly)
3. `modules/` — UI + business logic; never imports infra directly, uses `useRepositories()` from `RepositoriesProvider`

### Database
**Client**: `wa-sqlite` (`AccessHandlePoolVFS`, OPFS-backed) running in a dedicated Web Worker (`packages/app/src/modules/sqlite/worker.ts`), talked to via `SqliteClient` (`packages/app/src/modules/sqlite/client.ts`) and exposed through `SqliteProvider`/`useSqliteClient()`. No ORM client-side — repositories hand-write parameterized SQL.

**Backend**: `packages/api` (`@hvsna/api`), a Neon Postgres database accessed via `drizzle-orm/neon-http` (see `packages/api/src/db/`). Schema is auth-only so far — `users` + `refresh_tokens` (`packages/api/src/db/schema.ts`) — migrations generated with `drizzle-kit generate` into `packages/api/drizzle/`. Local (client-side) SQLite migrations under `packages/app/src/modules/sqlite/migrations/user/` are first-party now, owned directly by the app rather than mirrored from an external backend — see the comment on `packages/app/src/modules/sqlite/schema.ts`'s `userMigrations`.

Sync (`packages/app/src/modules/sync/`) is **not implemented yet** — `SyncProvider` is a stub (`syncUnavailable: true`) showing "coming soon" UI. The client schema already carries the scaffolding for a future push/pull design (`_dirty` flags on `tasks`/`recurring_tasks`/`settings`, a `_sync_state` key/value table for cursor bookkeeping — see `packages/app/src/modules/sqlite/schema.ts`), but nothing reads or writes it yet, and `packages/api` doesn't define those tables yet either.

Auth is the pre-existing hand-rolled system: `AuthService`/`AuthServiceFactory` + `WebSessionRepository`/`InMemoryTokenStore` in `packages/app/src/infra/auth/`, domain interfaces in `packages/app/src/domain/auth/`, wired through `AuthProvider`/`useAuth()` in `packages/app/src/modules/auth/`. It now talks to `packages/api` over HTTP (`VITE_API_URL`, see `packages/app/src/modules/api/http-client.ts`): `POST /login`, `POST /register`, `GET /me`, `POST /auth/refresh`, `POST /auth/logout` — argon2-hashed passwords, a 15-minute JWT access token, and a DB-backed, rotate-on-use refresh token (30-day TTL). A `401` with body `{ code: "TOKEN_EXPIRED" }` is what triggers the client's silent-refresh-and-retry interceptor — any new failure mode on the API side must use that exact code or the client won't know to refresh.

### Routing
Client-side React Router 7. Routes split by screen size (under `packages/app/src/`):
- `screens/desktop/routes-desktop.tsx`
- `screens/mobile/routes.ts`
- `routes.tsx` — responsive wrapper that selects between them

### State
React Context + TanStack Query v5.

### Website (`packages/website/`)
Separate Vite/React app for marketing pages + docs, unrelated to the SQLite/domain/infra architecture above — no shared code with `packages/app`. Bilingual: English at `/`, `/about`, `/features`, `/pricing`, `/privacy`, `/terms`; Indonesian mirrored under `/id/*` (see `src/routes.tsx`). Docs live as MDX files in `src/content/docs/`, ordered by `meta.json`'s `pages` list and loaded via `import.meta.glob` in `src/pages/docs/registry.ts`.

Static-generated, not SSR-served: `npm run build:website` builds the client bundle, then an SSR bundle (`src/entry-server.tsx`), then `scripts/prerender.mjs` renders every route (listed in `entry-server.tsx`'s `routes` array) to a static `index.html` under `dist/`. The client (`src/main.tsx`) deliberately does a fresh `createRoot` render rather than `hydrateRoot` — the prerendered HTML is for crawlers/social scrapers, not hydration, avoiding server/client mismatch bugs at the cost of a brief first-paint flash. Deploys to Vercel (`vercel.json`).

### API (`packages/api/`)
React Router v8 in framework mode, used purely as a backend — every route under `app/routes/` is a resource route (`loader`/`action` export only, no component) returning JSON, never rendering HTML. `app/root.tsx` exists only because framework mode requires a root route; it's never actually rendered since all leaf routes are resource routes. Node runtime (not Edge) — needed for `@node-rs/argon2`'s native bindings. No `@vercel/react-router` preset yet (as of writing it only supports React Router v7 as a peer dep); Vercel's zero-config framework detection deploys this fine in the meantime — see `react-router.config.ts`.

- `src/db/` — Drizzle schema + `neon-http` client (Neon Postgres, HTTP driver — no TCP pooling to manage across serverless cold starts)
- `src/lib/` — `password.ts` (argon2), `jwt.ts` (jose, HS256 access tokens), `tokens.ts` (refresh token issue/rotate/revoke), `response.ts` (`BaseResponse<T>` envelope + `ApiError`), `cors.ts` (origin allow-list via `ALLOWED_ORIGINS`)
- No cookies anywhere — Bearer access token + refresh token in the request body, matching what `packages/app`'s client already expects (see Database section above)
- Tests (`__tests__/` next to each module) mock `@/db/client` entirely rather than hitting a real Postgres instance — see `src/__tests__/mock-db.ts` for the chainable query-builder mock

## Conventions

- **TypeScript strict mode** with `verbatimModuleSyntax: true` — use `import type` for type-only imports
- **Hijri months are 1-indexed** (not 0-based)
- **Prayer time tuning** in `packages/app/src/config.ts` (`PRAYER_TIMES_CONFIG.tune`), comma-separated format: `Imsak,Fajr,Sunrise,Dhuhr,Asr,Sunset,Maghrib,Isha,Midnight`
- **Location failure must fallback** to Jakarta area (6.2001514, 106.829547)
- **Infra never imported in modules** — always through context/hooks
- **Feature flags** driven by `MODE` env var (`development`|`staging`|`production`), prefixed `VITE_` in env vars
- Tests co-located in `__tests__/` directories within each module

## Testing quirks

- `@hvsna/app`'s Vitest uses `jsdom` environment + `@testing-library/jest-dom` matchers; `@hvsna/api`'s uses plain `node` environment (no DOM needed) and mocks `@/db/client` instead of hitting real Postgres
- E2E uses Playwright with Pixel 5 emulation, 15s action timeout (Framer Motion), geolocation enabled by default
- E2E runs serially per-browser (`fullyParallel: false` — SQLite/OPFS storage is per-origin, shared across tests in the same browser context)
- E2E resets local state via `window.__hvsnaResetLocalData` (dev-only hook set in `main.tsx`), not direct storage manipulation — see `packages/app/e2e/helpers/db-reset.ts`

## Key files

- `packages/app/src/config.ts` — prayer tuning, timezone→coordinate map
- `packages/app/src/app.tsx` — root provider tree (AuthProvider → SettingsProvider → LocationProvider → TaskProvider)
- `packages/app/src/modules/calendar/hijri/` — HijriDate/HijriMonth classes using `@tabby_ai/hijri-converter`
- `packages/app/src/modules/sync/` — sync UI/context; currently a stub (see Database section) pending a push/pull rebuild against `packages/api`
- `packages/api/src/db/schema.ts` — auth-only Drizzle schema (`users`, `refresh_tokens`); `packages/api/app/routes/` — the five auth resource routes
- `packages/website/src/routes.tsx` — website route table; `packages/website/src/content/docs/` — MDX docs content
- `android/CLAUDE.md` — native Android app (Compose + Room) build commands and architecture, standalone from `packages/app`
- `icons/README.md` — how the shared icon set works; `scripts/gen-icons.mjs` — the generator itself
