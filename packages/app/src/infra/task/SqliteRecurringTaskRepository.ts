import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskQuery,
  RecurringTaskUpdateInput,
} from "@/modules/task/recurring-task";
import type { IRecurringTaskRepository } from "@/domain/task/IRecurringTaskRepository";
import type { ITagRepository } from "@/domain/tag/ITagRepository";
import type { SqliteExecutor, SqliteValue } from "@/modules/sqlite/client";
import type { WriteNotifier } from "@/modules/sync/write-notifier";

type RecurringTaskRow = Record<string, SqliteValue>;

function toStr(id: string | number): string {
  return String(id);
}

function rowToRecurringTask(row: RecurringTaskRow): RecurringTask {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: row.description !== null ? String(row.description) : undefined,
    recurringType: row.recurring_type as RecurringTask["recurringType"],
    recurringInterval: Number(row.recurring_interval ?? 1),
    baseDateEpoch: Number(row.base_date_epoch ?? 0),
    atTime: row.at_time !== null ? String(row.at_time) : undefined,
    lat: row.lat !== null ? Number(row.lat) : undefined,
    long: row.lng !== null ? Number(row.lng) : undefined,
    timezone: row.timezone !== null ? String(row.timezone) : undefined,
    hijriDateOffset: row.hijri_date_offset !== null ? Number(row.hijri_date_offset) : undefined,
    recurringEnd: row.recurring_end as RecurringTask["recurringEnd"],
    recurringEndEpoch:
      row.recurring_end_epoch !== null ? Number(row.recurring_end_epoch) : undefined,
    recurringEndOccurrences:
      row.recurring_end_occurrences !== null ? Number(row.recurring_end_occurrences) : undefined,
    useGregorian: row.use_gregorian !== null ? Boolean(row.use_gregorian) : undefined,
    occurrenceExceptions:
      row.occurrence_exceptions !== null ? JSON.parse(String(row.occurrence_exceptions)) : undefined,
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
  };
}

/** Tags live in the normalized `tags`/`recurring_task_tags` tables (see infra/tag/SqliteTagRepository.ts), not a column here. */
const UPSERT_SQL = `
  INSERT INTO recurring_tasks (
    id, name, description, recurring_type, recurring_interval, base_date_epoch, at_time,
    lat, lng, timezone, hijri_date_offset, recurring_end, recurring_end_epoch,
    recurring_end_occurrences, use_gregorian, occurrence_exceptions, created_at, updated_at,
    deleted_at, _dirty
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name, description = excluded.description,
    recurring_type = excluded.recurring_type, recurring_interval = excluded.recurring_interval,
    base_date_epoch = excluded.base_date_epoch, at_time = excluded.at_time,
    lat = excluded.lat, lng = excluded.lng, timezone = excluded.timezone,
    hijri_date_offset = excluded.hijri_date_offset,
    recurring_end = excluded.recurring_end, recurring_end_epoch = excluded.recurring_end_epoch,
    recurring_end_occurrences = excluded.recurring_end_occurrences,
    use_gregorian = excluded.use_gregorian, occurrence_exceptions = excluded.occurrence_exceptions,
    updated_at = excluded.updated_at, deleted_at = excluded.deleted_at, _dirty = 1
`;

function recurringTaskParams(t: RecurringTask): SqliteValue[] {
  return [
    String(t.id),
    t.name,
    t.description ?? null,
    t.recurringType,
    t.recurringInterval ?? 1,
    t.baseDateEpoch,
    t.atTime ?? null,
    t.lat ?? null,
    t.long ?? null,
    t.timezone ?? null,
    t.hijriDateOffset ?? null,
    t.recurringEnd ?? null,
    t.recurringEndEpoch ?? null,
    t.recurringEndOccurrences ?? null,
    t.useGregorian ? 1 : 0,
    t.occurrenceExceptions ? JSON.stringify(t.occurrenceExceptions) : null,
    t.created_at ?? Date.now(),
    t.updated_at ?? Date.now(),
    null, // deleted_at
  ];
}

export class SqliteRecurringTaskRepository implements IRecurringTaskRepository {
  constructor(
    private readonly client: SqliteExecutor,
    private readonly tagRepo: ITagRepository,
    private readonly writeNotifier: WriteNotifier
  ) {}

  private async attachTags(recurringTasks: RecurringTask[]): Promise<RecurringTask[]> {
    if (recurringTasks.length === 0) return recurringTasks;
    const tagMap = await this.tagRepo.getTagsForRecurringTasks(
      recurringTasks.map((t) => String(t.id))
    );
    for (const rtask of recurringTasks) {
      rtask.tags = tagMap.get(String(rtask.id)) ?? undefined;
    }
    return recurringTasks;
  }

  private async attachTag(rtask: RecurringTask): Promise<RecurringTask> {
    const [result] = await this.attachTags([rtask]);
    return result;
  }

  async create(input: RecurringTaskCreateInput): Promise<RecurringTask> {
    const now = Date.now();
    const recurringTask: RecurringTask = {
      id: input.id || `rtask_${crypto.randomUUID()}`,
      name: input.name,
      description: input.description,
      recurringType: input.recurringType,
      recurringInterval: input.recurringInterval ?? 1,
      baseDateEpoch: input.baseDateEpoch,
      atTime: input.atTime,
      lat: input.lat,
      long: input.long,
      timezone: input.timezone,
      hijriDateOffset: input.hijriDateOffset,
      created_at: now,
      updated_at: now,
      recurringEnd: input.recurringEnd,
      recurringEndEpoch: input.recurringEndEpoch,
      recurringEndOccurrences: input.recurringEndOccurrences,
      useGregorian: input.useGregorian,
      occurrenceExceptions: input.occurrenceExceptions,
    };
    await this.client.run(UPSERT_SQL, recurringTaskParams(recurringTask));
    this.writeNotifier.notify("recurring_tasks");
    await this.tagRepo.setRecurringTaskTags(String(recurringTask.id), input.tags ?? []);
    return this.attachTag(recurringTask);
  }

  async update(
    id: string | number,
    input: RecurringTaskUpdateInput
  ): Promise<RecurringTask> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Recurring task ${id} not found`);
    }

    const merged: RecurringTask = {
      ...existing,
      ...Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)),
      updated_at: Date.now(),
    };

    await this.client.run(UPSERT_SQL, recurringTaskParams(merged));
    this.writeNotifier.notify("recurring_tasks");
    if (input.tags !== undefined) {
      await this.tagRepo.setRecurringTaskTags(String(merged.id), input.tags ?? []);
    }
    return this.attachTag(merged);
  }

  /**
   * Soft delete — unlike the PouchDB implementation this replaces (which
   * called db.remove()), a hard delete leaves nothing for /sync/push to
   * send, so the deletion would never propagate to other devices. See the
   * plan's sync-engine design.
   */
  async delete(id: string | number): Promise<void> {
    const now = Date.now();
    await this.client.run(
      `UPDATE recurring_tasks SET deleted_at = ?, updated_at = ?, _dirty = 1 WHERE id = ?`,
      [now, now, toStr(id)]
    );
    this.writeNotifier.notify("recurring_tasks");
  }

  async findById(id: string | number): Promise<RecurringTask | null> {
    const rows = await this.client.run(
      `SELECT * FROM recurring_tasks WHERE id = ? AND deleted_at IS NULL`,
      [toStr(id)]
    );
    return rows[0] ? this.attachTag(rowToRecurringTask(rows[0])) : null;
  }

  async find(query?: RecurringTaskQuery): Promise<RecurringTask[]> {
    const conditions = ["deleted_at IS NULL"];
    const params: SqliteValue[] = [];

    if (query?.id !== undefined) {
      conditions.push("id = ?");
      params.push(toStr(query.id));
    }
    if (query?.recurringType) {
      conditions.push("recurring_type = ?");
      params.push(query.recurringType);
    }

    const rows = await this.client.run(
      `SELECT * FROM recurring_tasks WHERE ${conditions.join(" AND ")} ORDER BY recurring_type ASC`,
      params
    );
    return this.attachTags(rows.map(rowToRecurringTask));
  }
}
