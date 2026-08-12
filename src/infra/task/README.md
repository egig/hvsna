# Task Repository Implementations

`SqliteTaskRepository`, `SqliteRecurringTaskRepository`, and
`LocalReminderRegistryRepository` implement the domain interfaces
(`ITaskRepository`, `IRecurringTaskRepository`, `IReminderRegistryRepository`)
against the client's local `wa-sqlite`/OPFS database (see
`src/modules/sqlite/`). `LocalReminderRegistryRepository` is the exception —
it's per-device notification-scheduling bookkeeping and deliberately never
syncs, so it just uses `localStorage` rather than going through the SQLite
Worker.

None of these are constructed directly by feature code. They're wired once in
`src/modules/repositories-context.tsx` (`createWebRepositories`) and exposed
to the rest of the app through `RepositoriesProvider` / `useRepositories()`.
Feature hooks (`useTaskRepository()`, `useRecurringTaskRepository()`,
`useReminderRegistryRepository()`) just read from that context.

## Sync

Local writes mark a `_dirty` flag (see each repository's upsert SQL), and
`src/modules/sqlite/schema.ts` has a `_sync_state` table for cursor
bookkeeping — but nothing in `src/modules/sync/` reads or writes either yet.
`SyncProvider` is currently a stub. A future push/pull engine against the
Cloudflare Worker will read dirty rows and clear the flag on ack.

## Adding a query method

Add the method to the relevant domain interface first
(`src/domain/task/ITaskRepository.ts` or `IRecurringTaskRepository.ts`), then
implement it here as hand-written parameterized SQL — there's no ORM on the
client (see `src/modules/sqlite/client.ts`'s `run`/`exec`).

## Testing

Repository tests run against a real `wa-sqlite` instance rather than mocking
SQL — see `src/infra/task/__tests__/` for how the test environment
bootstraps the same schema used in production.
