import {
  LocalNotifications,
  type PermissionStatus,
} from "@capacitor/local-notifications";
import type {
  INotificationsProvider,
  TaskReminderOptions,
  ReminderResult,
  NotificationPermissionResult,
} from "../../domain/notifications/INotificationsProvider";
import type { PermissionState } from "../../domain/permissions/IPermissionsProvider";

export class CapacitorNotificationsProvider implements INotificationsProvider {
  async checkPermissions(): Promise<NotificationPermissionResult> {
    try {
      const permissionStatus: PermissionStatus =
        await LocalNotifications.checkPermissions();
      return {
        state: this.mapCapacitorPermissionState(permissionStatus.display),
        canRequest: permissionStatus.display !== "denied",
      };
    } catch (error) {
      return {
        state: "unknown",
        canRequest: true,
        message:
          error instanceof Error
            ? error.message
            : "Unknown error checking permissions",
      };
    }
  }

  async requestPermissions(): Promise<NotificationPermissionResult> {
    try {
      const permissionStatus: PermissionStatus =
        await LocalNotifications.requestPermissions();
      const state = this.mapCapacitorPermissionState(permissionStatus.display);

      return {
        state,
        canRequest: state !== "denied",
        message: this.getPermissionMessage(state),
      };
    } catch (error) {
      return {
        state: "denied",
        canRequest: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to request notification permission",
      };
    }
  }

  async scheduleTaskReminder(
    options: TaskReminderOptions,
  ): Promise<ReminderResult> {
    try {
      const scheduledTime = this.calculateReminderTime(options);
      const notificationId = this.generateNotificationId(options);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(notificationId),
            title: this.getNotificationTitle(options),
            body: this.getNotificationBody(options),
            schedule: { at: new Date(scheduledTime) },
            sound: "default",
            smallIcon: "ic_stat_icon_config_sample",
            iconColor: "#488AFF",
            extra: {
              taskId: options.taskId,
              type: options.type,
            },
          },
        ],
      });

      return { notifications: [notificationId] };
    } catch (error) {
      return {
        notifications: [],
        error:
          error instanceof Error
            ? error.message
            : "Failed to schedule notification",
      };
    }
  }

  async cancelTaskReminder(taskId: string): Promise<void> {
    try {
      // Find and cancel all notifications for this task
      const pending = await LocalNotifications.getPending();
      const taskNotifications = pending.notifications.filter(
        (notification) => notification.extra?.taskId === taskId,
      );

      if (taskNotifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: taskNotifications.map((n) => ({ id: n.id })),
        });
      }
    } catch (error) {
      console.error("Failed to cancel task reminder:", error);
    }
  }

  async updateTaskReminder(
    taskId: string,
    options: TaskReminderOptions,
  ): Promise<void> {
    // Cancel existing reminders for this task
    await this.cancelTaskReminder(taskId);
    // Schedule new reminder
    await this.scheduleTaskReminder(options);
  }

  private calculateReminderTime(options: TaskReminderOptions): number {
    const { scheduledTime, reminderMinutes, type } = options;

    switch (type) {
      case "pre-due":
        return scheduledTime - reminderMinutes * 60 * 1000;
      case "due":
        return scheduledTime;
      case "overdue":
        return scheduledTime + 30 * 60 * 1000; // 30 minutes after due
      default:
        return scheduledTime;
    }
  }

  private generateNotificationId(options: TaskReminderOptions): string {
    return `${options.type}_${options.taskId}_${Date.now()}`;
  }

  private getNotificationTitle(options: TaskReminderOptions): string {
    switch (options.type) {
      case "pre-due":
        return `Task Reminder: ${options.taskName}`;
      case "due":
        return `Task Due Now: ${options.taskName}`;
      case "overdue":
        return `Task Overdue: ${options.taskName}`;
      default:
        return `Task: ${options.taskName}`;
    }
  }

  private getNotificationBody(options: TaskReminderOptions): string {
    switch (options.type) {
      case "pre-due":
        return `Your task "${options.taskName}" is due in ${options.reminderMinutes} minutes.`;
      case "due":
        return `Your task "${options.taskName}" is due now.`;
      case "overdue":
        return `Your task "${options.taskName}" was due 30 minutes ago.`;
      default:
        return `Task: ${options.taskName}`;
    }
  }

  private mapCapacitorPermissionState(state: string): PermissionState {
    switch (state) {
      case "granted":
        return "granted";
      case "denied":
        return "denied";
      case "prompt":
        return "prompt";
      default:
        return "unknown";
    }
  }

  private getPermissionMessage(state: PermissionState): string {
    switch (state) {
      case "granted":
        return "Notification permission granted";
      case "denied":
        return "Notification permission denied. Please enable in device settings.";
      case "prompt":
        return "Notification permission required";
      default:
        return "Permission status unknown";
    }
  }
}
