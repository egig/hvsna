import { useQuery } from "@tanstack/react-query";
import { useDateTranslationHelper } from "../calendar/use-date-translation-helper";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";
import { useVirtualTasks } from "./use-virtual-tasks";
import { usePendingTasks } from "./use-pending-tasks";

export function useToday() {
  const { dayNames, hijriMonthNames, gregorianMonthNames } =
    useDateTranslationHelper();
  const { getToday, initiated: hijriCalInititated } = useHijriDate();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  const today = getToday();
  const gregorianDate = today.toDate();
  const todayString = today.toString();

  const pendingTasksQuery = usePendingTasks();
  const startOfToday = today.startOfDay().toDate().valueOf();
  const endOfToday = today.endOfDay().toDate().valueOf();
  const virtualTaskQuery = useVirtualTasks(startOfToday, endOfToday);

  const allTasks = [
    ...(pendingTasksQuery.data ?? []),
    ...(virtualTaskQuery.data ?? []),
  ];

  const todayCompletedTasksQuery = useQuery({
    queryKey: queryKeys.todayCompletedTasks(todayString),
    queryFn: () => taskUseCases.findTodayCompletedTasks(today),
    enabled: hijriCalInititated,
  });

  const todayTasks = (allTasks ?? []).filter(
    (t) =>
      t.noDate === 0 && t.atEpochMillis != null && t.atEpochMillis <= endOfToday
  );

  const pageTitle = `${dayNames[today.dayOfWeek]}, ${today.day} ${
    hijriMonthNames[today.month - 1]
  } ${today.year}`;
  const subTitle = `${gregorianDate.getDate()} ${
    gregorianMonthNames[gregorianDate.getMonth()]
  } ${gregorianDate.getFullYear()}, ${gregorianDate.getHours()}:${gregorianDate.getMinutes()}`;

  const isLoading =
    pendingTasksQuery.isPending || todayCompletedTasksQuery.isPending;
  const error = pendingTasksQuery.error || todayCompletedTasksQuery.error;

  return {
    todayTasks,
    todayCompletedTasks: todayCompletedTasksQuery.data || [],
    initiated: !isLoading && hijriCalInititated,
    error: error
      ? error instanceof Error
        ? error.message
        : "Unknown error"
      : null,
    pageTitle,
    subTitle,
    gregorianDate,
  };
}
