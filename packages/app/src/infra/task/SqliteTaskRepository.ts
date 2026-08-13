import { Task } from "@/domain/task";
import type {
  TaskCreateInput,
  TaskQuery,
  TaskUpdateInput,
} from "@/domain/task";
import type { ITaskRepository } from "@/domain/task/ITaskRepository";
import type { ITagRepository } from "@/domain/tag/ITagRepository";
import { generatePrefixedUUID } from "@/modules/uuid";
import type { SqliteExecutor, SqliteValue } from "@/modules/sqlite/client";

type TaskRow = Record<string, SqliteValue>;

function toStr(id: string | number): string {
  return String(id);
}

function rowToTask(row: TaskRow): Task {
  return new Task({
    id: String(row.id),
    name: String(row.name ?? ""),
    description: row.description !== null ? String(row.description) : "",
    status: (row.status as 0 | 1) ?? 0,
    atEpochMillis: row.at_epoch_millis !== null ? Number(row.at_epoch_millis) : null,
    atTime: row.at_time !== null ? String(row.at_time) : "",
    lat: row.lat !== null ? Number(row.lat) : undefined,
    long: row.lng !== null ? Number(row.lng) : undefined,
    timezone: row.timezone !== null ? String(row.timezone) : undefined,
    recurringType: (row.recurring_type as Task["recurringType"]) ?? undefined,
    recurringInterval:
      row.recurring_interval !== null ? Number(row.recurring_interval) : undefined,
    recurringTaskId: row.recurring_task_id !== null ? String(row.recurring_task_id) : null,
    hijriDateOffset:
      row.hijri_date_offset !== null ? Number(row.hijri_date_offset) : undefined,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    completedAt: row.completed_at !== null ? Number(row.completed_at) : undefined,
    deletedAt: row.deleted_at !== null ? Number(row.deleted_at) : undefined,
  });
}

/**
 * Every write marks `_dirty = 1` so the next /sync/push knows to send this
 * row (see src/modules/sync/context.ts). Pull writes clear it explicitly.
 * Tags live in the normalized `tags`/`task_tags` tables (see
 * infra/tag/SqliteTagRepository.ts), not a column here.
 */
const UPSERT_SQL = `
  INSERT INTO tasks (
    id, name, description, status, at_time, at_epoch_millis, lat, lng, timezone,
    recurring_type, recurring_interval, recurring_task_id, hijri_date_offset,
    created_at, updated_at, completed_at, deleted_at, _dirty
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name, description = excluded.description, status = excluded.status,
    at_time = excluded.at_time, at_epoch_millis = excluded.at_epoch_millis,
    lat = excluded.lat, lng = excluded.lng, timezone = excluded.timezone,
    recurring_type = excluded.recurring_type, recurring_interval = excluded.recurring_interval,
    recurring_task_id = excluded.recurring_task_id, hijri_date_offset = excluded.hijri_date_offset,
    updated_at = excluded.updated_at,
    completed_at = excluded.completed_at, deleted_at = excluded.deleted_at, _dirty = 1
`;

function taskParams(task: Task): SqliteValue[] {
  return [
    String(task.id),
    task.name ?? "",
    task.description ?? null,
    task.status ?? 0,
    task.atTime ?? null,
    task.atEpochMillis ?? null,
    task.lat ?? null,
    task.long ?? null,
    task.timezone ?? null,
    task.recurringType ?? null,
    task.recurringInterval ?? null,
    task.recurringTaskId !== undefined && task.recurringTaskId !== null
      ? String(task.recurringTaskId)
      : null,
    task.hijriDateOffset ?? null,
    task.createdAt ?? Date.now(),
    task.updatedAt ?? Date.now(),
    task.completedAt ?? null,
    task.deletedAt ?? null,
  ];
}

function tagFilterCondition(tags: string[]): string {
  return `EXISTS (
    SELECT 1 FROM task_tags tt
    JOIN tags ON tags.id = tt.tag_id AND tags.deleted_at IS NULL
    WHERE tt.task_id = tasks.id AND tags.name IN (${tags.map(() => "?").join(",")})
  )`;
}

export class SqliteTaskRepository implements ITaskRepository {
  constructor(
    private readonly client: SqliteExecutor,
    private readonly tagRepo: ITagRepository
  ) {}

  private async attachTags(tasks: Task[]): Promise<Task[]> {
    if (tasks.length === 0) return tasks;
    const tagMap = await this.tagRepo.getTagsForTasks(tasks.map((t) => String(t.id)));
    for (const task of tasks) {
      const names = tagMap.get(String(task.id));
      task.tags = names && names.length > 0 ? names : null;
    }
    return tasks;
  }

  private async attachTag(task: Task): Promise<Task> {
    const [result] = await this.attachTags([task]);
    return result;
  }

  private async mapRows(rows: TaskRow[]): Promise<Task[]> {
    return this.attachTags(rows.map(rowToTask));
  }

  async create(input: TaskCreateInput): Promise<Task> {
    const now = Date.now();
    const task = new Task({
      id: generatePrefixedUUID("task_"),
      name: input.name,
      description: input.description,
      status: input.status || 0,
      atEpochMillis: input.atEpochMillis ?? null,
      atTime: input.atTime || "",
      createdAt: now,
      updatedAt: now,
      lat: input.lat,
      long: input.long,
      timezone: input.timezone,
      hijriDateOffset: input.hijriDateOffset || 0,
      recurringType: input.recurringType,
      recurringInterval: input.recurringInterval,
      recurringTaskId: input.recurringTaskId,
    });
    await this.client.run(UPSERT_SQL, taskParams(task));
    await this.tagRepo.setTaskTags(String(task.id), input.tags ?? []);
    return this.attachTag(task);
  }

  async update(id: string | number, input: TaskUpdateInput): Promise<Task> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Task ${id} not found`);
    }

    const merged = new Task({ ...existing, updatedAt: Date.now() });
    Object.assign(
      merged,
      Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined))
    );

    if (input.atTime) {
      merged.atTime = input.atTime;
    } else if (input.removeTime) {
      merged.atTime = "";
    }

    await this.client.run(UPSERT_SQL, taskParams(merged));
    if (input.tags !== undefined) {
      await this.tagRepo.setTaskTags(String(merged.id), input.tags ?? []);
    }
    return this.attachTag(merged);
  }

  async delete(id: string | number): Promise<void> {
    const now = Date.now();
    await this.client.run(
      `UPDATE tasks SET deleted_at = ?, updated_at = ?, _dirty = 1 WHERE id = ?`,
      [now, now, toStr(id)]
    );
  }

  async findById(id: string | number): Promise<Task | null> {
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE id = ? AND deleted_at IS NULL`,
      [toStr(id)]
    );
    return rows[0] ? this.attachTag(rowToTask(rows[0])) : null;
  }

  async find(query?: TaskQuery): Promise<Task[]> {
    const conditions = ["deleted_at IS NULL"];
    const params: SqliteValue[] = [];

    if (query?.status !== undefined) {
      conditions.push("status = ?");
      params.push(query.status);
    }
    if (query?.searchText && query.searchText.trim()) {
      const needle = `%${query.searchText.toLowerCase().trim()}%`;
      conditions.push("(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)");
      params.push(needle, needle);
    }
    if (query?.tags && query.tags.length > 0) {
      conditions.push(tagFilterCondition(query.tags));
      params.push(...query.tags);
    }

    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE ${conditions.join(" AND ")} ORDER BY status ASC, at_epoch_millis ASC`,
      params
    );
    return this.mapRows(rows);
  }

  async findByDate(date: string): Promise<Task[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE at_epoch_millis BETWEEN ? AND ? AND deleted_at IS NULL ORDER BY at_epoch_millis ASC`,
      [start.getTime(), end.getTime()]
    );
    return this.mapRows(rows);
  }

  async findByHijriDate(_hijriDate: string): Promise<Task[]> {
    // The PouchDB implementation this replaces filtered on a `hijriDate`
    // field that no task document (or this schema) ever populates — only
    // `hijriDateOffset` exists — so it always returned []. Preserved as-is;
    // fixing that is a behavior change outside this storage-layer refactor.
    return [];
  }

  async findWithPagination(offset: number, limit: number = 20): Promise<Task[]> {
    const rows = await this.client.run(
      `SELECT id, name, status, at_epoch_millis, created_at, updated_at FROM tasks WHERE deleted_at IS NULL ORDER BY id ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows.map(
      (row) =>
        new Task({
          id: String(row.id),
          name: String(row.name ?? ""),
          status: (row.status as 0 | 1) ?? 0,
          atEpochMillis: row.at_epoch_millis !== null ? Number(row.at_epoch_millis) : null,
          createdAt: Number(row.created_at),
          updatedAt: Number(row.updated_at),
        })
    );
  }

  async findTasksBefore(beforeEpoch: number): Promise<Task[]> {
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE status = 0 AND at_epoch_millis IS NOT NULL AND at_epoch_millis <= ? AND deleted_at IS NULL ORDER BY at_epoch_millis ASC`,
      [beforeEpoch]
    );
    return this.mapRows(rows);
  }

  async findTodayCompletedTasks(startEpoch: number, endEpoch: number): Promise<Task[]> {
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE status = 1 AND completed_at BETWEEN ? AND ? AND deleted_at IS NULL ORDER BY completed_at DESC`,
      [startEpoch, endEpoch]
    );
    return this.mapRows(rows);
  }

  async findTasksAfter(fromEpoch: number): Promise<Task[]> {
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE status = 0 AND at_epoch_millis >= ? AND deleted_at IS NULL ORDER BY at_epoch_millis ASC`,
      [fromEpoch]
    );
    return this.mapRows(rows);
  }

  async findAllPending(limit: number): Promise<Task[]> {
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE status = 0 AND deleted_at IS NULL ORDER BY at_epoch_millis ASC LIMIT ?`,
      [limit]
    );
    return this.mapRows(rows);
  }

  async findAllCompleted(offset: number, limit: number): Promise<Task[]> {
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE status = 1 AND completed_at IS NOT NULL AND deleted_at IS NULL ORDER BY completed_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return this.mapRows(rows);
  }

  async findPendingInRange(startEpoch: number, endEpoch: number): Promise<Task[]> {
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE status = 0 AND at_epoch_millis BETWEEN ? AND ? AND deleted_at IS NULL ORDER BY at_epoch_millis ASC`,
      [startEpoch, endEpoch]
    );
    return this.mapRows(rows);
  }

  async findBrowsedTasks(
    query?: TaskQuery,
    offset: number = 0,
    limit: number = 50
  ): Promise<Task[]> {
    const conditions = ["deleted_at IS NULL"];
    const params: SqliteValue[] = [];

    if (query?.status !== undefined) {
      conditions.push("status = ?");
      params.push(Number(query.status));
    }
    if (query?.unscheduled !== undefined) {
      conditions.push("at_epoch_millis IS NULL");
    } else if (query?.atEpochMillis !== undefined) {
      if (typeof query.atEpochMillis === "number") {
        conditions.push("at_epoch_millis = ?");
        params.push(query.atEpochMillis);
      } else {
        if (query.atEpochMillis.from !== undefined) {
          conditions.push("at_epoch_millis >= ?");
          params.push(query.atEpochMillis.from);
        }
        if (query.atEpochMillis.to !== undefined) {
          conditions.push("at_epoch_millis <= ?");
          params.push(query.atEpochMillis.to);
        }
      }
    }
    if (query?.searchText && query.searchText.trim()) {
      const needle = `%${query.searchText.toLowerCase().trim()}%`;
      conditions.push("(LOWER(name) LIKE ? OR LOWER(description) LIKE ?)");
      params.push(needle, needle);
    }
    if (query?.tags && query.tags.length > 0) {
      conditions.push(tagFilterCondition(query.tags));
      params.push(...query.tags);
    }

    params.push(limit, offset);
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE ${conditions.join(" AND ")} ORDER BY status ASC, at_epoch_millis ASC LIMIT ? OFFSET ?`,
      params
    );
    return this.mapRows(rows);
  }

  async findUnscheduledTasks(): Promise<Task[]> {
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE at_epoch_millis IS NULL AND status = 0 AND deleted_at IS NULL ORDER BY created_at ASC`
    );
    return this.mapRows(rows);
  }

  async findByRecurringTaskId(recurringTaskId: string | number): Promise<Task[]> {
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE recurring_task_id = ? AND deleted_at IS NULL`,
      [toStr(recurringTaskId)]
    );
    return this.mapRows(rows);
  }

  async findByRecurringTaskIdInRange(
    recurringTaskId: string | number,
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]> {
    const rows = await this.client.run(
      `SELECT * FROM tasks WHERE recurring_task_id = ? AND at_epoch_millis BETWEEN ? AND ?`,
      [toStr(recurringTaskId), startEpoch, endEpoch]
    );
    return this.mapRows(rows);
  }

  async deletePendingByRecurringTaskId(recurringTaskId: string | number): Promise<void> {
    const tasks = await this.findByRecurringTaskId(recurringTaskId);
    const pending = tasks.filter((t) => t.status !== 1);
    await Promise.all(pending.map((t) => this.delete(t.id!)));
  }

  async completeTask(id: string | number): Promise<Task> {
    const now = Date.now();
    await this.client.run(
      `UPDATE tasks SET status = 1, completed_at = ?, updated_at = ?, _dirty = 1 WHERE id = ?`,
      [now, now, toStr(id)]
    );
    const task = await this.findById(id);
    if (!task) throw new Error(`Task ${id} not found`);
    return task;
  }

  async reopenTask(id: string | number): Promise<Task> {
    const now = Date.now();
    await this.client.run(
      `UPDATE tasks SET status = 0, completed_at = NULL, updated_at = ?, _dirty = 1 WHERE id = ?`,
      [now, toStr(id)]
    );
    const task = await this.findById(id);
    if (!task) throw new Error(`Task ${id} not found`);
    return task;
  }
}
