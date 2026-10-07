# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Run unit tests
./gradlew test

# Run a single unit test class
./gradlew test --tests "com.hvsna.app.ExampleUnitTest"

# Run instrumented (device/emulator) tests
./gradlew connectedAndroidTest

# Lint
./gradlew lint

# Install on connected device
./gradlew installDebug
```

## Architecture & Structure

Single-module Android app (`app/`) using **Jetpack Compose** with **Material3**.

- **`MainActivity.kt`** — sole entry point. Sets up `HvsnaTheme` and hosts `HvsnaApp()`.
- **`HvsnaApp()`** — root composable using `NavigationSuiteScaffold` (adaptive nav: bottom bar on phones, nav rail/drawer on larger screens). Navigation state is held with `rememberSaveable` and an `AppDestinations` enum (HOME, FAVORITES, PROFILE).
- **`ui/theme/`** — `HvsnaTheme` wraps Material3 `MaterialTheme`. Supports dynamic color (Android 12+) and auto dark/light. Colors and typography defined in `Color.kt` and `Type.kt`. `LocalDarkTheme` (`Theme.kt`) is the resolved dark/light `CompositionLocal` `HvsnaTheme` actually rendered with — distinct from `isSystemInDarkTheme()` because the app's theme setting (system/light/dark, `SettingsAppearanceScreen`) can override the system value. Read `LocalDarkTheme.current` instead of `isSystemInDarkTheme()` whenever a composable needs to branch on dark mode rather than pull a color straight from `MaterialTheme.colorScheme` (e.g. `TaskListItem`'s swipe-action background colors, which use dedicated muted `Color.kt` constants in dark mode rather than the dynamic `primary`/`tertiary` tones).
- **`i18n/`** — JSON-file localization (English + Indonesian), **not** Android string resources. Flat dotted-key maps in `assets/i18n/{en,id}.json` (keep the two files' key sets identical). `MainActivity` collects `languageFlow(context)` (an `AppLanguage` preference in the same DataStore as `themeMode`), builds a `Strings` table via `Translations.strings()`, and provides it through `LocalStrings` — composables read `LocalStrings.current["some.key"]` / `.format("key", args…)`. English is always the fallback layer for missing keys. `AppLanguage.SYSTEM` resolves to `id` on an Indonesian device, else `en` (see `resolveLanguageCode`). Non-Compose call sites (notification builders) use `Translations.current(context)`. The language switch is `SettingsLanguageScreen`; changing it just swaps the `LocalStrings` value (no activity recreate, no `Locale` override — date/number formatting stays device-locale).
- **`data/`** — **ObjectBox** (`io.objectbox`), not Room. `ObjectBoxStore.getInstance(context)` lazily builds the singleton `BoxStore` (`MyObjectBox.builder()...`) and, on that first build, runs `RoomToObjectBoxImporter.migrateIfNeeded` — a one-time, synchronous import of an existing install's legacy Room SQLite file (`task_db`, schema v5) into ObjectBox via plain read-only `SQLiteDatabase` queries, gated on a `SharedPreferences` flag so it only ever runs once; a fresh install has no `task_db` file, so it's a cheap no-op. `TaskStore`/`SettingsStore` are the ObjectBox-backed replacements for the old `TaskDao`/`SettingsDao`, exposing the same method surface as before (`TaskRepository`/`SettingsRepository` forward to them 1:1); reads return `Flow` via `Query<T>.asFlow()` (`QueryFlow.kt`), a `callbackFlow` adapter over ObjectBox's own subscription/`DataObserver` API. Entities (`Task`, `Tag`, `RecurrenceRule`, `SettingsEntry`) keep their UUID `id` field as the lookup key (backup/restore) (unique-indexed, queried via the generated `Task_`/`Tag_`/`RecurrenceRule_` property classes) — ObjectBox's own auto-assigned `boxId` (`long`) is a separate, internal-only identity, and any write that resolves an existing row by UUID must carry that row's `boxId` forward onto what gets `put()` back, or ObjectBox inserts a duplicate instead of updating in place. ObjectBox schema evolution (new/removed/renamed fields) is automatic — no migration list like Room's `Migration1to2`/etc (those, and `TaskDao`/`TaskDatabase`/`SettingsDao`/`SyncStateDao`, are gone). The `_dirty` columns are vestigial from the removed sync feature — unused, kept to avoid a schema change.
- **Offline-only** — no sync, accounts or subscription on Android (removed; the web app and sync backend now live in the sibling `hvsna-sync` repo). `LegacyAccountCleanup` silently deletes the old session/WorkManager leftovers once per install. `LocationRepository` has no network code: city search and reverse-geocoding use the bundled `CityCatalog`. Only Firebase Crashlytics still needs `INTERNET`.

## Key Details

- **Package**: `com.hvsna.app`
- **Min SDK**: 24 / **Target SDK**: 36 / **Compile SDK**: 36 (API level release with `minorApiLevel = 1`)
- **AGP**: 9.3.0 / **Kotlin**: 2.2.10 / **Compose BOM**: 2025.12.00
- Dependencies are version-catalogued in `gradle/libs.versions.toml`.
- `NavigationSuiteScaffold` from `material3-adaptive-navigation-suite` is used for adaptive layout — it automatically switches between bottom nav, nav rail, and nav drawer based on window size class.
- Release builds have optimization disabled (`enable = false`).