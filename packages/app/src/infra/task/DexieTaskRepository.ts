import { DexieTagRepository } from "../tag/DexieTagRepository";
import { ascNullsFirst, descNullsLast, sortRows } from "../row-order";
import { Task } from "@/domain/task";
import type {
  TaskCreateInput,
  TaskQuery,
  TaskUpdateInput,
} from "@/domain/task";
import type { ITaskRepository } from "@/domain/task/ITaskRepository";
import type { ITagRepository } from "@/domain/tag/ITagRepository";
import { generatePrefixedUUID } from "@/modules/uuid";
import type { DbExecutor } from "@/modules/db/executor";
import type { TaskRow } from "@/modules/db/database";
import type { WriteNotifier } from "@/modules/sync/write-notifier";

function toStr(id: string | number): string {
  return String(id);
}

function rowToTask(row: TaskRow): Task {
  return new Task({
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    status: (row.status as 0 | 1) ?? 0,
    atEpochMillis: row.at_epoch_millis,
    atTime: row.at_time ?? "",
    lat: row.lat ?? undefined,
    long: row.lng ?? undefined,
    timezone: row.timezone ?? undefined,
    recurringType: (row.recurring_type as Task["recurringType"]) ?? undefined,
    recurringInterval: row.recurring_interval ?? undefined,
    recurringTaskId: row.recurring_task_id,
    hijriDateOffset: row.hijri_date_offset ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at ?? undefined,
    deletedAt: row.deleted_at ?? undefined,
  });
}

/**
 * Every write marks `_dirty = 1` so the next /sync/push knows to send this
 * row (see src/modules/sync/context.ts). Pull writes clear it explicitly.
 * Tags live in the normalized `tags`/`task_tags` tables (see
 * infra/tag/DexieTagRepository.ts), not a field here.
 */
function taskToRow(task: Task): TaskRow {
  return {
    id: String(task.id),
    name: task.name ?? "",
    description: task.description ?? null,
    status: task.status ?? 0,
    at_time: task.atTime ?? null,
    at_epoch_millis: task.atEpochMillis ?? null,
    lat: task.lat ?? null,
    lng: task.long ?? null,
    timezone: task.timezone ?? null,
    recurring_type: task.recurringType ?? null,
    recurring_interval: task.recurringInterval ?? null,
    recurring_task_id:
      task.recurringTaskId !== undefined && task.recurringTaskId !== null
        ? String(task.recurringTaskId)
        : null,
    hijri_date_offset: task.hijriDateOffset ?? null,
    created_at: task.createdAt ?? Date.now(),
    updated_at: task.updatedAt ?? Date.now(),
    completed_at: task.completedAt ?? null,
    deleted_at: task.deletedAt ?? null,
    _dirty: 1,
  };
}

const isLive = (row: TaskRow) => row.deleted_at === null;

const byStatusThenTime = [
  (a: TaskRow, b: TaskRow) => a.status - b.status,
  (a: TaskRow, b: TaskRow) => ascNullsFirst(a.at_epoch_millis, b.at_epoch_millis),
];
const byTime = (a: TaskRow, b: TaskRow) => ascNullsFirst(a.at_epoch_millis, b.at_epoch_millis);
const byCompletedDesc = (a: TaskRow, b: TaskRow) => descNullsLast(a.completed_at, b.completed_at);

function matchesSearch(row: TaskRow, searchText: string | undefined): boolean {
  const needle = searchText?.toLowerCase().trim();
  if (!needle) return true;
  return (
    row.name.toLowerCase().includes(needle) ||
    (row.description ?? "").toLowerCase().includes(needle)
  );
}

export class DexieTaskRepository implements ITaskRepository {
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

  /** Ids of tasks carrying at least one of the named live tags. */
  private async taskIdsWithAnyTag(tagNames: string[]): Promise<Set<string>> {
    const tags = await this.db.tags.where("name").anyOf(tagNames).toArray();
    const tagIds = tags.filter((tag) => tag.deleted_at === null).map((tag) => tag.id);
    const links = await this.db.task_tags.where("tag_id").anyOf(tagIds).toArray();
    return new Set(links.map((link) => link.task_id));
  }

  /** Live tasks matching the status/search/tag parts of a query. */
  private async queryRows(query: TaskQuery | undefined): Promise<TaskRow[]> {
    const rows =
      query?.status !== undefined
        ? await this.db.tasks.where("status").equals(Number(query.status)).toArray()
        : await this.db.tasks.toArray();
    const taggedIds =
      query?.tags && query.tags.length > 0 ? await this.taskIdsWithAnyTag(query.tags) : null;
    return rows.filter(
      (row) =>
        isLive(row) &&
        matchesSearch(row, query?.searchText) &&
        (taggedIds === null || taggedIds.has(row.id))
    );
  }

  async create(input: TaskCreateInput): Promise<Task> {
    return this.executor.transaction((executor) =>
      new DexieTaskRepository(executor, this.writeNotifier).createInTransaction(input)
    );
  }

  private async createInTransaction(input: TaskCreateInput): Promise<Task> {
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
    await this.db.tasks.put(taskToRow(task));
    this.executor.afterCommit(() => this.writeNotifier.notify("tasks"));
    await this.tagRepo.setTaskTags(String(task.id), input.tags ?? []);
    return this.attachTag(task);
  }

  async update(id: string | number, input: TaskUpdateInput): Promise<Task> {
    return this.executor.transaction((executor) =>
      new DexieTaskRepository(executor, this.writeNotifier).updateInTransaction(id, input)
    );
  }

  private async updateInTransaction(id: string | number, input: TaskUpdateInput): Promise<Task> {
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

    await this.db.tasks.put(taskToRow(merged));
    this.executor.afterCommit(() => this.writeNotifier.notify("tasks"));
    if (input.tags !== undefined) {
      await this.tagRepo.setTaskTags(String(merged.id), input.tags ?? []);
    }
    return this.attachTag(merged);
  }

  async delete(id: string | number): Promise<void> {
    const now = Date.now();
    await this.db.tasks.update(toStr(id), { deleted_at: now, updated_at: now, _dirty: 1 });
    this.executor.afterCommit(() => this.writeNotifier.notify("tasks"));
  }

  async findById(id: string | number): Promise<Task | null> {
    const row = await this.db.tasks.get(toStr(id));
    return row && isLive(row) ? this.attachTag(rowToTask(row)) : null;
  }

  async find(query?: TaskQuery): Promise<Task[]> {
    return this.mapRows(sortRows(await this.queryRows(query), ...byStatusThenTime));
  }

  async findByDate(date: string): Promise<Task[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const rows = await this.db.tasks
      .where("at_epoch_millis")
      .between(start.getTime(), end.getTime(), true, true)
      .toArray();
    return this.mapRows(sortRows(rows.filter(isLive), byTime));
  }

  async findByHijriDate(_hijriDate: string): Promise<Task[]> {
    // The PouchDB implementation this replaces filtered on a `hijriDate`
    // field that no task document (or this schema) ever populates — only
    // `hijriDateOffset` exists — so it always returned []. Preserved as-is;
    // fixing that is a behavior change outside this storage-layer refactor.
    return [];
  }

  async findWithPagination(offset: number, limit: number = 20): Promise<Task[]> {
    const rows = (await this.db.tasks.orderBy("id").toArray())
      .filter(isLive)
      .slice(offset, offset + limit);
    return rows.map(
      (row) =>
        new Task({
          id: row.id,
          name: row.name ?? "",
          status: (row.status as 0 | 1) ?? 0,
          atEpochMillis: row.at_epoch_millis,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })
    );
  }

  async findTasksBefore(beforeEpoch: number): Promise<Task[]> {
    const rows = await this.db.tasks.where("at_epoch_millis").belowOrEqual(beforeEpoch).toArray();
    return this.mapRows(sortRows(rows.filter((row) => row.status === 0 && isLive(row)), byTime));
  }

  async findTodayCompletedTasks(startEpoch: number, endEpoch: number): Promise<Task[]> {
    const rows = await this.db.tasks
      .where("completed_at")
      .between(startEpoch, endEpoch, true, true)
      .toArray();
    return this.mapRows(
      sortRows(rows.filter((row) => row.status === 1 && isLive(row)), byCompletedDesc)
    );
  }

  async findTasksAfter(fromEpoch: number): Promise<Task[]> {
    const rows = await this.db.tasks.where("at_epoch_millis").aboveOrEqual(fromEpoch).toArray();
    return this.mapRows(sortRows(rows.filter((row) => row.status === 0 && isLive(row)), byTime));
  }

  async findAllPending(limit: number): Promise<Task[]> {
    const rows = await this.db.tasks.where("status").equals(0).toArray();
    return this.mapRows(sortRows(rows.filter(isLive), byTime).slice(0, limit));
  }

  async findAllCompleted(offset: number, limit: number): Promise<Task[]> {
    const rows = await this.db.tasks.where("status").equals(1).toArray();
    const completed = rows.filter((row) => row.completed_at !== null && isLive(row));
    return this.mapRows(sortRows(completed, byCompletedDesc).slice(offset, offset + limit));
  }

  async findPendingInRange(startEpoch: number, endEpoch: number): Promise<Task[]> {
    const rows = await this.db.tasks
      .where("at_epoch_millis")
      .between(startEpoch, endEpoch, true, true)
      .toArray();
    return this.mapRows(sortRows(rows.filter((row) => row.status === 0 && isLive(row)), byTime));
  }

  async findBrowsedTasks(
    query?: TaskQuery,
    offset: number = 0,
    limit: number = 50
  ): Promise<Task[]> {
    const at = query?.atEpochMillis;
    const rows = (await this.queryRows(query)).filter((row) => {
      if (query?.unscheduled !== undefined) return row.at_epoch_millis === null;
      if (at === undefined) return true;
      if (typeof at === "number") return row.at_epoch_millis === at;
      if (at.from !== undefined && (row.at_epoch_millis === null || row.at_epoch_millis < at.from)) {
        return false;
      }
      if (at.to !== undefined && (row.at_epoch_millis === null || row.at_epoch_millis > at.to)) {
        return false;
      }
      return true;
    });
    return this.mapRows(sortRows(rows, ...byStatusThenTime).slice(offset, offset + limit));
  }

  async findUnscheduledTasks(): Promise<Task[]> {
    const rows = await this.db.tasks.where("status").equals(0).toArray();
    return this.mapRows(
      sortRows(rows.filter((row) => row.at_epoch_millis === null && isLive(row)))
    );
  }

  async findByRecurringTaskId(recurringTaskId: string | number): Promise<Task[]> {
    const rows = await this.db.tasks
      .where("recurring_task_id")
      .equals(toStr(recurringTaskId))
      .toArray();
    return this.mapRows(sortRows(rows.filter(isLive)));
  }

  async findByRecurringTaskIdInRange(
    recurringTaskId: string | number,
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]> {
    // Includes soft-deleted rows, unlike findByRecurringTaskId.
    const rows = await this.db.tasks
      .where("recurring_task_id")
      .equals(toStr(recurringTaskId))
      .toArray();
    return this.mapRows(
      sortRows(
        rows.filter(
          (row) =>
            row.at_epoch_millis !== null &&
            row.at_epoch_millis >= startEpoch &&
            row.at_epoch_millis <= endEpoch
        )
      )
    );
  }

  async deletePendingByRecurringTaskId(recurringTaskId: string | number): Promise<void> {
    const now = Date.now();
    await this.db.tasks
      .where("recurring_task_id")
      .equals(toStr(recurringTaskId))
      .filter((row) => row.status === 0 && isLive(row))
      .modify({ deleted_at: now, updated_at: now, _dirty: 1 });
    this.executor.afterCommit(() => this.writeNotifier.notify("tasks"));
  }

  async completeTask(id: string | number): Promise<Task> {
    return this.executor.transaction((executor) =>
      new DexieTaskRepository(executor, this.writeNotifier).completeTaskInTransaction(id)
    );
  }

  private async completeTaskInTransaction(id: string | number): Promise<Task> {
    const now = Date.now();
    await this.db.tasks.update(toStr(id), {
      status: 1,
      completed_at: now,
      updated_at: now,
      _dirty: 1,
    });
    this.executor.afterCommit(() => this.writeNotifier.notify("tasks"));
    const task = await this.findById(id);
    if (!task) throw new Error(`Task ${id} not found`);
    return task;
  }

  async reopenTask(id: string | number): Promise<Task> {
    return this.executor.transaction((executor) =>
      new DexieTaskRepository(executor, this.writeNotifier).reopenTaskInTransaction(id)
    );
  }

  private async reopenTaskInTransaction(id: string | number): Promise<Task> {
    const now = Date.now();
    await this.db.tasks.update(toStr(id), {
      status: 0,
      completed_at: null,
      updated_at: now,
      _dirty: 1,
    });
    this.executor.afterCommit(() => this.writeNotifier.notify("tasks"));
    const task = await this.findById(id);
    if (!task) throw new Error(`Task ${id} not found`);
    return task;
  }
}
