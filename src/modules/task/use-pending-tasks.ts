import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";

export const PENDING_TASKS_LIMIT = 1000;

export function usePendingTasks() {
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  return useQuery({
    queryKey: queryKeys.pendingTasks(),
    queryFn: () => taskUseCases.getAllPendingTasks(),
    staleTime: 1000 * 60 * 2,
  });
}
