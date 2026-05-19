import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskQuery,
} from "@/domain/task";
import { HijriDate } from "../../modules/calendar/hijri";

export interface ITaskRepository {
  // Task operations
  create(input: TaskCreateInput): Promise<Task>;
  update(id: string, input: TaskUpdateInput): Promise<Task>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Task | null>;
  find(query?: TaskQuery): Promise<Task[]>;

  // Task query operations
  findByDate(date: string): Promise<Task[]>;
  findByHijriDate(hijriDate: string): Promise<Task[]>;
  findWithPagination(offset: number, limit?: number): Promise<Task[]>;
  findTasksBefore(beforeHijri: HijriDate): Promise<Task[]>;
  findTodayCompletedTasks(todayHijri: HijriDate): Promise<Task[]>;
  findTasksAfter(todayHijri: HijriDate): Promise<Task[]>;
  findAllPending(limit: number): Promise<Task[]>;
  findBrowsedTasks(
    query?: any,
    offset?: number,
    limit?: number
  ): Promise<Task[]>;
  findUnscheduledTasks(): Promise<Task[]>;

  // Recurring task operations
  findByRecurringTaskId(recurringTaskId: string): Promise<Task[]>;
  findByRecurringTaskIdInRange(
    recurringTaskId: string,
    startEpoch: number,
    endEpoch: number
  ): Promise<Task[]>;
  deletePendingByRecurringTaskId(recurringTaskId: string): Promise<void>;

  // Task status operations
  completeTask(id: string): Promise<Task>;
  reopenTask(id: string): Promise<Task>;
}
