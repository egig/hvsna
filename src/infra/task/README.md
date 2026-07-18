# Task Repository Implementations

Two backends implement the same domain interfaces (`ITaskRepository`,
`IRecurringTaskRepository`, `IReminderRegistryRepository`), selected per
platform:

- **Web** — `PouchDBTaskRepository`, `PouchDBRecurringTaskRepository`,
  `PouchDBReminderRegistryRepository` (PouchDB, IndexedDB adapter, synced
  live against a CouchDB-protocol backend — see `src/modules/sync/`).
- **Native (iOS/Android)** — `SQLiteTaskRepository`,
  `SQLiteRecurringTaskRepository`, `SQLiteReminderRegistryRepository`
  (Drizzle ORM over `@capacitor-community/sqlite`, via the schema in
  `src/infra/sqlite/schema.ts`). Native is **offline-only** for now — see
  `src/modules/sync/sync-stub-context.tsx`.

Neither implementation is constructed directly by feature code. Both are
wired once, per platform, in `src/modules/repositories-context.tsx`
(`createWebRepositories` / `createNativeRepositories`) and exposed to the
rest of the app through `RepositoriesProvider` / `useRepositories()`. Feature
hooks (`useTaskRepository()`, `useRecurringTaskRepository()`,
`useReminderRegistryRepository()`) just read from that context — they don't
know or care which backend is active.

## Native primary keys

SQLite tables use autoincrement integer primary keys. Because PouchDB's ids
are strings, `Task.id` / `RecurringTask.id` are typed `string | number`
across the domain layer rather than hidden behind a stringify boundary.

## Adding a query method

Add the method to the relevant domain interface first
(`src/domain/task/ITaskRepository.ts` or `IRecurringTaskRepository.ts`),
then implement it in both the PouchDB (Mango query) and SQLite (Drizzle
query builder) repositories.

## Testing

SQLite repository tests run the same Drizzle schema against an in-memory
`better-sqlite3` driver (see `src/infra/task/__tests__/`), since
`@capacitor-community/sqlite` only runs on-device or via the `jeep-sqlite`
browser shim, not under Vitest.
