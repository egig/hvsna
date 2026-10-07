# icons/

Source-of-truth iconography for `android/`. (The web app's copy of these SVGs lives in the sibling `hvsna-sync` repo.) Each `.svg`
here is vendored from [Tabler Icons](https://github.com/tabler/tabler-icons) (MIT — see
`NOTICE.md`) and generated into each platform's native format by `scripts/gen-icons.mjs`.

## Why this exists

Web and Android used to each depend on their own third-party Tabler wrapper library
(`react-icons/tb` and a Compose port, respectively). The Compose port turned out to be
permanently frozen at an old Tabler snapshot (~1,200 icons) with no newer version ever
published, while web's tracked current Tabler (6,000+ icons) — so the two platforms could
never fully agree on an icon set through their wrapper libraries alone. Vendoring the actual
SVGs here removes that ceiling: both platforms generate from the same file, so "does this
icon exist" is answered once, not per-library.

## Layout

- Outline icons: `icon-name.svg`, matching Tabler's own kebab-case slug
  (e.g. `home.svg`, `chevron-down.svg`).
- Filled icons: `icon-name-filled.svg` — Tabler stores these in a separate `icons/filled/`
  directory under the same base name upstream; the `-filled` suffix here just keeps
  everything in one flat folder.

## Adding, removing, or updating an icon

1. Find the icon at [tabler.io/icons](https://tabler.io/icons) and copy its slug.
2. Download the SVG from the upstream repo, e.g.:
   ```sh
   curl -o icons/some-icon.svg https://raw.githubusercontent.com/tabler/tabler-icons/main/icons/outline/some-icon.svg
   # filled style:
   curl -o icons/some-icon-filled.svg https://raw.githubusercontent.com/tabler/tabler-icons/main/icons/filled/some-icon.svg
   ```
3. From the repo root, run:
   ```sh
   npm run gen:icons
   ```
   This regenerates **every** icon (not just the new one) into
   `android/app/src/main/res/drawable/ic_<snake_slug>.xml` — an Android vector drawable.
4. Commit the new `.svg` alongside the regenerated output — generated files are committed,
   not built on the fly (there's no CI in this repo to enforce staying in sync otherwise).
5. Wire the icon up: reference the drawable directly, e.g.
   `Icon(imageVector = ImageVector.vectorResource(id = R.drawable.ic_some_icon), ...)`.
6. To remove an icon: delete its `.svg`, re-run `npm run gen:icons`, and remove any now-dangling
   references .

## Gotchas

- **Don't hand-edit anything in Android's `ic_*.xml` files** — they're
  overwritten on every `npm run gen:icons` run. Fix the source `.svg` or the generator instead.
- **Tabler's outline SVGs put `stroke`/`fill` on the root `<svg>` element**, which
  `svg2vectordrawable` (the Android converter) only propagates from a `<g>` wrapper — the
  generator handles this by re-wrapping before conversion. If a newly-added icon renders
  invisible on Android, this is the first thing to check in `scripts/gen-icons.mjs`.
- **`currentColor` is replaced with a literal black in Android drawables** — Android has no
  equivalent of CSS `currentColor`. The actual on-screen color comes from `Icon()`'s `tint`
  parameter at each call site, same as any other vector drawable in this app.
