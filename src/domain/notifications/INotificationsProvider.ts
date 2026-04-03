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

export interface NotificationPermissionResult {
  state: "granted" | "denied" | "prompt" | "unknown";
  canRequest: boolean;
  message?: string;
  canScheduleExact?: boolean;
}

export interface INotificationsProvider {
  checkPermissions(): Promise<NotificationPermissionResult>;
  requestPermissions(): Promise<NotificationPermissionResult>;
  scheduleTaskReminder(options: TaskReminderOptions): Promise<ReminderResult>;
  cancelTaskReminder(taskId: string): Promise<void>;
  updateTaskReminder(taskId: string, options: TaskReminderOptions): Promise<void>;
}
