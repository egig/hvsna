import type {
  Task,
  TaskCreateInput,
  TaskUpdateInput,
  TaskQuery,
  TaskStatus,
  List,
  ListCreateInput,
  ListUpdateInput,
  ListQuery,
} from "../../modules/task/types";
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
  findBrowsedTasks(
    query?: any,
    offset?: number,
    limit?: number,
  ): Promise<Task[]>;
  findInboxTasks(): Promise<Task[]>;
  findTasksByListId(
    listId: string,
    offset?: number,
    limit?: number,
  ): Promise<Task[]>;

  // Task status operations
  completeTask(id: string): Promise<Task>;
  reopenTask(id: string): Promise<Task>;
}

export interface IListRepository {
  // List operations
  create(input: ListCreateInput): Promise<List>;
  update(id: string, input: ListUpdateInput): Promise<List>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<List | null>;
  find(query?: ListQuery): Promise<List[]>;
  findWithPagination(offset: number, limit?: number): Promise<List[]>;
}
