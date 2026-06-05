import { useQuery } from "@tanstack/react-query";
import { useDateTranslationHelper } from "../calendar/use-date-translation-helper";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";
import { useVirtualTasks } from "./use-virtual-tasks";
import { usePendingTasks } from "./use-pending-tasks";
import dayjs from "dayjs";

export function useToday() {
  const { hijriMonthNames, gregorianMonthNames } = useDateTranslationHelper();
  const { getToday, initiated: hijriCalInititated } = useHijriDate();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  const today = getToday();
  const gregDate = dayjs(today.toDate());
  const startOfDayEpoch = gregDate.startOf("day").valueOf();
  const endOfDayEpoch = gregDate.endOf("day").valueOf();
  const todayString = gregDate.format("YYYY-MM-DD");

  const pendingTasksQuery = usePendingTasks();
  const virtualTaskQuery = useVirtualTasks(startOfDayEpoch, endOfDayEpoch);

  const allTasks = [
    ...(pendingTasksQuery.data ?? []),
    ...(virtualTaskQuery.data ?? []),
  ];

  const todayCompletedTasksQuery = useQuery({
    queryKey: queryKeys.todayCompletedTasks(todayString),
    queryFn: () =>
      taskUseCases.findTodayCompletedTasks(startOfDayEpoch, endOfDayEpoch),
    enabled: hijriCalInititated,
  });

  const todayTasks = (allTasks ?? []).filter((t) => {
    return t.atEpochMillis != null && t.atEpochMillis <= endOfDayEpoch;
  });

  const subTitle = `${today.day} ${hijriMonthNames[today.month - 1]} ${
    today.year
  }`;
  const pageTitle = `${gregDate.format("ddd")}, ${gregDate.date()} ${
    gregorianMonthNames[gregDate.month()]
  } ${gregDate.year()}`;

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
    gregorianDate: gregDate,
  };
}
