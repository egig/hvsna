import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { recurringTaskTags, taskTags } from "@/db/schema";

const FOREIGN_KEY_VIOLATION = "23503";

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === FOREIGN_KEY_VIOLATION
  );
}

/**
 * task_tags / recurring_task_tags carry no `updated_at`/`rev`/`_dirty` of
 * their own (see the comment on `tags` in db/schema.ts) — membership is a
 * full-replace snapshot that rides along with the owning row's own push,
 * applied only for rows whose LWW check just accepted the incoming version
 * (never for a `rejected` row, which would overwrite newer server state
 * with a stale local membership list).
 */
export async function fetchTaskTagIds(
  userId: string,
  taskIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (taskIds.length === 0) return map;
  const rows = await db
    .select({ taskId: taskTags.taskId, tagId: taskTags.tagId })
    .from(taskTags)
    .where(and(eq(taskTags.userId, userId), inArray(taskTags.taskId, taskIds)));
  for (const row of rows) {
    const list = map.get(row.taskId) ?? [];
    list.push(row.tagId);
    map.set(row.taskId, list);
  }
  return map;
}

export async function fetchRecurringTaskTagIds(
  userId: string,
  recurringTaskIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (recurringTaskIds.length === 0) return map;
  const rows = await db
    .select({
      recurringTaskId: recurringTaskTags.recurringTaskId,
      tagId: recurringTaskTags.tagId,
    })
    .from(recurringTaskTags)
    .where(
      and(
        eq(recurringTaskTags.userId, userId),
        inArray(recurringTaskTags.recurringTaskId, recurringTaskIds)
      )
    );
  for (const row of rows) {
    const list = map.get(row.recurringTaskId) ?? [];
    list.push(row.tagId);
    map.set(row.recurringTaskId, list);
  }
  return map;
}

export async function replaceTaskTagLinks(
  userId: string,
  rows: { id: string; tag_ids: string[] }[]
): Promise<void> {
  if (rows.length === 0) return;
  const taskIds = rows.map((r) => r.id);
  await db
    .delete(taskTags)
    .where(and(eq(taskTags.userId, userId), inArray(taskTags.taskId, taskIds)));

  const pairs = rows.flatMap((r) => r.tag_ids.map((tagId) => ({ userId, taskId: r.id, tagId })));
  if (pairs.length === 0) return;

  try {
    await db.insert(taskTags).values(pairs).onConflictDoNothing();
  } catch (error) {
    if (!isForeignKeyViolation(error)) throw error;
    // A tag_id referenced by one row doesn't exist server-side yet (stale
    // client, or a tag deleted out from under it) — insert what's valid
    // per-pair instead of losing every row's associations in the batch.
    for (const pair of pairs) {
      try {
        await db.insert(taskTags).values(pair).onConflictDoNothing();
      } catch (pairError) {
        if (!isForeignKeyViolation(pairError)) throw pairError;
      }
    }
  }
}

export async function replaceRecurringTaskTagLinks(
  userId: string,
  rows: { id: string; tag_ids: string[] }[]
): Promise<void> {
  if (rows.length === 0) return;
  const recurringTaskIds = rows.map((r) => r.id);
  await db
    .delete(recurringTaskTags)
    .where(
      and(
        eq(recurringTaskTags.userId, userId),
        inArray(recurringTaskTags.recurringTaskId, recurringTaskIds)
      )
    );

  const pairs = rows.flatMap((r) =>
    r.tag_ids.map((tagId) => ({ userId, recurringTaskId: r.id, tagId }))
  );
  if (pairs.length === 0) return;

  try {
    await db.insert(recurringTaskTags).values(pairs).onConflictDoNothing();
  } catch (error) {
    if (!isForeignKeyViolation(error)) throw error;
    for (const pair of pairs) {
      try {
        await db.insert(recurringTaskTags).values(pair).onConflictDoNothing();
      } catch (pairError) {
        if (!isForeignKeyViolation(pairError)) throw pairError;
      }
    }
  }
}
