import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskUpdateInput,
  RecurringTaskQuery,
} from "../../modules/task/recurring-task";
import type { IRecurringTaskRepository } from "../../domain/task/IRecurringTaskRepository";
import dayjs from "dayjs";

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

  async addOccurrenceException(id: string, epoch: number): Promise<void> {
    const rtask = await this.recurringTaskRepository.findById(id);
    if (!rtask) return;
    const dateStr = dayjs(epoch).format("YYYYMMDD");
    // Prune entries older than 60 days — the generator's overdue lookback window
    // is 60 days, so anything older is never checked and just grows the document.
    const cutoff = dayjs().subtract(60, "day").format("YYYYMMDD");
    const next = [
      ...new Set([
        ...(rtask.occurrenceExceptions ?? []).filter((d) => d >= cutoff),
        dateStr,
      ]),
    ];
    await this.recurringTaskRepository.update(id, { occurrenceExceptions: next });
  }
}
