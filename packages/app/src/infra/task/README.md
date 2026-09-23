# Task Repository Implementations

`DexieTaskRepository`, `DexieRecurringTaskRepository`, and
`LocalReminderRegistryRepository` implement the domain interfaces
(`ITaskRepository`, `IRecurringTaskRepository`, `IReminderRegistryRepository`)
against the client's local IndexedDB database, accessed through Dexie (see
`src/modules/db/`). `LocalReminderRegistryRepository` is the exception —
it's per-device notification-scheduling bookkeeping and deliberately never
syncs, so it just uses `localStorage` rather than the database.

None of these are constructed directly by feature code. They're wired once in
`src/modules/repositories-context.tsx` (`createWebRepositories`) and exposed
to the rest of the app through `RepositoriesProvider` / `useRepositories()`.
Feature hooks (`useTaskRepository()`, `useRecurringTaskRepository()`,
`useReminderRegistryRepository()`) just read from that context.

## Sync

Every local write sets the row's `_dirty` flag to 1. `src/modules/sync/`
reads dirty rows for `/sync/push`, clears the flag once the server
acknowledges the exact snapshot sent, and keeps pull cursors in the
`_sync_state` table.

## Adding a query method

Add the method to the relevant domain interface first
(`src/domain/task/ITaskRepository.ts` or `IRecurringTaskRepository.ts`), then
implement it here with Dexie. IndexedDB leaves rows whose indexed value is
null out of an index, so "is null" conditions are filtered in JS; orderings
use the null-aware comparators in `src/infra/row-order.ts`. A new index
means a new `version()` in `src/modules/db/database.ts`.

## Testing

Repository tests run against a real Dexie database backed by
`fake-indexeddb` rather than mocking storage — see
`src/modules/db/__tests__/test-database.ts`.
