# AGENTS.md

## Working in this repository

- JavaScript tooling is only needed for `npm run gen:icons`; install with `npm ci` from the repository root.
- Check `git status --short` before editing and preserve unrelated changes already in the working tree.
- Website changes: edit the HTML under `docs/` directly and preview with `python3 -m http.server` (see Website below).
- Read `android/CLAUDE.md` for Android build, test, and validation commands.

## Monorepo layout

The marketing/docs site is plain static HTML in [docs/](docs/), served by GitHub Pages from `main`'s `/docs` folder. There is no build step and no npm workspace.

[android/](android/) is a native Android app (Kotlin, Jetpack Compose, ObjectBox) — offline-only (no sync/accounts). Not an npm workspace. Has its own `android/CLAUDE.md` with build/test commands (Gradle) and architecture notes — read that file before working in `android/`.

[icons/](icons/) holds vendored Tabler Icons SVGs (MIT), the source of truth for Android iconography — see `icons/README.md`. `scripts/gen-icons.mjs` (`npm run gen:icons`) generates Android vector drawables into `android/app/src/main/res/drawable/`; the generated files are not meant to be hand-edited.

**The web app and the sync backend moved out of this repo.** `packages/app` (`@hvsna/app`, the Vite/React client with Dexie/IndexedDB) and `packages/api` (`@hvsna/api`, React Router v8 + Neon Postgres, auth/billing/sync) now live in the sibling repo `/Users/egig/workspace/hvsna-sync`. Nothing in this repo references them at build time. The website no longer links to the web app or mentions sync, accounts, subscriptions or pricing — keep it that way unless that decision changes.

## Commands

```sh
npm run gen:icons          # regenerate Android icon drawables from icons/*.svg
```

No lint, build or test suite is configured; there is no pre-commit hook.

## Website (`docs/`)

Hand-edited static HTML, committed and served as-is at `https://egig.github.io/hvsna/` (so every internal `href`/`src` starts with `/hvsna/`). It was previously generated from a Vite/React app (`packages/website`, removed — recover it from git history if ever needed).

- English pages: `/`, `/about`, `/features`, `/download`, `/privacy`, `/terms`, `/changelog`, help under `/help/*`. Indonesian mirrors live under `docs/id/*` (`/changelog` and `/help` are English-only). Edit the `en` and `id` versions together.
- Shared header/footer/SEO tags are duplicated in every page — a layout change means editing all of them (`grep -rl` + sed works).
- Styling is one precompiled Tailwind file, `docs/assets/site.css`. It only contains classes that were in use when it was built, so new utility classes will not work; reuse existing classes or add plain CSS to the end of the file.
- `docs/assets/site.js` is the only script (mobile menu, help sidebar dropdown, back-to-top). Pages work without it.
- Help pages (`docs/help/*`) describe the Android app only and are kept in sync with `android/`; see repo-root `TODO.md` for features old docs described that aren't built.
- `404.html` is a copy of the home page; `.nojekyll` must stay. On a custom domain, change the `/hvsna/` prefix everywhere, the canonical/og URLs, and add `docs/CNAME`.
- `og-image.jpg` / `twitter-image.jpg` are referenced in `<meta>` tags but are not in `docs/` yet.

## Conventions

- **TypeScript strict mode** with `verbatimModuleSyntax: true` — use `import type` for type-only imports
- **Hijri months are 1-indexed** (not 0-based)
- Website copy is bilingual: change the `en` and `id` pages together
- Legal pages (`privacy`, `terms`) describe an offline app with no accounts or payments; the Android app's only network use is Firebase Crashlytics — update them if that changes

## Key files

- `docs/` — the entire website (static HTML, `assets/site.css`, `assets/site.js`)
- `android/CLAUDE.md` — native Android app (Compose + ObjectBox) build commands and architecture
- `icons/README.md` — how the shared icon set works; `scripts/gen-icons.mjs` — the generator itself
