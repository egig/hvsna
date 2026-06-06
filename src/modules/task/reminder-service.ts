import { createNotificationsDriver } from "../../infra";
import type { TaskReminderOptions } from "../../domain/notifications/INotificationsProvider";
import { type Task as TaskType } from "@/domain/task";
import logger from "../logger";

export class ReminderService {
  /**
   * Default reminder minutes before due time
   */
  private static readonly DEFAULT_REMINDER_MINUTES = 15;

  private static get notificationsDriver() {
    return createNotificationsDriver();
  }

  /**
   * Schedule reminders for a task
   */
  static async scheduleTaskReminders(
    task: TaskType,
    reminderMinutes: number = this.DEFAULT_REMINDER_MINUTES
  ): Promise<void> {
    if (task.status === 1) {
      return;
    }

    if (!task.atEpochMillis) {
      return;
    }

    const ONE_HOUR_MS = 60 * 60 * 1000;
    if (task.atEpochMillis - Date.now() <= ONE_HOUR_MS) {
      return;
    }

    try {
      // Schedule pre-due reminder
      if (reminderMinutes > 0) {
        const preDueOptions: TaskReminderOptions = {
          taskId: task.id || "",
          taskName: task.name || "Untitled Task",
          scheduledTime: task.atEpochMillis,
          reminderMinutes,
          type: "pre-due",
        };

        await this.notificationsDriver.scheduleTaskReminder(preDueOptions);
      }
    } catch (error) {
      logger.error("Failed to schedule task reminders:", error);
    }
  }

  /**
   * Cancel all reminders for a task
   */
  static async cancelTaskReminders(taskId: string): Promise<void> {
    try {
      await this.notificationsDriver.cancelTaskReminder(taskId);
    } catch (error) {
      logger.error("Failed to cancel task reminders:", error);
    }
  }

  /**
   * Update reminders for a task (cancel existing and schedule new)
   */
  static async updateTaskReminders(
    task: TaskType,
    reminderMinutes: number = this.DEFAULT_REMINDER_MINUTES
  ): Promise<void> {
    if (!task.id) {
      return;
    }

    // Cancel existing reminders
    await this.cancelTaskReminders(task.id);

    // Schedule new reminders
    await this.scheduleTaskReminders(task, reminderMinutes);
  }

  /**
   * Schedule reminders for multiple tasks
   */
  static async scheduleMultipleTaskReminders(
    tasks: TaskType[],
    reminderMinutes: number = this.DEFAULT_REMINDER_MINUTES
  ): Promise<void> {
    const promises = tasks
      .filter((task) => task.atEpochMillis && task.status !== 1)
      .map((task) => this.scheduleTaskReminders(task, reminderMinutes));

    await Promise.allSettled(promises);
  }

  /**
   * Check if a task should have reminders scheduled
   */
  static shouldScheduleReminders(task: TaskType): boolean {
    return (
      !!task.id &&
      !!task.name &&
      !!task.atEpochMillis &&
      task.status !== 1 && // not completed
      task.atEpochMillis > Date.now() // future task
    );
  }
}
