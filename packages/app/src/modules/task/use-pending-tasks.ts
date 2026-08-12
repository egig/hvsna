import { useQuery } from "@tanstack/react-query";
import { useTaskRepository } from "./use-task-repository";
import { queryKeys } from "../query-keys";

export const PENDING_TASKS_LIMIT = 1000;

export function usePendingTasks() {
  const taskRepo = useTaskRepository();

  return useQuery({
    queryKey: queryKeys.pendingTasks(),
    queryFn: () => taskRepo.findAllPending(PENDING_TASKS_LIMIT),
    staleTime: 1000 * 60 * 2,
  });
}
