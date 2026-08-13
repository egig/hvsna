import type {
  SqliteRequest,
  SqliteRequestPayload,
  SqliteValue,
  SqliteWorkerMessage,
} from "./protocol";

export type { SqliteValue };

/** Cross-tab database lock state — see worker.ts's `waitForDbLock`. */
export type SqliteLockState = "locked" | "ready";

/**
 * The surface Sqlite*Repository classes actually depend on. Repositories are
 * typed against this interface rather than the concrete SqliteClient class
 * so tests can pass an in-memory double (see
 * __tests__/test-sqlite-client.ts) — SqliteClient's private fields would
 * otherwise make a structural test double unassignable to it.
 */
export interface SqliteExecutor {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqliteValue[]): Promise<Record<string, SqliteValue>[]>;
}

/**
 * Main-thread RPC wrapper around the dedicated SQLite Worker (worker.ts).
 * Messages sent before the worker finishes its internal bootstrap (opening
 * the OPFS-backed database, applying migrations) are not lost — the worker
 * queues them behind its own `await ready` — so callers don't need to wait
 * for readiness themselves.
 */
export class SqliteClient implements SqliteExecutor {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<
    number,
    {
      resolve: (rows: Record<string, SqliteValue>[]) => void;
      reject: (error: Error) => void;
    }
  >();
  private lockListeners = new Set<(state: SqliteLockState) => void>();

  constructor() {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), {
      type: "module",
    });
    this.worker.onmessage = (event: MessageEvent<SqliteWorkerMessage>) => {
      const message = event.data;
      if ("kind" in message) {
        this.lockListeners.forEach((listener) => listener(message.state));
        return;
      }
      const response = message;
      const pending = this.pending.get(response.id);
      if (!pending) return;
      this.pending.delete(response.id);
      if (response.ok) {
        pending.resolve(response.rows);
      } else {
        pending.reject(new Error(response.error));
      }
    };
  }

  /**
   * Subscribes to cross-tab DB lock status changes (fired when this tab is
   * blocked behind another tab's open database, and again once it's no
   * longer blocked). Returns an unsubscribe function.
   */
  onLockStateChange(listener: (state: SqliteLockState) => void): () => void {
    this.lockListeners.add(listener);
    return () => this.lockListeners.delete(listener);
  }

  private send(
    request: SqliteRequestPayload
  ): Promise<Record<string, SqliteValue>[]> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ ...request, id } as SqliteRequest);
    });
  }

  /** Runs a multi-statement script with no parameters (schema DDL only). */
  async exec(sql: string): Promise<void> {
    await this.send({ type: "exec", sql });
  }

  /** Runs a single parameterized statement, returning its result rows. */
  async run(
    sql: string,
    params: SqliteValue[] = []
  ): Promise<Record<string, SqliteValue>[]> {
    return this.send({ type: "run", sql, params });
  }

  /** Deletes all local data. Reload the page afterward to re-bootstrap. */
  async wipe(): Promise<void> {
    await this.send({ type: "wipe" });
  }

  terminate(): void {
    this.worker.terminate();
  }
}
