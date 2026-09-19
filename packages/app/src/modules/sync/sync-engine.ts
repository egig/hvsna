import type { SqliteExecutor } from "@/modules/sqlite/client";
import type {
  RejectedServerRow,
  SyncPullCursors,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  WireRow,
} from "@/infra/sync/types";
import { applyRemoteRow, clearDirty, findDirty, type SyncTable, type WireRowFor } from "./dirty-rows";
import { getCursor, setCursor, setLastSuccessAt } from "./cursor-store";

const BATCH_SIZE = 500;

/** The subset of SyncApiClient the engine needs — kept as a structural
 * interface (rather than importing the class) so tests can pass a fake
 * without SyncApiClient's private constructor field getting in the way. */
export interface SyncApiPort {
  push(body: SyncPushRequest): Promise<SyncPushResponse>;
  pull(cursors: SyncPullCursors, limit: number): Promise<SyncPullResponse>;
}

export interface SyncEngine {
  push(): Promise<void>;
  pull(): Promise<boolean>;
  fullSync(): Promise<boolean>;
}

function isFullServerRow<T extends WireRow>(
  row: RejectedServerRow<T>
): row is T & { rev: number } {
  return "updated_at" in row;
}

async function applyPushResult<T extends SyncTable>(
  executor: SqliteExecutor,
  table: T,
  uploaded: WireRowFor<T>[],
  result: { applied: string[]; rejected: { id: string; server_row: RejectedServerRow<WireRowFor<T>> }[] }
): Promise<void> {
  // Reconcile acknowledgements before adopting any rejected server rows.
  const applied = new Set(result.applied);
  await clearDirty(executor, table, uploaded.filter((row) => applied.has("id" in row ? row.id : row.key)));
  for (const { server_row } of result.rejected) {
    if (isFullServerRow(server_row)) {
      // A newer write (from another device) already won this row on the
      // server — adopt it locally so this device doesn't keep re-pushing a
      // stale copy every cycle.
      await applyRemoteRow(executor, table, server_row as never);
    }
  }
}

export function createSyncEngine(executor: SqliteExecutor, apiClient: SyncApiPort): SyncEngine {
  async function push(): Promise<void> {
    let more = true;
    while (more) {
      // tags is read (and later applied) before
      // recurring_tasks/tasks so a newly-created tag lands server-side
      // before the task_tags/recurring_task_tags membership referencing it.
      const tags = await findDirty(executor, "tags", BATCH_SIZE);
      const recurringTasks = await findDirty(executor, "recurring_tasks", BATCH_SIZE);
      const tasks = await findDirty(executor, "tasks", BATCH_SIZE);
      const settings = await findDirty(executor, "settings", BATCH_SIZE);

      if (
        tags.length === 0 &&
        recurringTasks.length === 0 &&
        tasks.length === 0 &&
        settings.length === 0
      ) {
        return;
      }

      const response = await apiClient.push({
        tags,
        recurring_tasks: recurringTasks,
        tasks,
        settings,
      });

      await applyPushResult(executor, "tags", tags, response.tags);
      await applyPushResult(executor, "recurring_tasks", recurringTasks, response.recurring_tasks);
      await applyPushResult(executor, "tasks", tasks, response.tasks);
      await applyPushResult(executor, "settings", settings, response.settings);

      more =
        tags.length === BATCH_SIZE ||
        recurringTasks.length === BATCH_SIZE ||
        tasks.length === BATCH_SIZE ||
        settings.length === BATCH_SIZE;
    }
  }

  async function pull(): Promise<boolean> {
    let appliedAny = false;
    let more = true;

    while (more) {
      const tagsCursor = await getCursor(executor, "tags");
      const recurringTasksCursor = await getCursor(executor, "recurring_tasks");
      const tasksCursor = await getCursor(executor, "tasks");
      const settingsCursor = await getCursor(executor, "settings");
      const cursors: SyncPullCursors = {
        tags: tagsCursor,
        recurring_tasks: recurringTasksCursor,
        tasks: tasksCursor,
        settings: settingsCursor,
      };

      const response = await apiClient.pull(cursors, BATCH_SIZE);

      // tags, then recurring_tasks before tasks — the local schema's FKs
      // mirror the server's, even though sqlite here doesn't enforce them
      // strictly.
      for (const row of response.tags.rows) {
        await applyRemoteRow(executor, "tags", row);
      }
      for (const row of response.recurring_tasks.rows) {
        await applyRemoteRow(executor, "recurring_tasks", row);
      }
      for (const row of response.tasks.rows) {
        await applyRemoteRow(executor, "tasks", row);
      }
      for (const row of response.settings.rows) {
        await applyRemoteRow(executor, "settings", row);
      }
      appliedAny =
        appliedAny ||
        response.tags.rows.length > 0 ||
        response.recurring_tasks.rows.length > 0 ||
        response.tasks.rows.length > 0 ||
        response.settings.rows.length > 0;

      await setCursor(executor, "tags", response.tags.next_cursor);
      await setCursor(executor, "recurring_tasks", response.recurring_tasks.next_cursor);
      await setCursor(executor, "tasks", response.tasks.next_cursor);
      await setCursor(executor, "settings", response.settings.next_cursor);

      more =
        response.tags.has_more ||
        response.recurring_tasks.has_more ||
        response.tasks.has_more ||
        response.settings.has_more;
    }

    return appliedAny;
  }

  async function fullSync(): Promise<boolean> {
    // Push first so this device's own edits win the round trip before it
    // reconciles with changes made elsewhere.
    await push();
    const applied = await pull();
    await setLastSuccessAt(executor, Date.now());
    return applied;
  }

  return { push, pull, fullSync };
}
