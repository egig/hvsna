# TODO

## Features referenced by old help docs but not yet built

The help docs (`docs/help/`) and marketing pages used to
describe these. They've been removed from user-facing docs (2026-09-09) and
parked here until implemented.

### Sync
- **In-app billing (Android)** — the Sync plan is enforced on both clients
  (`requireSyncAuth` + `/me`'s `syncEnabled`), but Android has no checkout of its
  own; its sync screen links out to the web app's subscription page.
- **Data export (web)** — Android has Backup & Restore (export/import file); the
  web app has no equivalent.

### Account / auth (`packages/api` + `packages/app/src/modules/auth`)
- **Password reset / "forgot password"** — no route, no UI. Currently users must
  email support. Needs `POST /auth/forgot-password` + `POST /auth/reset-password`
  and a sign-in-screen entry point.
- **Change password** (while signed in) — no UI or route.
- **Change email** — no UI or route; verification flow would need to re-verify.
- **Account deletion** — only local device wipe exists
  (`modules/settings/wipe-data.tsx`). No server-side delete of the synced
  copy / subscription records. Needs `DELETE /me` (or similar) + confirm UI.
- **Profile editing** — `modules/settings/pages/profile.tsx` is read-only
  (name, email, user id, member-since). No display-name / avatar / timezone edit.
- **2FA, active-session management, "sign out all devices"** — none of this
  exists. Refresh tokens are DB-backed server-side but never surfaced.
- **Privacy toggles** (analytics / crash reports / marketing) + "connected apps"
  — no privacy settings screen.

### Notifications
- **Prayer-time notifications** — neither web nor Android schedules any. Web only
  does a single pre-due task reminder (setTimeout, tab must stay open). Android
  schedules exact alarms for clock-timed tasks only (not all-day / prayer-anchored).
- **Overdue notifications** — `"overdue"`/`"due"` types exist in
  `BrowserNotificationsDriver` but `ReminderService` never schedules them.

### Recurring tasks
- **Hijri-based monthly/yearly recurrence** — old docs claimed this; generator
  (`recurring-task-generator.ts`) uses Gregorian `dayjs().add(n, "month"|"year")`.
- **Day-of-week custom patterns** ("every 2 weeks on Mon & Thu") — not supported;
  only type + integer interval + end condition.

### Tasks
- **Swipe actions** (swipe-to-complete / swipe-to-schedule) — `react-swipeable`
  is a dependency but unused. Only a left-edge swipe-back nav gesture exists.

### Platform
- **iOS app** — "coming soon" in old docs; not started.
