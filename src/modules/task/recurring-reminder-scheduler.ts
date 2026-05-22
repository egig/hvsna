import type { RecurringTask } from "./recurring-task";
import type { ITaskRepository } from "../../domain/task/ITaskRepository";
import { useRecurringOccurance } from "./recurring-task-generator";
import { ReminderService } from "./reminder-service";
import logger from "../logger";

const REGISTRY_DOC_ID = "reminder_registry_virtual";
const HORIZON_DAYS = 7;

interface ReminderRegistry {
  _id: string;
  _rev?: string;
  type: "reminder_registry";
  scheduledIds: string[];
}

async function loadRegistry(db: PouchDB.Database): Promise<ReminderRegistry> {
  try {
    return (await db.get(REGISTRY_DOC_ID)) as ReminderRegistry;
  } catch {
    return {
      _id: REGISTRY_DOC_ID,
      type: "reminder_registry",
      scheduledIds: [],
    };
  }
}

async function saveRegistry(
  db: PouchDB.Database,
  registry: ReminderRegistry,
  scheduledIds: string[]
): Promise<void> {
  try {
    await db.put({ ...registry, scheduledIds });
  } catch (err) {
    logger.error("Failed to save reminder registry:", err);
  }
}

/**
 * Cancels all previously registered virtual reminders, then schedules
 * reminders for all virtual recurring task occurrences in the next 7 days.
 * Should be called once on app startup.
 */

export function useTaskReminder() {
  const { buildVirtualTasksForRange } = useRecurringOccurance();
  return async function scheduleRecurringTaskReminders(
    db: PouchDB.Database,
    templates: RecurringTask[],
    taskRepository: ITaskRepository
  ): Promise<void> {
    if (templates.length === 0) return;

    const now = Date.now();
    const horizon = now + HORIZON_DAYS * 24 * 60 * 60 * 1000;

    const registry = await loadRegistry(db);

    // Cancel all previously scheduled virtual reminders to avoid stale ones
    await Promise.allSettled(
      registry.scheduledIds.map((id) => ReminderService.cancelTaskReminders(id))
    );

    // Build virtual tasks for the coming week
    const virtualTasks = await buildVirtualTasksForRange(
      templates,
      taskRepository,
      now,
      horizon
    );

    // Only schedule future occurrences (overdue virtuals don't need new reminders)
    const schedulable = virtualTasks.filter(
      (t) => t.atEpochMillis != null && t.atEpochMillis > now
    );

    await ReminderService.scheduleMultipleTaskReminders(schedulable);

    await saveRegistry(
      db,
      registry,
      schedulable.map((t) => t.id as string)
    );
  };
}

/**
 * Cancels the virtual reminder for a specific occurrence and removes it
 * from the registry. Call this when a virtual task is materialized.
 */
export async function cancelVirtualReminder(
  db: PouchDB.Database,
  virtualTaskId: string
): Promise<void> {
  await ReminderService.cancelTaskReminders(virtualTaskId);

  const registry = await loadRegistry(db);
  const updated = registry.scheduledIds.filter((id) => id !== virtualTaskId);
  await saveRegistry(db, registry, updated);
}
