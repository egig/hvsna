import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskUpdateInput,
  RecurringTaskQuery,
} from "../../modules/task/recurring-task";
import type { IRecurringTaskRepository } from "../../domain/task/IRecurringTaskRepository";
import type { ITaskRepository } from "../../domain/task/ITaskRepository";
import type { Task } from "@/domain/task";
import dayjs from "dayjs";

export class RecurringTaskUseCases {
  constructor(
    private readonly recurringTaskRepository: IRecurringTaskRepository,
    private readonly taskRepository: ITaskRepository
  ) {}

  async createRecurringTask(
    input: RecurringTaskCreateInput
  ): Promise<RecurringTask> {
    return await this.recurringTaskRepository.create(input);
  }

  async updateRecurringTask(
    id: string,
    input: RecurringTaskUpdateInput
  ): Promise<RecurringTask> {
    return await this.recurringTaskRepository.update(id, input);
  }

  async deleteRecurringTask(id: string): Promise<void> {
    await this.recurringTaskRepository.delete(id);
  }

  async getRecurringTask(id: string): Promise<RecurringTask | null> {
    return await this.recurringTaskRepository.findById(id);
  }

  async getRecurringTasks(
    query?: RecurringTaskQuery
  ): Promise<RecurringTask[]> {
    return await this.recurringTaskRepository.find(query);
  }

  /**
   * Converts a virtual recurring occurrence into a persisted Task document,
   * cancels its virtual reminder, and marks the slot as an occurrence exception
   * so the generator does not re-emit a virtual for the same date.
   *
   * Pass `cancelReminder` only when notifications are enabled — it is called
   * with the virtual task id (vtask_<recurringId>_<epoch>).
   */
  async materializeVirtualTask(
    task: Task,
    cancelReminder?: (virtualTaskId: string) => Promise<void>
  ): Promise<Task> {
    if (!task.isVirtual) return task;

    if (cancelReminder && task.id) {
      try {
        await cancelReminder(task.id as string);
      } catch {
        // best-effort: missing reminder is not fatal
      }
    }

    const created = await this.taskRepository.create({
      name: task.name || "",
      description: task.description,
      atEpochMillis: task.atEpochMillis,
      atTime: task.atTime,
      lat: task.lat,
      long: task.long,
      timezone: task.timezone,
      hijriDateOffset: task.hijriDateOffset,
      recurringType: task.recurringType,
      recurringInterval: task.recurringInterval,
      recurringTaskId: task.recurringTaskId ?? undefined,
      tags: task.tags ?? [],
    });

    if (created.recurringTaskId && created.atEpochMillis) {
      await this.addOccurrenceException(
        created.recurringTaskId,
        created.atEpochMillis
      );
    }

    return created;
  }

  async addOccurrenceException(id: string, epoch: number): Promise<void> {
    const rtask = await this.recurringTaskRepository.findById(id);
    if (!rtask) return;
    const dateStr = dayjs(epoch).format("YYYYMMDD");
    // Prune entries older than 60 days — the generator's overdue lookback window
    // is 60 days, so anything older is never checked and just grows the document.
    const cutoff = dayjs().subtract(60, "day").format("YYYYMMDD");
    const next = [
      ...new Set([
        ...(rtask.occurrenceExceptions ?? []).filter((d) => d >= cutoff),
        dateStr,
      ]),
    ];
    await this.recurringTaskRepository.update(id, { occurrenceExceptions: next });
  }
}
