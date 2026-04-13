import { useQuery } from "@tanstack/react-query";
import { useDateTranslationHelper } from "../calendar/use-date-translation-helper";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";

export function useToday() {
  const { dayNames, hijriMonthNames, gregorianMonthNames } =
    useDateTranslationHelper();
  const { getToday, initiated: hijriCalInititated } = useHijriDate();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  const today = getToday();
  const gregorianDate = today.toDate();
  const todayString = today.toString(); // Use HijriDate string representation for query key

  const todayTasksQuery = useQuery({
    queryKey: queryKeys.todayTasks(todayString),
    queryFn: () => taskUseCases.getTodayTasks(today.endOfDay()),
    enabled: hijriCalInititated,
  });

  // React Query for today's completed tasks
  const todayCompletedTasksQuery = useQuery({
    queryKey: queryKeys.todayCompletedTasks(todayString),
    queryFn: () => taskUseCases.findTodayCompletedTasks(today),
    enabled: hijriCalInititated,
  });

  const pageTitle = `${dayNames[today.dayOfWeek]}, ${today.day} ${
    hijriMonthNames[today.month - 1]
  } ${today.year}`;
  const subTitle = `${gregorianDate.getDate()} ${
    gregorianMonthNames[gregorianDate.getMonth()]
  } ${gregorianDate.getFullYear()}, ${gregorianDate.getHours()}:${gregorianDate.getMinutes()}`;

  // Combine loading states
  const isLoading =
    todayTasksQuery.isPending || todayCompletedTasksQuery.isPending;
  const error = todayTasksQuery.error || todayCompletedTasksQuery.error;

  return {
    todayTasks: todayTasksQuery.data || [],
    todayCompletedTasks: todayCompletedTasksQuery.data || [],
    initiated: !isLoading && hijriCalInititated,
    error: error
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : null,
    // Computed values from useDateTranslationHelper
    pageTitle,
    subTitle,
    gregorianDate,
  };
}
