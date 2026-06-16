import dayjs from "dayjs";
import type { Task } from "@/domain/task";
import type { PouchDBTaskRepository } from "../../infra/task/PouchDBTaskRepository";
import type { PouchDBRecurringTaskRepository } from "../../infra/task/PouchDBRecurringTaskRepository";

/**
 * Converts a virtual recurring occurrence into a persisted Task document,
 * cancels its virtual reminder, and marks the slot as an occurrence exception
 * so the generator does not re-emit a virtual for the same date.
 *
 * Pass `cancelReminder` only when notifications are enabled — it is called
 * with the virtual task id (vtask_<recurringId>_<epoch>).
 */
export async function materializeVirtualTask(
  task: Task,
  taskRepo: PouchDBTaskRepository,
  recurringRepo: PouchDBRecurringTaskRepository,
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

  const created = await taskRepo.create({
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
    await addOccurrenceException(
      created.recurringTaskId,
      created.atEpochMillis,
      recurringRepo
    );
  }

  return created;
}

async function addOccurrenceException(
  id: string,
  epoch: number,
  recurringRepo: PouchDBRecurringTaskRepository
): Promise<void> {
  const rtask = await recurringRepo.findById(id);
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
  await recurringRepo.update(id, { occurrenceExceptions: next });
}
