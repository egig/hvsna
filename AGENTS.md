# AGENTS.md

## Working in this repository

- Install JavaScript dependencies with `npm ci` from the repository root; npm workspaces use the root `package-lock.json`.
- Check `git status --short` before editing and preserve unrelated changes already in the working tree.
- Each JavaScript workspace has a `.env.example`; use the relevant example when configuring local development. Keep credentials out of source control.
- Validate changes in the affected workspace: app → `npm run typecheck` and `npm test`; API → `npm run typecheck:api` and `npm run test:api`; website → `npm run typecheck:website` and `npm run build:website` (includes prerendering).
- For a specific app test, pass arguments directly to the workspace: `npm run test -w @hvsna/app -- <file>`. To run all workspace unit tests, use `npm run test --workspaces --if-present`.
- Run `npm run test:e2e` when changing browser flows or SQLite/OPFS integration; Playwright starts the dev server automatically. Read `android/CLAUDE.md` for Android validation.

## Monorepo layout

npm workspaces, three packages: [packages/app/](packages/app/) (`@hvsna/app`) — the Vite/React client — [packages/website/](packages/website/) (`@hvsna/website`) — the marketing/docs site — and [packages/api/](packages/api/) (`@hvsna/api`) — the backend (React Router v8 framework mode, deployed to Vercel). Root `package.json` only holds workspace config and delegates scripts (e.g. `npm run dev` → `npm run dev -w @hvsna/app`); run everything from the repo root. `../hvsna-sync2` (the old Cloudflare Worker backend) is a separate sibling repo, fully decoupled — no longer referenced by anything in this monorepo.

[android/](android/) is a native Android app (Kotlin, Jetpack Compose, ObjectBox) — a from-scratch reimplementation of the same task/reminder/prayer-time/Hijri-calendar concept as `packages/app`, not an npm workspace and sharing no code with it (own ObjectBox-based stores — `TaskStore`/`SettingsStore`/`SyncStateStore` over a shared `BoxStore` from `ObjectBoxStore` — instead of `wa-sqlite`; a one-time `RoomToObjectBoxImporter` carries existing installs' data over from their previous local database). Has its own `android/CLAUDE.md` with build/test commands (Gradle) and architecture notes — read that file before working in `android/`.

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

**Backend**: `packages/api` (`@hvsna/api`), a Neon Postgres database accessed via `drizzle-orm/neon-http` (see `packages/api/src/db/`). Schema (`packages/api/src/db/schema.ts`) covers auth (`users`, `refresh_tokens`, `email_verification_tokens`), billing (`subscriptions`, one row per user's single Lemon Squeezy subscription), and sync (`tasks`, `recurring_tasks`, `settings`, `tags`, `task_tags`, `recurring_task_tags`, each scoped by `user_id` with a `rev` cursor column) — migrations generated with `drizzle-kit generate` into `packages/api/drizzle/`. Local (client-side) SQLite migrations under `packages/app/src/modules/sqlite/migrations/user/` are first-party now, owned directly by the app rather than mirrored from an external backend — see the comment on `packages/app/src/modules/sqlite/schema.ts`'s `userMigrations`.

Sync (`packages/app/src/modules/sync/`) **is implemented**: a push/pull `SyncEngine` (`sync-engine.ts`) diffs `_dirty` rows client-side (`dirty-rows.ts`) and reconciles against `POST /sync/push` / `GET /sync/pull` on `packages/api`, with per-table `rev` cursors persisted via `cursor-store.ts`. Timestamps on the sync tables stay client-authored epoch-millis `bigint` (not Postgres `timestamp`) and are compared as raw numbers for last-write-wins conflict resolution — see the comment on `recurringTasks` in `packages/api/src/db/schema.ts`. Both `/sync/push` and `/sync/pull` require a **verified** email (`requireVerifiedAuth`, not plain `requireAuth`) — `useSync()`'s `canSync` is `isAuthenticated && user.emailVerified`, and syncing is otherwise blocked with a "coming soon"-style gate replaced by a verify-email prompt.

Auth is the pre-existing hand-rolled system: `AuthService`/`AuthServiceFactory` + `WebSessionRepository`/`InMemoryTokenStore` in `packages/app/src/infra/auth/`, domain interfaces in `packages/app/src/domain/auth/`, wired through `AuthProvider`/`useAuth()` in `packages/app/src/modules/auth/`. It now talks to `packages/api` over HTTP (`VITE_API_URL`, see `packages/app/src/modules/api/http-client.ts`): `POST /login`, `POST /register`, `GET /me`, `POST /auth/refresh`, `POST /auth/logout`, `POST /auth/verify-email`, `POST /auth/resend-verification` — argon2-hashed passwords, a 15-minute JWT access token, and a DB-backed, rotate-on-use refresh token (30-day TTL). A `401` with body `{ code: "TOKEN_EXPIRED" }` is what triggers the client's silent-refresh-and-retry interceptor — any new failure mode on the API side must use that exact code or the client won't know to refresh. New signups are unverified by default; `AnnouncementBar` (`packages/app/src/modules/components/announcement-bar.tsx`) surfaces the verify-email nag globally above routed content (see `verify-email-banner.tsx`) rather than as a page-local banner.

**Billing**: Lemon Squeezy hosted checkout for the app's single paid plan. `POST /subscription/checkout` (`packages/api/app/routes/subscription.checkout.ts`) creates a checkout via `createCheckout` in `src/lib/lemonsqueezy.ts`, stamping the user id into `checkout_data.custom` so `POST /webhooks/lemonsqueezy` can attribute incoming `subscription_*`/`payment_*` events back to a user and upsert the single `subscriptions` row per user (HMAC-verified via `verifyWebhookSignature`). `GET /subscription` returns the current user's subscription status/portal URLs. Requires `LEMONSQUEEZY_API_KEY`/`STORE_ID`/`VARIANT_ID`/`WEBHOOK_SECRET` + `APP_URL` (see `packages/api/.env.example`).

**Geocoding**: `GET /geocode/reverse` and `GET /geocode/search` (`packages/api/app/routes/geocode.*.ts`) proxy OpenStreetMap Nominatim (`src/lib/nominatim.ts`) so the client isn't calling a third party directly.

### Routing
Client-side React Router 8. Routes split by screen size (under `packages/app/src/`):
- `screens/desktop/routes-desktop.tsx`
- `screens/mobile/routes.tsx`
- `screens/platform.tsx` — `PlatformProvider` / `usePlatform()`. **This holds the app's single `isDesktop` decision** (`const platform = isDesktop ? desktop : mobile`, one read of `useScreenSize()`), exposing `{ isDesktop, Routes, Modal }` and feeding `Modal` into a `ModalProvider`. Seeded high in `app.tsx` (just inside `ScreenSizeProvider`) so providers above the router — e.g. `LocationProvider`, which renders `LocationPickerModal` — are still inside `ModalProvider`. Don't reintroduce runtime `isDesktop` / `useScreenSize` branches anywhere else.
- `routes.tsx` — `ResponsiveRoutes` just renders `usePlatform().Routes` (no branch of its own); passed as the `Routes` prop from `main.tsx` and rendered deep inside the router.

**Every route screen is fully duplicated per platform** — `screens/desktop/<name>.tsx` and `screens/mobile/<name>.tsx` are independent copies (today, inbox, completed, recurring, search, tag-detail-page, sync, subscription, general-settings, notifications, hijri-date-settings, profile, hijri-calendar, wipe-data, about, signin, signup, verify-email; plus mobile-only `settings`/`browse` and the already-divergent `upcoming`). The desktop copy imports `PageDesktop` (`screens/desktop/page.tsx`) + `NavbarDesktop`/`LargeNavbarDesktop` from `screens/desktop/navbar-desktop.tsx`; the mobile copy imports `PageMobile` (`screens/mobile/page.tsx`) + `NavbarMobile`/`LargeNavbarMobile` from `screens/mobile/navbar-mobile.tsx` — each aliased to a bare `Page`/`Navbar`/`LargeNavbar` local name so the rest of the file stays byte-identical between platforms. Both navbar files were moved out of `modules/navigation/`. There is no shared `Page`, `Navbar`, or `LargeNavbar` dispatcher anymore — `modules/navigation/page.tsx` and `modules/navigation/navbar.tsx` are deleted, and the `modules/navigation` barrel no longer re-exports `Navbar*Desktop`/`Navbar*Mobile` (only `NavbarProps` as a type). `modules/components/base-form.tsx` was deleted (it was unused and the last consumer of the `Navbar` dispatcher). `PageDesktop` (`screens/desktop/page.tsx`, `max-w-2xl` unless `fluid`) and `PageMobile` (`screens/mobile/page.tsx`, full-width) both wrap `PageTransition`. **Screen bodies are byte-identical copies** — a body-level fix must be applied to both files. Cross-cutting hooks/sub-components (`use-today`, `use-unscheduled`, `task-list-item`, …) stay single-source in `modules/`.

`Modal` is also split into `screens/desktop/modal.tsx` (centered Base UI dialog) and `screens/mobile/modal.tsx` (vaul bottom drawer), both typed by `ModalProps` from `modules/navigation/modal-context.tsx`. Platform-split screens import their local `./modal`; cross-cutting `modules/` components that render a modal (`repeat-selector`, `simple-time-picker`, `location-picker-modal`, `timezone-picker-modal`, `calendar-modal`, `hijri-date-range-modal`) can't import from `screens/`, so they call `const Modal = useModal()` — the component comes from the `ModalProvider` that `PlatformProvider` (`screens/platform.tsx`) wraps around the whole app. `ModalNavbar` (`modules/navigation/modal-navbar.tsx`) is a single shared component — no platform split, no branch.

### State
React Context + TanStack Query v5.

### Website (`packages/website/`)
Separate Vite/React app for marketing pages + docs, unrelated to the SQLite/domain/infra architecture above — no shared code with `packages/app`. Bilingual: English at `/`, `/about`, `/features`, `/pricing`, `/privacy`, `/terms`; Indonesian mirrored under `/id/*` (see `src/routes.tsx`). Docs live as MDX files in `src/content/docs/`, ordered by `meta.json`'s `pages` list and loaded via `import.meta.glob` in `src/pages/docs/registry.ts`. Docs content is kept in sync with the actual `packages/app` / `android` implementations — see repo-root `TODO.md` for features old docs described that aren't built. Where instructions differ by platform, MDX files use `<PlatformTabs>` with `<Web>` / `<Android>` panels (`src/pages/docs/platform-tabs.tsx`, registered in `mdx-components.tsx`); one shared Android/Web choice per page, persisted to `localStorage`, and both panels are prerendered for crawlers.

Static-generated, not SSR-served: `npm run build:website` builds the client bundle, then an SSR bundle (`src/entry-server.tsx`), then `scripts/prerender.mjs` renders every route (listed in `entry-server.tsx`'s `routes` array) to a static `index.html` under `dist/`. The client (`src/main.tsx`) deliberately does a fresh `createRoot` render rather than `hydrateRoot` — the prerendered HTML is for crawlers/social scrapers, not hydration, avoiding server/client mismatch bugs at the cost of a brief first-paint flash. Deploys to Vercel (`vercel.json`).

### API (`packages/api/`)
React Router v8 in framework mode, used purely as a backend — every route under `app/routes/` is a resource route (`loader`/`action` export only, no component) returning JSON, never rendering HTML. Routes registered in `app/routes.ts`: auth (`login`, `register`, `me`, `auth/refresh`, `auth/logout`, `auth/verify-email`, `auth/resend-verification`), sync (`sync/push`, `sync/pull`), geocoding (`geocode/reverse`, `geocode/search`), and billing (`subscription`, `subscription/checkout`, `webhooks/lemonsqueezy`). `app/root.tsx` exists only because framework mode requires a root route; it's never actually rendered since all leaf routes are resource routes. Node runtime (not Edge) — needed for `@node-rs/argon2`'s native bindings. No `@vercel/react-router` preset yet (as of writing it only supports React Router v7 as a peer dep); Vercel's zero-config framework detection deploys this fine in the meantime — see `react-router.config.ts`.

- `src/db/` — Drizzle schema + `neon-http` client (Neon Postgres, HTTP driver — no TCP pooling to manage across serverless cold starts)
- `src/lib/` — `password.ts` (argon2), `jwt.ts` (jose, HS256 access tokens), `tokens.ts` (refresh token issue/rotate/revoke), `verification-tokens.ts` (email verification tokens), `email.ts` (Resend, falls back to console logging if `RESEND_API_KEY` unset), `lemonsqueezy.ts` (checkout creation + webhook signature verification), `nominatim.ts` (OSM geocode proxy), `sync-push.ts`/`sync-pull.ts`/`sync-validation.ts`/`sync-columns.ts`/`sync-tag-links.ts`/`sync-types.ts` (sync engine server side), `response.ts` (`BaseResponse<T>` envelope + `ApiError`), `cors.ts` (origin allow-list via `ALLOWED_ORIGINS`), `require-auth.ts` (`requireAuth` vs `requireVerifiedAuth` — the latter used by the sync routes)
- No cookies anywhere — Bearer access token + refresh token in the request body, matching what `packages/app`'s client already expects (see Database section above)
- Tests (`__tests__/` next to each module) mock `@/db/client` entirely rather than hitting a real Postgres instance — see `src/__tests__/mock-db.ts` for the chainable query-builder mock

## Conventions

- **TypeScript strict mode** with `verbatimModuleSyntax: true` — use `import type` for type-only imports
- **Hijri months are 1-indexed** (not 0-based)
- **Prayer times** are computed locally with the `adhan` package (`packages/app/src/modules/prayer.ts`), never fetched — calculation method + madhab come from `GeneralSettings` and map to `adhan` via `packages/app/src/modules/prayer-calculation.ts`, kept string-identical to the Android app's `PrayerTimesRepository`. `KEMENAG` (Indonesia) isn't in `adhan` on either platform: it's synthesized as Fajr 20° / Isha 18° + a +2min / −2min-sunrise ihtiyati margin, and both platforms must stay in lockstep
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

- `packages/app/src/config.ts` — timezone→coordinate map; `packages/app/src/modules/prayer-calculation.ts` — prayer calc method/madhab ↔ `adhan` mapping
- `packages/app/src/app.tsx` — root provider tree (ScreenSizeProvider → PlatformProvider → … → AuthProvider → SettingsProvider → LocationProvider → TaskProvider)
- `packages/app/src/modules/calendar/hijri/` — HijriDate/HijriMonth classes using `@tabby_ai/hijri-converter`
- `packages/app/src/modules/sync/` — sync UI/context; live push/pull against `packages/api` (see Database section), gated behind a verified email and a paid Sync plan
- `packages/api/src/db/schema.ts` — Drizzle schema covering auth, billing, and sync (see Database section); `packages/api/app/routes/` — auth, sync, subscription/billing, geocode, and pricing resource routes
- `packages/website/src/routes.tsx` — website route table; `packages/website/src/content/docs/` — MDX docs content
- `android/CLAUDE.md` — native Android app (Compose + ObjectBox) build commands and architecture, standalone from `packages/app`
- `icons/README.md` — how the shared icon set works; `scripts/gen-icons.mjs` — the generator itself
