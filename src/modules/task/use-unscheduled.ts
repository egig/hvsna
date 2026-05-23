import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { usePendingTasks } from "./use-pending-tasks";

export function useUnscheduled() {
  const {
    getToday,
    formatDate,
    initiated: hijriCalInititated,
  } = useHijriDate();

  const today = getToday();
  const gregorianDate = today.toDate();

  const pendingTasksQuery = usePendingTasks();

  const inboxTasks = (pendingTasksQuery.data ?? []).filter(
    (t) => !t.atEpochMillis
  );

  const pageTitle = "Unscheduled";
  const subTitle = formatDate(today, "full");

  return {
    inboxTasks,
    initiated: !pendingTasksQuery.isPending && hijriCalInititated,
    error: pendingTasksQuery.error
      ? pendingTasksQuery.error instanceof Error
        ? pendingTasksQuery.error.message
        : "Unknown error"
      : null,
    pageTitle,
    subTitle,
    gregorianDate,
    refetch: pendingTasksQuery.refetch,
  };
}
