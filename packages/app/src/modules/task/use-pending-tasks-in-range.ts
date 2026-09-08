import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useTaskRepository } from "./use-task-repository";
import { useCompletionGrace } from "./completion-grace-context";

export function usePendingTasksInRange(startEpoch: number, endEpoch: number) {
  const taskRepo = useTaskRepository();
  const { retain, snapshot } = useCompletionGrace();

  const query = useQuery({
    queryKey: ["pending-tasks-range", startEpoch, endEpoch],
    queryFn: () => taskRepo.findPendingInRange(startEpoch, endEpoch),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });

  const data = useMemo(
    () => (query.data ? retain(query.data) : query.data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.data, snapshot]
  );

  return { ...query, data };
}
