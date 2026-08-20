import type { SyncTable } from "./dirty-rows";

/**
 * Fired by each Sqlite*Repository after a genuine local write (see
 * infra/task/SqliteTaskRepository.ts etc.) so SyncProvider can debounce into
 * a write-triggered sync (see context.ts). The sync engine's own pull-apply
 * path (sync-engine.ts) writes via dirty-rows.ts directly against
 * SqliteExecutor, never through these repositories — so notify() can never
 * fire as a side effect of sync itself, which is what keeps this loop-safe.
 */
export interface WriteNotifier {
  notify(table: SyncTable): void;
  subscribe(listener: (table: SyncTable) => void): () => void;
}

export function createWriteNotifier(): WriteNotifier {
  const listeners = new Set<(table: SyncTable) => void>();
  return {
    notify(table) {
      listeners.forEach((listener) => listener(table));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
