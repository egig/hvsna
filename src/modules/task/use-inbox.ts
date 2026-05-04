import { useQuery } from "@tanstack/react-query";
import { useDateTranslationHelper } from "../calendar/use-date-translation-helper";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";
import type { Task } from "../task/types";

export function useInbox() {
  const { dayNames, hijriMonthNames, gregorianMonthNames } =
    useDateTranslationHelper();
  const {
    getToday,
    formatDate,
    initiated: hijriCalInititated,
  } = useHijriDate();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  const today = getToday();
  const gregorianDate = today.toDate();

  // Query for inbox tasks - tasks with no schedule (noDate=1) and no listId
  const inboxTasksQuery = useQuery({
    queryKey: queryKeys.unscheduledTasks(),
    queryFn: () => taskUseCases.getUnscheduledTasks(),
    enabled: hijriCalInititated,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const pageTitle = "Unscheduled";
  const subTitle = formatDate(today, "full");

  // Combine loading states
  const isLoading = inboxTasksQuery.isPending;
  const error = inboxTasksQuery.error;

  return {
    inboxTasks: inboxTasksQuery.data || [],
    initiated: !isLoading && hijriCalInititated,
    error: error
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : null,
    pageTitle,
    subTitle,
    gregorianDate,
    refetch: inboxTasksQuery.refetch,
  };
}
