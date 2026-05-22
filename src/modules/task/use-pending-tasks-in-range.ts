import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";

export function usePendingTasksInRange(startEpoch: number, endEpoch: number) {
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  return useQuery({
    queryKey: ["pending-tasks-range", startEpoch, endEpoch],
    queryFn: () => taskUseCases.getPendingTasksInRange(startEpoch, endEpoch),
    staleTime: 1000 * 60 * 2,
    placeholderData: keepPreviousData,
  });
}
