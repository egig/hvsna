import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";

export function useInvalidateTaskQueries() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.todayVirtualTasks() });
    queryClient.invalidateQueries({ queryKey: queryKeys.virtualTasks() });
    queryClient.invalidateQueries({ queryKey: queryKeys.pendingTasks() });
    queryClient.invalidateQueries({ queryKey: queryKeys.completedTasks() });
    // Match every ["today-completed-tasks", <dateString>] entry regardless of
    // how the date key is formatted by the caller (prefix match).
    queryClient.invalidateQueries({ queryKey: ["today-completed-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["today-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["pending-tasks-range"] });
    queryClient.invalidateQueries({ queryKey: ["search-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["browsed-tasks"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.recurringTaskList() });
    queryClient.invalidateQueries({ queryKey: queryKeys.tags() });
  };
}
