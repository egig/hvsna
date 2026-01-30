import { useEffect, useState } from "react";
import { usePouchDB } from "../../pouchdb";
import { useLogStore } from "./logStore";
import type { LogCreateInput, LogUpdateInput, LogQuery } from "./logStore";
import type { Log } from "~/lib/tracker/types";

export function useLog(logId?: string) {
  const { db } = usePouchDB();
  const {
    logs,
    currentLog,
    loading,
    error,
    setLoading,
    setError,
    clearError,
    createLog: createLogInStore,
    updateLogInDB,
    deleteLogFromDB,
    getLogFromDB,
  } = useLogStore();

  const [log, setLog] = useState<Log | null>(null);

  useEffect(() => {
    if (logId) {
      getLog(logId)
        .then((fetchedLog) => {
          if (fetchedLog) {
            setLog(fetchedLog);
          }
        })
        .catch(() => {
          // Handle error silently
        });
    } else {
      setLog(null);
    }
  }, [logId]);

  const createLog = async (input: LogCreateInput): Promise<Log> => {
    return createLogInStore(input, db);
  };

  const updateLog = async (id: string, input: LogUpdateInput): Promise<Log> => {
    const result = await updateLogInDB(id, input, db);
    if (id === logId) {
      setLog(result);
    }
    return result;
  };

  const deleteLog = async (id: string) => {
    return deleteLogFromDB(id, db);
  };

  const getLog = async (id: string) => {
    return getLogFromDB(id, db);
  };

  return {
    log,
    loading,
    error,
    createLog,
    updateLog,
    deleteLog,
    getLog,
    setLoading,
    setError,
    clearError,
  };
}
