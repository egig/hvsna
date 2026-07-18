import type { RecurringTask } from "./recurring-task";
import { useRecurringOccurance } from "./recurring-task-generator";
import { ReminderService } from "./reminder-service";
import type { IReminderRegistryRepository } from "@/domain/task/IReminderRegistryRepository";

const HORIZON_DAYS = 7;

/**
 * Cancels all previously registered virtual reminders, then schedules
 * reminders for all virtual recurring task occurrences in the next 7 days.
 * Should be called once on app startup.
 */

export function useTaskReminder() {
  const { buildVirtualTasksForRange } = useRecurringOccurance();
  return async function scheduleRecurringTaskReminders(
    registry: IReminderRegistryRepository,
    templates: RecurringTask[]
  ): Promise<void> {
    if (templates.length === 0) return;

    const now = Date.now();
    const horizon = now + HORIZON_DAYS * 24 * 60 * 60 * 1000;

    const scheduledIds = await registry.load();

    // Cancel all previously scheduled virtual reminders to avoid stale ones
    await Promise.allSettled(
      scheduledIds.map((id) => ReminderService.cancelTaskReminders(id))
    );

    // Build virtual tasks for the coming week
    const virtualTasks = await buildVirtualTasksForRange(
      templates,
      now,
      horizon
    );

    // Only schedule future occurrences (overdue virtuals don't need new reminders)
    const schedulable = virtualTasks.filter(
      (t) => t.atEpochMillis != null && t.atEpochMillis > now
    );

    await ReminderService.scheduleMultipleTaskReminders(schedulable);

    await registry.save(schedulable.map((t) => String(t.id)));
  };
}

/**
 * Cancels the virtual reminder for a specific occurrence and removes it
 * from the registry. Call this when a virtual task is materialized.
 */
export async function cancelVirtualReminder(
  registry: IReminderRegistryRepository,
  virtualTaskId: string
): Promise<void> {
  await ReminderService.cancelTaskReminders(virtualTaskId);

  const scheduledIds = await registry.load();
  const updated = scheduledIds.filter((id) => id !== virtualTaskId);
  await registry.save(updated);
}
