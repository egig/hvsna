import type {
  TaskCreateInput,
  TaskUpdateInput,
  TaskQuery,
  TaskStatus,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectQuery,
} from "../../modules/task/types";
import { Task, Project } from "../../modules/task/types";
import type {
  INotificationsProvider,
  TaskReminderOptions,
} from "../../domain/notifications/INotificationsProvider";
import type {
  ITaskRepository,
  IProjectRepository,
} from "../../domain/task/ITaskRepository";
import type { HijriDate } from "src/modules/calendar/hijri";

export class TaskUseCases {
  constructor(
    private readonly notificationsProvider: INotificationsProvider,
    private readonly taskRepository: ITaskRepository,
    private readonly projectRepository: IProjectRepository
  ) {}

  // Task operations
  async createTask(input: TaskCreateInput): Promise<Task> {
    const task = await this.taskRepository.create(input);

    // Schedule reminders if task has a time and is pending
    if (task.atEpochMillis && task.status === 0) {
      await this.scheduleTaskReminders(task);
    }

    return task;
  }

  async updateTask(taskId: string, updates: TaskUpdateInput): Promise<Task> {
    const updatedTask = await this.taskRepository.update(taskId, updates);

    // Update reminders if task has time and is pending
    if (updatedTask.atEpochMillis && updatedTask.status === 0) {
      await this.updateTaskReminders(updatedTask);
    } else {
      // Cancel reminders if task no longer has time or is completed
      await this.cancelTaskReminders(taskId);
    }

    return updatedTask;
  }

  async deleteTask(taskId: string): Promise<void> {
    // Cancel reminders before deleting
    await this.cancelTaskReminders(taskId);

    // Delete the task from repository
    await this.taskRepository.delete(taskId);
  }

  async deletePendingByRecurringTaskId(recurringTaskId: string): Promise<void> {
    await this.taskRepository.deletePendingByRecurringTaskId(recurringTaskId);
  }

  async completeTask(taskId: string): Promise<Task> {
    // Mark task as completed using repository method
    const updatedTask = await this.taskRepository.completeTask(taskId);

    // Cancel reminders for completed tasks
    await this.cancelTaskReminders(taskId);

    return updatedTask;
  }

  async uncompleteTask(taskId: string): Promise<Task> {
    // Mark task as pending again using repository method
    const updatedTask = await this.taskRepository.reopenTask(taskId);

    // Reschedule reminders if task has time
    if (updatedTask.atEpochMillis) {
      await this.scheduleTaskReminders(updatedTask);
    }

    return updatedTask;
  }

  // Project operations
  async createProject(input: ProjectCreateInput): Promise<Project> {
    return await this.projectRepository.create(input);
  }

  async updateProject(projectId: string, updates: ProjectUpdateInput): Promise<Project> {
    return await this.projectRepository.update(projectId, updates);
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.projectRepository.delete(projectId);
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
      // Schedule pre-due reminder
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

      // Schedule due time reminder
      const dueOptions: TaskReminderOptions = {
        taskId: task.id,
        taskName: task.name || "Untitled Task",
        scheduledTime: task.atEpochMillis,
        reminderMinutes: 0,
        type: "due",
      };

      await this.notificationsProvider.scheduleTaskReminder(dueOptions);

      // Schedule overdue reminder (30 minutes after due)
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

    // Cancel existing reminders
    await this.cancelTaskReminders(task.id);

    // Schedule new reminders
    await this.scheduleTaskReminders(task, reminderMinutes);
  }

  async cancelTaskReminders(taskId: string): Promise<void> {
    try {
      await this.notificationsProvider.cancelTaskReminder(taskId);
    } catch (error) {
      console.error("Failed to cancel task reminders:", error);
    }
  }

  // Batch operations
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
    const promises = taskIds.map((taskId) => this.completeTask(taskId));
    return Promise.all(promises);
  }

  async deleteMultipleTasks(taskIds: string[]): Promise<void> {
    const promises = taskIds.map((taskId) => this.deleteTask(taskId));
    await Promise.all(promises);
  }

  // Utility methods
  private calculateEpochMillis(hijriDate: string, time: string): number {
    // This would use the HijriDate utilities to convert to epoch milliseconds
    // Placeholder implementation
    const [year, month, day] = hijriDate.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);

    // This is a simplified calculation - would need proper Hijri to Gregorian conversion
    const date = new Date();
    date.setFullYear(year, month - 1, day);
    date.setHours(hours, minutes, 0, 0);

    return date.getTime();
  }

  // Query helpers
  async getTasks(query: TaskQuery = {}): Promise<Task[]> {
    return await this.taskRepository.findBrowsedTasks(query);
  }

  async getTaskById(taskId: string): Promise<Task | null> {
    return await this.taskRepository.findById(taskId);
  }

  async getProjects(query: ProjectQuery = {}): Promise<Project[]> {
    return await this.projectRepository.find(query);
  }

  async getProjectById(projectId: string): Promise<Project | null> {
    return await this.projectRepository.findById(projectId);
  }

  async getTasksByProjectId(projectId: string): Promise<Task[]> {
    return await this.taskRepository.findTasksByProjectId(projectId);
  }

  // Search and filtering
  async searchTasks(searchText: string): Promise<Task[]> {
    return await this.getTasks({ searchText });
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return await this.getTasks({ status });
  }

  async getTasksByDate(hijriDate: string): Promise<Task[]> {
    return await this.taskRepository.findByHijriDate(hijriDate);
  }

  async getUnscheduledTasks(): Promise<Task[]> {
    return await this.taskRepository.findUnscheduledTasks();
  }

  async getOverdueTasks(): Promise<Task[]> {
    const now = Date.now();
    return await this.taskRepository.find({
      status: 0, // pending
      atEpochMillis: { $lte: now }, // overdue
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
