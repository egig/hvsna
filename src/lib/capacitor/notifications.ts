import { Capacitor } from "@capacitor/core";
import {
  LocalNotifications,
  type PermissionStatus,
} from "@capacitor/local-notifications";
import {
  CapacitorPermissionManager,
  type PermissionResult,
  type PermissionState,
} from "./permissions";

export interface TaskReminderOptions {
  taskId: string;
  taskName: string;
  scheduledTime: number; // atEpochMillis
  reminderMinutes: number;
  type: "pre-due" | "due" | "overdue";
}

export interface ReminderResult {
  notifications: string[];
  error?: string;
}

export interface NotificationPermissionResult extends PermissionResult {
  canScheduleExact?: boolean;
}

/**
 * Capacitor notifications service with browser fallback
 */
export class CapacitorNotifications {
  /**
   * Check if running on native platform
   */
  static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Check notification permissions
   */
  static async checkPermissions(): Promise<NotificationPermissionResult> {
    if (!this.isNativePlatform()) {
      // For web platforms, check browser notification permissions
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

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<NotificationPermissionResult> {
    if (!this.isNativePlatform()) {
      // For web platforms, request browser notification permission
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

  /**
   * Schedule a task reminder notification
   */
  static async scheduleTaskReminder(
    options: TaskReminderOptions,
  ): Promise<ReminderResult> {
    if (!this.isNativePlatform()) {
      return this.schedulePWAReminder(options);
    }

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

  /**
   * Cancel task reminder notifications
   */
  static async cancelTaskReminder(taskId: string): Promise<void> {
    if (!this.isNativePlatform()) {
      return this.cancelPWAReminder(taskId);
    }

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

  /**
   * Update task reminder notifications
   */
  static async updateTaskReminder(
    taskId: string,
    options: TaskReminderOptions,
  ): Promise<void> {
    // Cancel existing reminders for this task
    await this.cancelTaskReminder(taskId);
    // Schedule new reminder
    await this.scheduleTaskReminder(options);
  }

  /**
   * Schedule PWA notification (browser fallback)
   */
  private static async schedulePWAReminder(
    options: TaskReminderOptions,
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

  /**
   * Cancel PWA notification
   */
  private static async cancelPWAReminder(taskId: string): Promise<void> {
    try {
      const reminders = JSON.parse(
        localStorage.getItem("taskReminders") || "[]",
      );
      const filteredReminders = reminders.filter(
        (reminder: any) => reminder.taskId !== taskId,
      );
      localStorage.setItem("taskReminders", JSON.stringify(filteredReminders));
    } catch (error) {
      console.error("Failed to cancel PWA reminder:", error);
    }
  }

  /**
   * Calculate reminder time based on task scheduled time and reminder minutes
   */
  private static calculateReminderTime(options: TaskReminderOptions): number {
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

  /**
   * Generate unique notification ID
   */
  private static generateNotificationId(options: TaskReminderOptions): string {
    return `${options.type}_${options.taskId}_${Date.now()}`;
  }

  /**
   * Get notification title based on type
   */
  private static getNotificationTitle(options: TaskReminderOptions): string {
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

  /**
   * Get notification body based on type and timing
   */
  private static getNotificationBody(options: TaskReminderOptions): string {
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

  /**
   * Map Capacitor permission state to our PermissionState
   */
  private static mapCapacitorPermissionState(state: string): PermissionState {
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

  /**
   * Map browser permission state to our PermissionState
   */
  private static mapBrowserPermissionState(state: string): PermissionState {
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

  /**
   * Get user-friendly permission message
   */
  private static getPermissionMessage(state: PermissionState): string {
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
