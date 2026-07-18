import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskQuery,
} from "@/domain/task";

export interface ITaskRepository {
  // Task operations
  create(input: TaskCreateInput): Promise<Task>;
  update(id: string | number, input: TaskUpdateInput): Promise<Task>;
  delete(id: string | number): Promise<void>;
  findById(id: string | number): Promise<Task | null>;
  find(query?: TaskQuery): Promise<Task[]>;

  // Task query operations
  findByDate(date: string): Promise<Task[]>;
  findByHijriDate(hijriDate: string): Promise<Task[]>;
  findWithPagination(offset: number, limit?: number): Promise<Task[]>;
  findTasksBefore(beforeEpoch: number): Promise<Task[]>;
  findTodayCompletedTasks(
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]>;
  findTasksAfter(fromEpoch: number): Promise<Task[]>;
  findAllPending(limit: number): Promise<Task[]>;
  findAllCompleted(offset: number, limit: number): Promise<Task[]>;
  findPendingInRange(startEpoch: number, endEpoch: number): Promise<Task[]>;
  findBrowsedTasks(
    query?: TaskQuery,
    offset?: number,
    limit?: number
  ): Promise<Task[]>;
  findUnscheduledTasks(): Promise<Task[]>;

  // Recurring task operations
  findByRecurringTaskId(recurringTaskId: string | number): Promise<Task[]>;
  findByRecurringTaskIdInRange(
    recurringTaskId: string | number,
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]>;
  deletePendingByRecurringTaskId(recurringTaskId: string | number): Promise<void>;

  // Task status operations
  completeTask(id: string | number): Promise<Task>;
  reopenTask(id: string | number): Promise<Task>;
}
