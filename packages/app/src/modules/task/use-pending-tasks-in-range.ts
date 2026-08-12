import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTaskRepository } from "./use-task-repository";

export function usePendingTasksInRange(startEpoch: number, endEpoch: number) {
  const taskRepo = useTaskRepository();

  return useQuery({
    queryKey: ["pending-tasks-range", startEpoch, endEpoch],
    queryFn: () => taskRepo.findPendingInRange(startEpoch, endEpoch),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}
