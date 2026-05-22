import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../query-keys";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";

export function useInvalidateTaskQueries() {
  const queryClient = useQueryClient();
  const { getToday } = useHijriDate();

  return () => {
    const today = getToday();
    const todayString = today.toString();
    queryClient.invalidateQueries({ queryKey: queryKeys.todayVirtualTasks() });
    queryClient.invalidateQueries({ queryKey: queryKeys.virtualTasks() });
    queryClient.invalidateQueries({ queryKey: queryKeys.pendingTasks() });
    queryClient.invalidateQueries({ queryKey: queryKeys.completedTasks() });
    queryClient.invalidateQueries({
      queryKey: queryKeys.todayCompletedTasks(todayString),
    });
    queryClient.invalidateQueries({ queryKey: ["browsed-tasks"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.recurringTaskList() });
  };
}
