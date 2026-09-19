import type { SqliteExecutor } from "./client";

type Connection = Pick<SqliteExecutor, "exec" | "run">;

/** One queue per connection. A transaction owns it until commit/rollback;
 * callers must use the supplied scope, never the outer client, inside it. */
export function createTransactionalExecutor(connection: Connection) {
  let tail: Promise<unknown> = Promise.resolve();
  let savepointId = 0;

  function exclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = tail.then(operation);
    tail = result.catch(() => {});
    return result;
  }

  async function transact<T>(
    operation: (client: SqliteExecutor) => Promise<T>,
    parentEffects?: (() => void)[],
  ): Promise<T> {
    const effects: (() => void)[] = [];
    const savepoint = parentEffects ? `scope_${++savepointId}` : null;
    let active = true;
    let scopeTail: Promise<unknown> = Promise.resolve();
    const assertActive = () => {
      if (!active) throw new Error("Transaction scope has already closed");
    };
    const enqueue = <R>(run: () => Promise<R>): Promise<R> => {
      assertActive();
      const result = scopeTail.then(run);
      scopeTail = result.catch(() => {});
      return result;
    };
    const scope: SqliteExecutor = {
      exec: (sql) => enqueue(() => connection.exec(sql)),
      run: (sql, params) => enqueue(() => connection.run(sql, params)),
      transaction: (next) => enqueue(() => transact(next, effects)),
      afterCommit: (effect) => {
        assertActive();
        effects.push(effect);
      },
    };
    await connection.exec(
      savepoint ? `SAVEPOINT ${savepoint}` : "BEGIN IMMEDIATE",
    );
    let result: T;
    try {
      result = await operation(scope);
      await scopeTail;
      await connection.exec(savepoint ? `RELEASE ${savepoint}` : "COMMIT");
    } catch (error) {
      await scopeTail;
      await connection.exec(
        savepoint
          ? `ROLLBACK TO ${savepoint}; RELEASE ${savepoint}`
          : "ROLLBACK",
      );
      throw error;
    } finally {
      active = false;
    }
    if (parentEffects) parentEffects.push(...effects);
    else effects.forEach((effect) => effect());
    return result;
  }

  return {
    exclusive,
    exec: (sql: string) => exclusive(() => connection.exec(sql)),
    run: (sql: string, params?: Parameters<Connection["run"]>[1]) =>
      exclusive(() => connection.run(sql, params)),
    transaction: <T>(operation: (client: SqliteExecutor) => Promise<T>) =>
      exclusive(() => transact(operation)),
    afterCommit: (effect: () => void) => effect(),
  } satisfies SqliteExecutor & { exclusive: typeof exclusive };
}
