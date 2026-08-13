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
- **`ui/theme/`** — `HvsnaTheme` wraps Material3 `MaterialTheme`. Supports dynamic color (Android 12+) and auto dark/light. Colors and typography defined in `Color.kt` and `Type.kt`.

## Key Details

- **Package**: `com.hvsna.app`
- **Min SDK**: 24 / **Target SDK**: 36 / **Compile SDK**: 36 (API level release with `minorApiLevel = 1`)
- **AGP**: 9.3.0 / **Kotlin**: 2.2.10 / **Compose BOM**: 2025.12.00
- Dependencies are version-catalogued in `gradle/libs.versions.toml`.
- `NavigationSuiteScaffold` from `material3-adaptive-navigation-suite` is used for adaptive layout — it automatically switches between bottom nav, nav rail, and nav drawer based on window size class.
- Release builds have optimization disabled (`enable = false`).