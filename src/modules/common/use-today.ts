import { useState, useEffect, useCallback } from "react";
import { usePouchDB } from "../../pouchdb";
import { useTrackers } from "../tracker/use-trackers";
import { useAttributeOptions } from "../option/use-options";
import { useTrackerAttributes } from "../attribute/use-tracker-attributes";
import type { Tracker } from "../tracker/trackerStore";
import {
  useTargetResults,
  type TargetResultData,
} from "src/modules/goal/useTargetResults";
import { useTaskStore } from "../task/task-store";
import { useDateFormatter } from "../calendar/use-date-formatter";
import { useHijriCalendar } from "../calendar/hijri/useHijriCalendar";

export function useToday() {
  const { db } = usePouchDB();
  const todayTasks = useTaskStore((s) => s.todayTasks);
  const todayCompletedTasks = useTaskStore((s) => s.todayCompletedTasks);
  const loadTodayTasks = useTaskStore((s) => s.loadTodayTasks);
  const loadTodayCompletedTasks = useTaskStore(
    (s) => s.loadTodayCompletedTasks,
  );
  const { getTargetResults } = useTargetResults();
  const { getTrackers } = useTrackers();
  const { attributeOptions } = useAttributeOptions();
  const { trackerAttributes } = useTrackerAttributes();

  const [targetResults, setTargetResults] = useState<TargetResultData[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiated, setInitiated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { activeDate, setActiveDate, gregorianDate, pageTitle, subTitle } =
    useDateFormatter();
  const { getToday } = useHijriCalendar();

  const loadHomeData = useCallback(async () => {
    if (!db) return;

    try {
      setLoading(true);
      setError(null);

      // Load target results (last 30 days)
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const [results, trackersData] = await Promise.all([
        getTargetResults(
          {
            from: thirtyDaysAgo,
            to: Date.now(),
          },
          db,
        ),
        getTrackers(),
      ]);

      setTargetResults(results);
      setTrackers(trackersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load home data");
    } finally {
      setLoading(false);
      setInitiated(true);
    }
  }, [db, getTargetResults, getTrackers]);

  useEffect(() => {
    loadTodayTasks(getToday());
  }, [loadTodayTasks, getToday]);

  useEffect(() => {
    loadTodayCompletedTasks(getToday());
  }, [loadTodayCompletedTasks, getToday]);

  useEffect(() => {
    loadHomeData();
  }, [loadHomeData]);

  return {
    // State
    targetResults,
    trackers,
    todayTasks,
    todayCompletedTasks,
    loading,
    initiated,
    error,
    activeDate,
    setActiveDate,

    // Computed values from useDateFormatter
    pageTitle,
    subTitle,
    gregorianDate,

    // Additional data
    attributeOptions,
    trackerAttributes,
  };
}
