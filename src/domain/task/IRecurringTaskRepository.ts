import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskUpdateInput,
  RecurringTaskQuery,
} from "../../modules/task/recurring-task";

export interface IRecurringTaskRepository {
  // CRUD operations
  create(input: RecurringTaskCreateInput): Promise<RecurringTask>;
  update(id: string, input: RecurringTaskUpdateInput): Promise<RecurringTask>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<RecurringTask | null>;
  find(query?: RecurringTaskQuery): Promise<RecurringTask[]>;
}
