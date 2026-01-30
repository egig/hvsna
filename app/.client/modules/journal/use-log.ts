import type { UUID } from "crypto";
import { useCallback, useState } from "react";
import { usePouchDB } from "~/.client/pouchdb";
import type { EpochTime } from "~/lib/tracker/types";
import type { Log } from "~/lib/tracker/types";

export interface LogCreateInput {
  trackerId: UUID;
  timestamp: EpochTime;
  value: number;
  metadata?: Record<string, unknown>;
}

export interface LogUpdateInput {
  timestamp?: EpochTime;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface LogQuery {
  trackerId?: UUID;
  from?: EpochTime;
  to?: EpochTime;
  limit?: number;
  skip?: number;
}

export function useLog() {
  const { db } = usePouchDB();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLog = useCallback(
    async (input: LogCreateInput): Promise<Log> => {
      setLoading(true);
      setError(null);

      try {
        const log: Log = {
          id: `log_${crypto.randomUUID()}`,
          ...input,
          createdAt: Date.now(),
        };

        await db.put({
          _id: log.id,
          ...log,
        });

        return log;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create log");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const updateLog = useCallback(
    async (id: UUID, input: LogUpdateInput): Promise<Log> => {
      setLoading(true);
      setError(null);

      try {
        const doc = await db.get(id);
        const existingLog = doc as Log;
        const updatedLog: Log = {
          id: existingLog.id,
          trackerId: existingLog.trackerId,
          timestamp: input.timestamp ?? existingLog.timestamp,
          value: input.value ?? existingLog.value,
          metadata: input.metadata ?? existingLog.metadata,
          createdAt: existingLog.createdAt,
        };

        await db.put({
          ...updatedLog,
          _id: id,
          _rev: doc._rev,
        });

        return updatedLog;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update log");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const deleteLog = useCallback(
    async (id: UUID): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const doc = await db.get(id);
        await db.remove(doc);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete log");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const getLog = useCallback(
    async (id: UUID): Promise<Log> => {
      setLoading(true);
      setError(null);

      try {
        const doc = await db.get(id);
        return doc as unknown as Log;
      } catch (err) {
        if ((err as any).status === 404) {
          throw new Error("Log not found");
        }
        setError(err instanceof Error ? err.message : "Failed to get log");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const getLogs = useCallback(
    async (query: LogQuery = {}): Promise<Log[]> => {
      setLoading(true);
      setError(null);

      try {
        const result = await db.allDocs({
          include_docs: true,
          startkey: "log_",
          endkey: "log_\uffff",
        });

        let logs = result.rows
          .filter((row: any) => row.id.startsWith("log_"))
          .map((row: any) => row.doc as Log);

        // Apply filters
        if (query.trackerId) {
          logs = logs.filter((e: Log) => e.trackerId === query.trackerId);
        }
        if (query.from !== undefined) {
          logs = logs.filter((e: Log) => e.timestamp >= query.from!);
        }
        if (query.to !== undefined) {
          logs = logs.filter((e: Log) => e.timestamp <= query.to!);
        }

        // Sort by timestamp (newest first)
        logs.sort((a: Log, b: Log) => b.timestamp - a.timestamp);

        // Apply pagination
        if (query.skip) {
          logs = logs.slice(query.skip);
        }
        if (query.limit) {
          logs = logs.slice(0, query.limit);
        }

        return logs;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to get logs");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const refreshLogs = useCallback(async (): Promise<Log[]> => {
    return getLogs();
  }, [getLogs]);

  return {
    loading,
    error,
    createLog,
    updateLog,
    deleteLog,
    getLog,
    getLogs,
    refreshLogs,
  };
}
