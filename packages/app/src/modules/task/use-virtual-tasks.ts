import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useRecurringTaskRepository } from "./use-recurring-task-repository";
import { useRecurringOccurance } from "./recurring-task-generator";

export function useVirtualTasks(startEpoch: number, endEpoch: number) {
  const recurringRepo = useRecurringTaskRepository();
  const { buildVirtualTasksForRange } = useRecurringOccurance();

  return useQuery({
    queryKey: ["virtual-tasks", startEpoch, endEpoch],
    queryFn: async () => {
      const templates = await recurringRepo.find();
      return await buildVirtualTasksForRange(templates, startEpoch, endEpoch);
    },
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}
