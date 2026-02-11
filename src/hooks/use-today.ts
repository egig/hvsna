import { useState, useEffect } from "react";
import { usePouchDB } from "../pouchdb";
import { useTargetResults } from "./useTargetResults";
import { useTrackers } from "../modules/tracker/use-trackers";
import { useTasks } from "./use-tasks";
import { useAttributeOptions } from "../modules/option/use-options";
import { useTrackerAttributes } from "../modules/attribute/use-tracker-attributes";
import { useDateFormatter } from "./use-date-formatter";
import type { TargetResultData } from "./useTargetResults";
import type { Tracker } from "../modules/tracker/trackerStore";
import type { Task } from "../lib/types/task";
import { useTaskStore } from "src/modules/task/task-store";

export function useToday() {
  const { db } = usePouchDB();
  const todayTasks = useTaskStore((s) => s.todayTasks);
  const loadTodayTasks = useTaskStore((s) => s.loadTodayTasks);
  const { getTargetResults } = useTargetResults();
  const { getTrackers } = useTrackers();
  const { attributeOptions } = useAttributeOptions();
  const { trackerAttributes } = useTrackerAttributes();

  const [targetResults, setTargetResults] = useState<TargetResultData[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [initiated, setInitiated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { activeDate, setActiveDate, gregorianDate, pageTitle, subTitle } = useDateFormatter();

  useEffect(() => {
    loadTodayTasks();
  }, []);

  useEffect(() => {
    const loadHomeData = async () => {
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
        setError(
          err instanceof Error ? err.message : "Failed to load home data",
        );
      } finally {
        setLoading(false);
        setInitiated(true);
      }
    };

    loadHomeData();
  }, [db]);

  return {
    // State
    targetResults,
    trackers,
    todayTasks,
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
