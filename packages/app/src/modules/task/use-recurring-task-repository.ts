import type { IRecurringTaskRepository } from "@/domain/task/IRecurringTaskRepository";
import { useRepositories } from "../repositories-context";

export function useRecurringTaskRepository(): IRecurringTaskRepository {
  return useRepositories().recurringTaskRepository;
}
