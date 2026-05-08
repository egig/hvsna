import { useState, useCallback } from "react";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import type { TrackerLog } from "../../domain/tracker/TrackerLog";
import type { TrackerProgress, TrackerStats } from "../../usecases/tracker/TrackerUseCases";

export function useTrackerLogs() {
  const { db } = usePouchDB();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logValue = useCallback(
    async (
      trackerId: string,
      value: number,
      note?: string,
      occurredAt?: number
    ): Promise<TrackerLog> => {
      setLoading(true);
      setError(null);

      try {
        const useCases = createTrackerUseCases(db);
        return await useCases.logValue(trackerId, value, note, occurredAt);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to log value";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const getTrackerProgress = useCallback(
    async (
      trackerId: string,
      period: "day" | "week" | "month"
    ): Promise<TrackerProgress> => {
      setLoading(true);
      setError(null);

      try {
        const useCases = createTrackerUseCases(db);
        return await useCases.getTrackerProgress(trackerId, period);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get tracker progress";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const getTrackerStats = useCallback(
    async (
      trackerId: string,
      period: "day" | "week" | "month"
    ): Promise<TrackerStats> => {
      setLoading(true);
      setError(null);

      try {
        const useCases = createTrackerUseCases(db);
        return await useCases.getTrackerStats(trackerId, period);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get tracker stats";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const getRecentLogs = useCallback(
    async (trackerId: string, limit?: number): Promise<TrackerLog[]> => {
      setLoading(true);
      setError(null);

      try {
        const useCases = createTrackerUseCases(db);
        return await useCases.getRecentLogs(trackerId, limit);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get recent logs";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const getLatestLog = useCallback(
    async (trackerId: string): Promise<TrackerLog | null> => {
      setLoading(true);
      setError(null);

      try {
        const useCases = createTrackerUseCases(db);
        return await useCases.getLatestLog(trackerId);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get latest log";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  return {
    loading,
    error,
    logValue,
    getTrackerProgress,
    getTrackerStats,
    getRecentLogs,
    getLatestLog,
  };
}
