# AGENTS.md

## Working in this repository

- Install JavaScript dependencies with `npm ci` from the repository root; npm workspaces use the root `package-lock.json`.
- Check `git status --short` before editing and preserve unrelated changes already in the working tree.
- Validate website changes with `npm run typecheck:website` and `npm run build:website` (includes prerendering).
- Read `android/CLAUDE.md` for Android build, test, and validation commands.

## Monorepo layout

npm workspaces with one package: [packages/website/](packages/website/) (`@hvsna/website`) — the static marketing/docs site, served by GitHub Pages from the committed `docs/` folder. Root `package.json` only holds workspace config and delegates scripts; run everything from the repo root.

[android/](android/) is a native Android app (Kotlin, Jetpack Compose, ObjectBox) — offline-only (no sync/accounts). Not an npm workspace. Has its own `android/CLAUDE.md` with build/test commands (Gradle) and architecture notes — read that file before working in `android/`.

[icons/](icons/) holds vendored Tabler Icons SVGs (MIT), the source of truth for Android iconography — see `icons/README.md`. `scripts/gen-icons.mjs` (`npm run gen:icons`) generates Android vector drawables into `android/app/src/main/res/drawable/`; the generated files are not meant to be hand-edited.

**The web app and the sync backend moved out of this repo.** `packages/app` (`@hvsna/app`, the Vite/React client with Dexie/IndexedDB) and `packages/api` (`@hvsna/api`, React Router v8 + Neon Postgres, auth/billing/sync) now live in the sibling repo `/Users/egig/workspace/hvsna-sync`. Nothing in this repo references them at build time. The website no longer links to the web app or mentions sync, accounts, subscriptions or pricing — keep it that way unless that decision changes.

## Commands

```sh
npm run dev:website        # Vite dev server at http://localhost:5174 (@hvsna/website)
npm run build:website      # client + SSR build, then prerenders every route to static HTML in the repo-root `docs/` (wiped on every build — never hand-edit it)
npm run typecheck:website  # tsc (noEmit strict mode)
npm run gen:icons          # regenerate Android icon drawables from icons/*.svg
```

No lint and no test suite are configured for the website. Pre-commit hook (husky) runs `npm run test --workspaces --if-present`, which is currently a no-op.

## Website (`packages/website/`)

Separate Vite/React app for marketing pages + docs. Bilingual: English at `/`, `/about`, `/features`, `/download`, `/privacy`, `/terms`, `/changelog`; Indonesian mirrored under `/id/*` (see `src/routes.tsx`; `/changelog` is English-only). Docs live as MDX files in `src/content/docs/`, ordered by `meta.json`'s `pages` list and loaded via `import.meta.glob` in `src/pages/docs/registry.ts`, served under `/help`. Docs describe the Android app only and are kept in sync with `android/`; see repo-root `TODO.md` for features old docs described that aren't built.

Static-generated, not SSR-served: `npm run build:website` builds the client bundle, then an SSR bundle (`src/entry-server.tsx`), then `scripts/prerender.mjs` renders every route (listed in `entry-server.tsx`'s `routes` array — add new routes there as well as in `src/routes.tsx`) to a static `index.html` under `docs/`. The prerender script also writes `404.html` (a copy of the home page) and `.nojekyll` for GitHub Pages. The client (`src/main.tsx`) deliberately does a fresh `createRoot` render rather than `hydrateRoot` — the prerendered HTML is for crawlers/social scrapers, not hydration, avoiding server/client mismatch bugs at the cost of a brief first-paint flash.

Deploys by committing the build: run `npm run build:website` and commit `docs/` (GitHub Pages is set to deploy from `main`'s `/docs` folder; there is no CI workflow). The site is served at `https://egig.github.io/hvsna/`, so Vite's `base` is `/hvsna/` and the router uses a matching basename. Raw `<a href>`/`<img src>` paths must go through `withBase()` from `src/config.ts` (router `<Link>`s and MDX internal links get the basename automatically). If the site moves to a custom domain, change `base` and `SITE_URL`, and add `public/CNAME`. SEO head tags come from `src/seo/meta.ts`.

Path alias `@/*` → `./src/*`.

## Conventions

- **TypeScript strict mode** with `verbatimModuleSyntax: true` — use `import type` for type-only imports
- **Hijri months are 1-indexed** (not 0-based)
- Website copy is bilingual: change the `en` and `id` versions together
- Legal pages (`privacy`, `terms`) describe an offline app with no accounts or payments; the Android app's only network use is Firebase Crashlytics — update them if that changes

## Key files

- `packages/website/src/routes.tsx` — website route table; `packages/website/src/entry-server.tsx` — prerender route list; `packages/website/src/content/docs/` — MDX docs content
- `android/CLAUDE.md` — native Android app (Compose + ObjectBox) build commands and architecture
- `icons/README.md` — how the shared icon set works; `scripts/gen-icons.mjs` — the generator itself
