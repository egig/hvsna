import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskQuery,
  TaskStatus,
} from "@/domain/task";
import type {
  INotificationsProvider,
  TaskReminderOptions,
} from "../../domain/notifications/INotificationsProvider";
import type { ITaskRepository } from "../../domain/task/ITaskRepository";
import type { HijriDate } from "src/modules/calendar/hijri";

export class TaskUseCases {
  constructor(
    private readonly notificationsProvider: INotificationsProvider,
    private readonly taskRepository: ITaskRepository
  ) {}

  // Task operations
  async createTask(input: TaskCreateInput): Promise<Task> {
    const task = await this.taskRepository.create(input);

    if (task.atEpochMillis && task.status === 0) {
      await this.scheduleTaskReminders(task);
    }

    return task;
  }

  async updateTask(taskId: string, updates: TaskUpdateInput): Promise<Task> {
    const updatedTask = await this.taskRepository.update(taskId, updates);

    if (updatedTask.atEpochMillis && updatedTask.status === 0) {
      await this.updateTaskReminders(updatedTask);
    } else {
      await this.cancelTaskReminders(taskId);
    }

    return updatedTask;
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.cancelTaskReminders(taskId);
    await this.taskRepository.delete(taskId);
  }

  async deletePendingByRecurringTaskId(recurringTaskId: string): Promise<void> {
    await this.taskRepository.deletePendingByRecurringTaskId(recurringTaskId);
  }

  async completeTask(taskId: string): Promise<Task> {
    const updatedTask = await this.taskRepository.completeTask(taskId);
    await this.cancelTaskReminders(taskId);
    return updatedTask;
  }

  async uncompleteTask(taskId: string): Promise<Task> {
    const updatedTask = await this.taskRepository.reopenTask(taskId);

    if (updatedTask.atEpochMillis) {
      await this.scheduleTaskReminders(updatedTask);
    }

    return updatedTask;
  }

  // Reminder operations
  async scheduleTaskReminders(
    task: Task,
    reminderMinutes: number = 15
  ): Promise<void> {
    if (!task.atEpochMillis || task.status === 1 || !task.id) {
      return;
    }

    try {
      if (reminderMinutes > 0) {
        const preDueOptions: TaskReminderOptions = {
          taskId: task.id,
          taskName: task.name || "Untitled Task",
          scheduledTime: task.atEpochMillis,
          reminderMinutes,
          type: "pre-due",
        };

        await this.notificationsProvider.scheduleTaskReminder(preDueOptions);
      }

      const dueOptions: TaskReminderOptions = {
        taskId: task.id,
        taskName: task.name || "Untitled Task",
        scheduledTime: task.atEpochMillis,
        reminderMinutes: 0,
        type: "due",
      };

      await this.notificationsProvider.scheduleTaskReminder(dueOptions);

      const overdueOptions: TaskReminderOptions = {
        taskId: task.id,
        taskName: task.name || "Untitled Task",
        scheduledTime: task.atEpochMillis,
        reminderMinutes: 0,
        type: "overdue",
      };

      await this.notificationsProvider.scheduleTaskReminder(overdueOptions);
    } catch (error) {
      console.error("Failed to schedule task reminders:", error);
    }
  }

  async updateTaskReminders(
    task: Task,
    reminderMinutes: number = 15
  ): Promise<void> {
    if (!task.id) return;
    await this.cancelTaskReminders(task.id);
    await this.scheduleTaskReminders(task, reminderMinutes);
  }

  async cancelTaskReminders(taskId: string): Promise<void> {
    try {
      await this.notificationsProvider.cancelTaskReminder(taskId);
    } catch (error) {
      console.error("Failed to cancel task reminders:", error);
    }
  }

  async scheduleMultipleTaskReminders(
    tasks: Task[],
    reminderMinutes: number = 15
  ): Promise<void> {
    const promises = tasks
      .filter((task) => task.atEpochMillis && task.status === 0)
      .map((task) => this.scheduleTaskReminders(task, reminderMinutes));

    await Promise.allSettled(promises);
  }

  async completeMultipleTasks(taskIds: string[]): Promise<Task[]> {
    return Promise.all(taskIds.map((taskId) => this.completeTask(taskId)));
  }

  async deleteMultipleTasks(taskIds: string[]): Promise<void> {
    await Promise.all(taskIds.map((taskId) => this.deleteTask(taskId)));
  }

  // Query helpers
  async getAllPendingTasks(): Promise<Task[]> {
    return await this.taskRepository.findAllPending(1000);
  }

  async getPendingTasksInRange(
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]> {
    return await this.taskRepository.findPendingInRange(startEpoch, endEpoch);
  }

  async getTasks(query: TaskQuery = {}): Promise<Task[]> {
    return await this.taskRepository.findBrowsedTasks(query);
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    return await this.taskRepository.findById(taskId);
  }

  async searchTasks(searchText: string): Promise<Task[]> {
    return await this.getTasks({ searchText });
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return await this.getTasks({ status });
  }

  async getTasksByDate(hijriDate: string): Promise<Task[]> {
    return await this.taskRepository.findByHijriDate(hijriDate);
  }

  async getOverdueTasks(): Promise<Task[]> {
    const now = Date.now();
    return await this.taskRepository.find({
      status: 0,
      atEpochMillis: { $lte: now },
    });
  }

  async getUpcomingTasks(fromDate: HijriDate): Promise<Task[]> {
    return await this.taskRepository.findTasksAfter(fromDate);
  }

  async getTodayTasks(todayHijriDate: HijriDate): Promise<Task[]> {
    return await this.taskRepository.findTasksBefore(todayHijriDate);
  }

  async findTodayCompletedTasks(todayHijriDate: HijriDate): Promise<Task[]> {
    return await this.taskRepository.findTodayCompletedTasks(todayHijriDate);
  }
}
