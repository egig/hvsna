import type { ITaskRepository } from "@/domain/task/ITaskRepository";
import { useRepositories } from "../repositories-context";

export function useTaskRepository(): ITaskRepository {
  return useRepositories().taskRepository;
}
