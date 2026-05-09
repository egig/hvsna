import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskUpdateInput,
  RecurringTaskQuery,
} from "../../modules/task/recurring-task";
import type { IRecurringTaskRepository } from "../../domain/task/IRecurringTaskRepository";

export class RecurringTaskUseCases {
  constructor(
    private readonly recurringTaskRepository: IRecurringTaskRepository
  ) {}

  async createRecurringTask(
    input: RecurringTaskCreateInput
  ): Promise<RecurringTask> {
    return await this.recurringTaskRepository.create(input);
  }

  async updateRecurringTask(
    id: string,
    input: RecurringTaskUpdateInput
  ): Promise<RecurringTask> {
    return await this.recurringTaskRepository.update(id, input);
  }

  async deleteRecurringTask(id: string): Promise<void> {
    await this.recurringTaskRepository.delete(id);
  }

  async getRecurringTask(id: string): Promise<RecurringTask | null> {
    return await this.recurringTaskRepository.findById(id);
  }

  async getRecurringTasks(
    query?: RecurringTaskQuery
  ): Promise<RecurringTask[]> {
    return await this.recurringTaskRepository.find(query);
  }
}
