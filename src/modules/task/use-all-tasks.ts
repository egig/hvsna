import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";

export function useAllTasks() {
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  return useQuery({
    queryKey: queryKeys.allTasks(),
    queryFn: () => taskUseCases.getTasks(),
    staleTime: 1000 * 60 * 5,
  });
}
