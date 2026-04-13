import type {
  INotificationsProvider,
  TaskReminderOptions,
  ReminderResult,
  NotificationPermissionResult,
} from "../../domain/notifications/INotificationsProvider";
import type { PermissionState } from "../../domain/permissions/IPermissionsProvider";

export class BrowserNotificationsProvider implements INotificationsProvider {
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

    // PWA limitations: can't schedule exact future notifications
    // Store in localStorage for service worker to handle
    const scheduledTime = this.calculateReminderTime(options);
    const notificationId = this.generateNotificationId(options);

    const reminderData = {
      id: notificationId,
      taskId: options.taskId,
      taskName: options.taskName,
      scheduledTime,
      type: options.type,
      title: this.getNotificationTitle(options),
      body: this.getNotificationBody(options),
    };

    // Store for service worker processing
    const reminders = JSON.parse(localStorage.getItem("taskReminders") || "[]");
    reminders.push(reminderData);
    localStorage.setItem("taskReminders", JSON.stringify(reminders));

    return { notifications: [notificationId] };
  }

  async cancelTaskReminder(taskId: string): Promise<void> {
    try {
      const reminders = JSON.parse(
        localStorage.getItem("taskReminders") || "[]"
      );
      const filteredReminders = reminders.filter(
        (reminder: any) => reminder.taskId !== taskId
      );
      localStorage.setItem("taskReminders", JSON.stringify(filteredReminders));
    } catch (error) {
      console.error("Failed to cancel PWA reminder:", error);
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
