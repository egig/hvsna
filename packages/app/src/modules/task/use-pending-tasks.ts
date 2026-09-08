import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTaskRepository } from "./use-task-repository";
import { queryKeys } from "../query-keys";
import { useCompletionGrace } from "./completion-grace-context";

export const PENDING_TASKS_LIMIT = 1000;

export function usePendingTasks() {
  const taskRepo = useTaskRepository();
  const { retain, snapshot } = useCompletionGrace();

  const query = useQuery({
    queryKey: queryKeys.pendingTasks(),
    queryFn: () => taskRepo.findAllPending(PENDING_TASKS_LIMIT),
    staleTime: 1000 * 60 * 2,
  });

  const data = useMemo(
    () => (query.data ? retain(query.data) : query.data),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.data, snapshot]
  );

  return { ...query, data };
}
