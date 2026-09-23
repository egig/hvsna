import type { HvsnaDatabase } from "./database";

/**
 * What Dexie*Repository classes and the sync engine depend on: the database
 * plus a transaction scope that can defer side effects until commit.
 *
 * Every transaction spans all tables, so nested calls join the outer one as
 * Dexie sub-transactions. IndexedDB has no savepoints: a failed nested
 * transaction aborts the whole outer transaction, even if its error is
 * caught. Inside a transaction, await only database operations — awaiting
 * anything else (fetch, timers) lets IndexedDB auto-commit it early.
 */
export interface DbExecutor {
  readonly db: HvsnaDatabase;
  /** Runs `operation` atomically; any thrown error rolls back all writes. */
  transaction<T>(operation: (executor: DbExecutor) => Promise<T>): Promise<T>;
  /** Defers an effect until the outermost transaction commits; discarded on rollback. */
  afterCommit(effect: () => void): void;
}

function createScope(db: HvsnaDatabase, effects: (() => void)[] | null): DbExecutor {
  return {
    db,
    async transaction(operation) {
      const inner: (() => void)[] = [];
      // The async wrapper is load-bearing: returning operation()'s promise
      // directly makes Dexie commit a nested sub-transaction's parent early
      // (PrematureCommitError) — covered by __tests__/transactions.test.ts.
      const result = await db.transaction("rw", db.tables, async () => {
        return await operation(createScope(db, inner));
      });
      if (effects) effects.push(...inner);
      else inner.forEach((effect) => effect());
      return result;
    },
    afterCommit(effect) {
      if (effects) effects.push(effect);
      else effect();
    },
  };
}

export function createDbExecutor(db: HvsnaDatabase): DbExecutor {
  return createScope(db, null);
}
