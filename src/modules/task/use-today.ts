import { useQuery } from "@tanstack/react-query";
import { useDateTranslationHelper } from "../calendar/use-date-translation-helper";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";
import { useVirtualTasks } from "./use-virtual-tasks";
import { usePendingTasks } from "./use-pending-tasks";
import { usePrayerTimes } from "../prayer";
import { useMockTime } from "./mock-time-context";
import dayjs from "dayjs";

export function useToday() {
  const { now: getNow } = useMockTime();
  const now = getNow();

  const { hijriMonthNames, gregorianMonthNames } = useDateTranslationHelper();
  const {
    currentHijriDate,
    getTomorrow,
    initiated: hijriCalInititated,
  } = useHijriDate();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);
  const { getPrayerTimesForDate } = usePrayerTimes();

  const gregDate = dayjs(now);
  const startOfDayEpoch = gregDate.startOf("day").valueOf();
  const endOfDayEpoch = gregDate.endOf("day").valueOf();
  const todayString = gregDate.format("YYYY-MM-DD");

  // Detect whether current time is past today's Maghrib (sunset)
  let maghribEpoch: number | null = null;
  try {
    const todayPrayerTimes = getPrayerTimesForDate(now);
    const m = todayPrayerTimes?.maghrib;
    if (m && !isNaN(m.valueOf())) {
      maghribEpoch = m.valueOf();
    }
  } catch {
    // No valid location — sunset state unavailable
  }
  const isAfterMaghrib = maghribEpoch != null && now.valueOf() > maghribEpoch;

  // When after Maghrib, extend the task window to tomorrow's Maghrib
  const tomorrowStartEpoch = gregDate.add(1, "day").startOf("day").valueOf();
  let tomorrowEndEpoch: number | null = null;
  try {
    if (isAfterMaghrib) {
      const tm = dayjs(now).add(1, "day").endOf("day").toDate();
      if (tm && !isNaN(tm.valueOf())) {
        tomorrowEndEpoch = tm.valueOf();
      }
    }
  } catch {
    // Ignore
  }
  const taskEndEpoch =
    isAfterMaghrib && tomorrowEndEpoch ? tomorrowEndEpoch : endOfDayEpoch;

  const pendingTasksQuery = usePendingTasks();
  const virtualTaskQuery = useVirtualTasks(startOfDayEpoch, endOfDayEpoch);
  // Always call — enabled only when isAfterMaghrib; falls back to empty range otherwise
  const tomorrowVirtualTaskQuery = useVirtualTasks(
    tomorrowStartEpoch,
    tomorrowEndEpoch ?? tomorrowStartEpoch
  );

  const allTasks = [
    ...(pendingTasksQuery.data ?? []),
    ...(virtualTaskQuery.data ?? []),
    ...(isAfterMaghrib ? tomorrowVirtualTaskQuery.data ?? [] : []),
  ];

  const todayCompletedTasksQuery = useQuery({
    queryKey: queryKeys.todayCompletedTasks(todayString),
    queryFn: () =>
      taskUseCases.findTodayCompletedTasks(startOfDayEpoch, endOfDayEpoch),
    enabled: hijriCalInititated,
  });

  const todayTasks = (allTasks ?? []).filter((t) => {
    return t.atEpochMillis != null && t.atEpochMillis <= taskEndEpoch;
  });

  // After Maghrib the Hijri day has rolled; show tomorrow's Hijri date in the subtitle
  const displayHijriDate = isAfterMaghrib ? getTomorrow() : currentHijriDate;
  const subTitle = `${displayHijriDate.day} ${
    hijriMonthNames[displayHijriDate.month - 1]
  } ${displayHijriDate.year}`;

  const pageTitle = `${gregDate.format("ddd")}, ${gregDate.date()} ${
    gregorianMonthNames[gregDate.month()]
  } ${gregDate.year()}`;

  // Label for the sunset hairline: next Hijri day that begins at Maghrib
  const nextHijriDate = getTomorrow();
  const nextHijriLabel = `${nextHijriDate.day} ${
    hijriMonthNames[nextHijriDate.month - 1]
  } ${nextHijriDate.year}`;

  // Label for the "Tomorrow" calendar-day divider shown in State 2
  const tomorrowGreg = dayjs(now).add(1, "day");
  const tomorrowGregorianLabel = `${tomorrowGreg.format(
    "ddd"
  )}, ${tomorrowGreg.date()} ${gregorianMonthNames[tomorrowGreg.month()]}`;

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
    isAfterMaghrib,
    endOfTodayEpoch: endOfDayEpoch,
    nextHijriLabel,
    tomorrowGregorianLabel,
  };
}
