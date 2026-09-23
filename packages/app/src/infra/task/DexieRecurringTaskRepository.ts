import { DexieTagRepository } from "../tag/DexieTagRepository";
import { sortRows } from "../row-order";
import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskQuery,
  RecurringTaskUpdateInput,
} from "@/modules/task/recurring-task";
import type { IRecurringTaskRepository } from "@/domain/task/IRecurringTaskRepository";
import type { ITagRepository } from "@/domain/tag/ITagRepository";
import type { DbExecutor } from "@/modules/db/executor";
import type { RecurringTaskRow } from "@/modules/db/database";
import type { WriteNotifier } from "@/modules/sync/write-notifier";

function toStr(id: string | number): string {
  return String(id);
}

function rowToRecurringTask(row: RecurringTaskRow): RecurringTask {
  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? undefined,
    recurringType: row.recurring_type as RecurringTask["recurringType"],
    recurringInterval: row.recurring_interval ?? 1,
    baseDateEpoch: row.base_date_epoch ?? 0,
    atTime: row.at_time ?? undefined,
    lat: row.lat ?? undefined,
    long: row.lng ?? undefined,
    timezone: row.timezone ?? undefined,
    hijriDateOffset: row.hijri_date_offset ?? undefined,
    recurringEnd: row.recurring_end as RecurringTask["recurringEnd"],
    recurringEndEpoch: row.recurring_end_epoch ?? undefined,
    recurringEndOccurrences: row.recurring_end_occurrences ?? undefined,
    useGregorian: row.use_gregorian !== null ? Boolean(row.use_gregorian) : undefined,
    occurrenceExceptions:
      row.occurrence_exceptions !== null ? JSON.parse(row.occurrence_exceptions) : undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/** Tags live in the normalized `tags`/`recurring_task_tags` tables (see infra/tag/DexieTagRepository.ts), not a field here. */
function recurringTaskToRow(t: RecurringTask): RecurringTaskRow {
  return {
    id: String(t.id),
    name: t.name,
    description: t.description ?? null,
    recurring_type: t.recurringType,
    recurring_interval: t.recurringInterval ?? 1,
    base_date_epoch: t.baseDateEpoch,
    at_time: t.atTime ?? null,
    lat: t.lat ?? null,
    lng: t.long ?? null,
    timezone: t.timezone ?? null,
    hijri_date_offset: t.hijriDateOffset ?? null,
    recurring_end: t.recurringEnd ?? null,
    recurring_end_epoch: t.recurringEndEpoch ?? null,
    recurring_end_occurrences: t.recurringEndOccurrences ?? null,
    use_gregorian: t.useGregorian ? 1 : 0,
    occurrence_exceptions: t.occurrenceExceptions ? JSON.stringify(t.occurrenceExceptions) : null,
    created_at: t.created_at ?? Date.now(),
    updated_at: t.updated_at ?? Date.now(),
    deleted_at: null,
    _dirty: 1,
  };
}

export class DexieRecurringTaskRepository implements IRecurringTaskRepository {
  private readonly tagRepo: ITagRepository;

  constructor(
    private readonly executor: DbExecutor,
    private readonly writeNotifier: WriteNotifier
  ) {
    this.tagRepo = new DexieTagRepository(executor, writeNotifier);
  }

  private get db() {
    return this.executor.db;
  }

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
    return this.executor.transaction((executor) =>
      new DexieRecurringTaskRepository(executor, this.writeNotifier).createInTransaction(input)
    );
  }

  private async createInTransaction(input: RecurringTaskCreateInput): Promise<RecurringTask> {
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
    // Unlike an update, re-creating an existing id keeps its original created_at.
    const existing = await this.db.recurring_tasks.get(String(recurringTask.id));
    const row = recurringTaskToRow(recurringTask);
    await this.db.recurring_tasks.put(existing ? { ...row, created_at: existing.created_at } : row);
    this.executor.afterCommit(() => this.writeNotifier.notify("recurring_tasks"));
    await this.tagRepo.setRecurringTaskTags(String(recurringTask.id), input.tags ?? []);
    return this.attachTag(recurringTask);
  }

  async update(id: string | number, input: RecurringTaskUpdateInput): Promise<RecurringTask> {
    return this.executor.transaction((executor) =>
      new DexieRecurringTaskRepository(executor, this.writeNotifier).updateInTransaction(id, input)
    );
  }

  private async updateInTransaction(
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

    await this.db.recurring_tasks.put(recurringTaskToRow(merged));
    this.executor.afterCommit(() => this.writeNotifier.notify("recurring_tasks"));
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
    await this.db.recurring_tasks.update(toStr(id), {
      deleted_at: now,
      updated_at: now,
      _dirty: 1,
    });
    this.executor.afterCommit(() => this.writeNotifier.notify("recurring_tasks"));
  }

  async findById(id: string | number): Promise<RecurringTask | null> {
    const row = await this.db.recurring_tasks.get(toStr(id));
    return row && row.deleted_at === null ? this.attachTag(rowToRecurringTask(row)) : null;
  }

  async find(query?: RecurringTaskQuery): Promise<RecurringTask[]> {
    const rows = (await this.db.recurring_tasks.toArray()).filter(
      (row) =>
        row.deleted_at === null &&
        (query?.id === undefined || row.id === toStr(query.id)) &&
        (!query?.recurringType || row.recurring_type === query.recurringType)
    );
    const sorted = sortRows(rows, (a, b) =>
      a.recurring_type < b.recurring_type ? -1 : a.recurring_type > b.recurring_type ? 1 : 0
    );
    return this.attachTags(sorted.map(rowToRecurringTask));
  }
}
