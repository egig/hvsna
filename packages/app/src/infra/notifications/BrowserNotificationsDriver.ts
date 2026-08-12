import type {
  INotificationsDriver,
  TaskReminderOptions,
  ReminderResult,
  NotificationPermissionResult,
} from "../../domain/notifications/INotificationsProvider";
import type { PermissionState } from "../../domain/permissions/IPermissionsProvider";

export class BrowserNotificationsDriver implements INotificationsDriver {
  private pendingTimers = new Map<string, ReturnType<typeof setTimeout>[]>();

  async checkPermissions(): Promise<NotificationPermissionResult> {
    if ("Notification" in window) {
      try {
        const permission = Notification.permission;
        return {
          state: this.mapBrowserPermissionState(permission),
          canRequest: permission !== "denied",
        };
      } catch (error) {
        return {
          state: "unknown",
          canRequest: true,
          message: "Notification API not available",
        };
      }
    }
    return {
      state: "unknown",
      canRequest: false,
      message: "Notifications not supported on this platform",
    };
  }

  async requestPermissions(): Promise<NotificationPermissionResult> {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        const state = this.mapBrowserPermissionState(permission);
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
    return {
      state: "unknown",
      canRequest: false,
      message: "Notifications not supported on this platform",
    };
  }

  async scheduleTaskReminder(
    options: TaskReminderOptions
  ): Promise<ReminderResult> {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return {
        notifications: [],
        error: "Notifications not supported or permission not granted",
      };
    }

    const scheduledTime = this.calculateReminderTime(options);
    const notificationId = this.generateNotificationId(options);
    const delay = Math.max(0, scheduledTime - Date.now());
    const title = this.getNotificationTitle(options);
    const body = this.getNotificationBody(options);

    const timer = setTimeout(() => {
      new Notification(title, { body, icon: "/icon-192.png" });
      // Clean up timer reference after it fires
      const timers = this.pendingTimers.get(options.taskId) ?? [];
      this.pendingTimers.set(
        options.taskId,
        timers.filter((t) => t !== timer)
      );
    }, delay);

    const existing = this.pendingTimers.get(options.taskId) ?? [];
    this.pendingTimers.set(options.taskId, [...existing, timer]);

    return { notifications: [notificationId] };
  }

  async cancelTaskReminder(taskId: string): Promise<void> {
    const timers = this.pendingTimers.get(taskId);
    if (timers) {
      timers.forEach(clearTimeout);
      this.pendingTimers.delete(taskId);
    }
  }

  async updateTaskReminder(
    taskId: string,
    options: TaskReminderOptions
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

  private mapBrowserPermissionState(state: string): PermissionState {
    switch (state) {
      case "granted":
        return "granted";
      case "denied":
        return "denied";
      case "default":
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
