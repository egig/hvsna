import { useCallback, useEffect } from "react";
import { usePouchDB } from "../../pouchdb";
import { useLogStore } from "./logStore";
import type { LogCreateInput, LogUpdateInput, LogQuery } from "./logStore";
import type { Log } from "~/lib/tracker/types";

export function useJournal() {
  const { db } = usePouchDB();
  const {
    logs,
    currentLog,
    loading,
    error,
    setLoading,
    setError,
    setLogs,
    setCurrentLog,
    addLog: addLogToStore,
    updateLog: updateLogInStore,
    removeLog: removeLogFromStore,
    clearError,
    reset,
    getLogsFromDB,
  } = useLogStore();

  useEffect(() => {
    getLogs();
  }, []);

  const getLogs = useCallback(
    async (query?: LogQuery): Promise<Log[]> => {
      return getLogsFromDB(query, db);
    },
    [getLogsFromDB, db],
  );

  const refreshLogs = useCallback(async (): Promise<Log[]> => {
    return getLogs();
  }, [getLogs]);

  const getLogsByTracker = useCallback(
    async (
      trackerId: string,
      query?: Omit<LogQuery, "trackerId">,
    ): Promise<Log[]> => {
      return getLogs({ ...query, trackerId });
    },
    [getLogs],
  );

  const getLogsByDateRange = useCallback(
    async (
      from: number,
      to: number,
      query?: Omit<LogQuery, "from" | "to">,
    ): Promise<Log[]> => {
      return getLogs({ ...query, from, to });
    },
    [getLogs],
  );

  const getLatestLog = useCallback(
    async (trackerId?: string): Promise<Log | null> => {
      const logs = await getLogs({ trackerId, limit: 1 });
      return logs.length > 0 ? logs[0] : null;
    },
    [getLogs],
  );

  return {
    // State
    logs,
    log: currentLog,
    loading,
    error,

    // Collection operations
    getLogs,
    refreshLogs,

    // Convenience methods
    getLogsByTracker,
    getLogsByDateRange,
    getLatestLog,

    // Store actions
    setLoading,
    setError,
    setLogs,
    setCurrentLog,
    addLog: addLogToStore,
    updateLogInStore,
    removeLog: removeLogFromStore,
    clearError,
    reset,
  };
}
