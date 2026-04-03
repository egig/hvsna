import {
  createNotificationsProvider,
} from "../../infra";
import type { TaskReminderOptions } from "../../domain/notifications/INotificationsProvider";
import { taskRepository } from "./task-repository";
import { Task, type Task as TaskType } from "./types";
import logger from "../../lib/logger";

export class ReminderService {
  /**
   * Default reminder minutes before due time
   */
  private static readonly DEFAULT_REMINDER_MINUTES = 15;
  
  private static get notificationsProvider() {
    return createNotificationsProvider();
  }

  /**
   * Schedule reminders for a task
   */
  static async scheduleTaskReminders(
    task: TaskType,
    reminderMinutes: number = this.DEFAULT_REMINDER_MINUTES,
  ): Promise<void> {
    // Only schedule if task has a scheduled time and is not completed
    if (!task.atEpochMillis || task.status === 1) {
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

        await this.notificationsProvider.scheduleTaskReminder(preDueOptions);
      }

      // Schedule due time reminder
      const dueOptions: TaskReminderOptions = {
        taskId: task.id || "",
        taskName: task.name || "Untitled Task",
        scheduledTime: task.atEpochMillis,
        reminderMinutes: 0,
        type: "due",
      };

      await this.notificationsProvider.scheduleTaskReminder(dueOptions);

      // Schedule overdue reminder (30 minutes after due)
      const overdueOptions: TaskReminderOptions = {
        taskId: task.id || "",
        taskName: task.name || "Untitled Task",
        scheduledTime: task.atEpochMillis,
        reminderMinutes: 0,
        type: "overdue",
      };

      await this.notificationsProvider.scheduleTaskReminder(overdueOptions);
    } catch (error) {
      logger.error("Failed to schedule task reminders:", error);
    }
  }

  /**
   * Cancel all reminders for a task
   */
  static async cancelTaskReminders(taskId: string): Promise<void> {
    try {
      await this.notificationsProvider.cancelTaskReminder(taskId);
    } catch (error) {
      logger.error("Failed to cancel task reminders:", error);
    }
  }

  /**
   * Update reminders for a task (cancel existing and schedule new)
   */
  static async updateTaskReminders(
    task: TaskType,
    reminderMinutes: number = this.DEFAULT_REMINDER_MINUTES,
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
    reminderMinutes: number = this.DEFAULT_REMINDER_MINUTES,
  ): Promise<void> {
    const promises = tasks
      .filter((task) => task.atEpochMillis && task.status !== 1)
      .map((task) => this.scheduleTaskReminders(task, reminderMinutes));

    await Promise.allSettled(promises);
  }

  /**
   * Get tasks that need reminders scheduled
   */
  static async getTasksNeedingReminders(): Promise<TaskType[]> {
    try {
      // Get all pending tasks with scheduled times
      const now = Date.now();
      const tasks = await taskRepository.find({
        status: 0, // pending
        atEpochMillis: { $gte: now }, // only future or current tasks
      });

      return tasks.filter((task) => task.atEpochMillis && task.status !== 1);
    } catch (error) {
      logger.error("Failed to get tasks needing reminders:", error);
      return [];
    }
  }

  /**
   * Reschedule all pending task reminders (useful for app startup)
   */
  static async rescheduleAllPendingReminders(
    reminderMinutes: number = this.DEFAULT_REMINDER_MINUTES,
  ): Promise<void> {
    try {
      const tasks = await this.getTasksNeedingReminders();
      await this.scheduleMultipleTaskReminders(tasks, reminderMinutes);
    } catch (error) {
      logger.error("Failed to reschedule all pending reminders:", error);
    }
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

  /**
   * Get reminder settings from task attributes
   */
  static getReminderMinutesFromTask(task: TaskType): number {
    if (task.attributes?.reminderMinutes) {
      const minutes = parseInt(task.attributes.reminderMinutes, 10);
      return isNaN(minutes) ? this.DEFAULT_REMINDER_MINUTES : minutes;
    }
    return this.DEFAULT_REMINDER_MINUTES;
  }

  /**
   * Set reminder minutes in task attributes
   */
  static setReminderMinutesInTask(task: TaskType, minutes: number): TaskType {
    const updatedTask = Object.assign(new Task({}), task, {
      attributes: {
        ...task.attributes,
        reminderMinutes: minutes.toString(),
      },
    });
    return updatedTask;
  }
}
