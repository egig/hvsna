import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskUpdateInput,
  RecurringTaskQuery,
} from "../../modules/task/recurring-task";

export interface IRecurringTaskRepository {
  // CRUD operations
  create(input: RecurringTaskCreateInput): Promise<RecurringTask>;
  update(
    id: string | number,
    input: RecurringTaskUpdateInput
  ): Promise<RecurringTask>;
  delete(id: string | number): Promise<void>;
  findById(id: string | number): Promise<RecurringTask | null>;
  find(query?: RecurringTaskQuery): Promise<RecurringTask[]>;
}
