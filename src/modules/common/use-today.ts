import { useState, useEffect, useCallback } from "react";
import { useTaskStore } from "../task/task-store";
import { useDateFormatter } from "../calendar/use-date-formatter";
import { useHijriCalendar } from "../calendar/hijri/useHijriCalendar";

export function useToday() {
  const todayTasks = useTaskStore((s) => s.todayTasks);
  const todayCompletedTasks = useTaskStore((s) => s.todayCompletedTasks);
  const loadTodayTasks = useTaskStore((s) => s.loadTodayTasks);
  const loadTodayCompletedTasks = useTaskStore(
    (s) => s.loadTodayCompletedTasks,
  );

  const [initiated, setInitiated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { dayNames, hijriMonthNames, gregorianMonthNames } = useDateFormatter();
  const { getToday, initiated: hijriCalInititated } = useHijriCalendar();
  let today = getToday();
  let gregorianDate = today.toDate();

  const pageTitle = `${dayNames[today.dayOfWeek]} ${today.day} ${hijriMonthNames[today.month - 1]} ${today.year}`;
  const subTitle = `${gregorianDate.getDate()} ${gregorianMonthNames[gregorianDate.getMonth()]} ${gregorianDate.getFullYear()}, ${gregorianDate.getHours()}:${gregorianDate.getMinutes()}`;

  useEffect(() => {
    loadTodayTasks(getToday());
    loadTodayCompletedTasks(getToday());
    setInitiated(true);
  }, [getToday]);

  return {
    todayTasks,
    todayCompletedTasks,
    initiated: initiated && hijriCalInititated,
    error,
    // Computed values from useDateFormatter
    pageTitle,
    subTitle,
    gregorianDate,
  };
}
