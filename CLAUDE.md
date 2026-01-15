# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**hvsna** is a Hijri calendar and Islamic prayer times application built with React Router 7. The application displays Hijri dates, converts them to Gregorian dates, and shows daily prayer times based on user location (via IP geolocation).

## Development Commands

```bash
# Development server with HMR at http://localhost:5173
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking (generates types then runs TypeScript compiler)
npm run typecheck

# Run tests
npm test

# Run tests with UI
npm test:ui
```

## Architecture

### Tech Stack
- **Framework**: React Router 7 with SSR enabled
- **Styling**: TailwindCSS v4 with Vite plugin
- **Date/Calendar**: dayjs with dayjs-hijri plugin for Hijri calendar support
- **Testing**: Vitest with UI support
- **Build**: Vite with TypeScript

### Directory Structure

```
app/
  routes/          # Route components using file-based routing
  components/      # React UI components
  services/        # Business logic (e.g., prayer-times.ts)
  app.css          # Global styles
  root.tsx         # Root layout with error boundary
  routes.ts        # Uses @react-router/fs-routes for flat routing

lib/
  hijri-date.ts    # Hijri calendar utilities
  gregorian-date.ts # Gregorian date utilities
  location.ts      # IP-based geolocation service
  ip.ts            # IP extraction from requests
  hijri-months.ts  # Hijri month names
  days.ts          # Day name constants
  types/           # TypeScript type definitions
  __tests__/       # Library unit tests
```

### Key Patterns

#### Hijri Calendar System
The app uses `dayjs-hijri` plugin to work with Islamic calendar dates. Month indices in the Hijri calendar are 0-based in dayjs but stored as 1-based in the application:
- When creating dayjs Hijri dates, subtract 1 from month: `hd.year(y).month(m - 1)`
- When returning month values, add 1: `month: hijriDate.month() + 1`
- Helper functions in `lib/hijri-date.ts` handle navigation (next/previous day/month)

#### Date Conversion
- `lib/hijri-date.ts`: Convert Gregorian to Hijri and navigate Hijri dates
- `lib/gregorian-date.ts`: Get current Gregorian date information
- `getGregorianFromHijriDate()`: Convert specific Hijri date to Gregorian

#### Prayer Times
- Uses Aladhan API (https://api.aladhan.com/v1/timings) with custom tuning
- Default method: 20 (configurable)
- Tuning offsets: `'5,3,5,7,9,-1,0,8,-6'`
- Calendar method: UAQ (Umm al-Qura University)
- Location determined by IP geolocation via ipapi.co

#### Location Detection
IP extraction follows this priority:
1. `getClientIP(request)` - checks proxy headers
2. `getDirectIP(request)` - falls back to socket.remoteAddress
3. Default fallback coordinates: (6.2001514, 106.829547) - Jakarta area

The app uses `IpLocationService` class for IP-to-location conversion with dependency injection pattern for testability.

#### Routing
File-based routing via `@react-router/fs-routes`:
- `/` - Today's Hijri date with prayer times
- `/y/:year/m/:month` - Month view for specific Hijri month
- `/y/:year/m/:month/d/:date` - Day view for specific Hijri date
- `/y/:year` - Year view for specific Hijri year

Path alias `~/*` maps to `./app/*` for imports.

### Testing

Tests are located in `__tests__/` directories within `lib/` and `app/services/`. Use Vitest for unit tests:
- Test files follow pattern: `*.test.ts`
- Run single test file: `npm test -- <filename>`
- Use `npm test:ui` for interactive test debugging

### Type Safety Notes

The codebase uses `// @ts-ignore` in several places where dayjs-hijri types are incomplete. This is primarily in:
- `lib/hijri-date.ts` - when calling `.calendar("hijri")` and hijri-specific methods
- Type definition exists at `lib/types/dayjs-hijri.d.ts`

When working with Hijri dates:
```typescript
const d = dayjs();
const hd = d.calendar("hijri"); // @ts-ignore may be needed
// hd now has Hijri-specific methods but TypeScript doesn't recognize them
```

## Important Conventions

- Months are 1-indexed in the application API/URLs but 0-indexed in dayjs
- Prayer time tuning is specific to the application's target region
- Always handle IP extraction failures with fallback coordinates
- SSR is enabled by default in `react-router.config.ts`
