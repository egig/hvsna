import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { EpochTime, Log } from "src/lib/tracker/types";

export type UUID = string;

export interface LogCreateInput {
  trackerId: UUID;
  timestamp: EpochTime;
  value: number;
  taskId?: string;
  attributes?: Record<string, unknown>;
  note?: string;
}

export interface LogUpdateInput {
  timestamp?: EpochTime;
  value?: number;
  attributes?: Record<string, unknown>;
  note?: string;
}

export interface LogQuery {
  trackerId?: UUID;
  from?: EpochTime;
  to?: EpochTime;
  limit?: number;
  skip?: number;
}

interface PouchDBLogDocument {
  _id: string;
  _rev?: string;
  id: UUID;
  trackerId: UUID;
  timestamp: EpochTime;
  value: number;
  metadata?: Record<string, unknown>;
  createdAt: EpochTime;
  note?: string;
}

interface LogState {
  logs: Log[];
  currentLog: Log | null;
  loading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLogs: (logs: Log[]) => void;
  setCurrentLog: (log: Log | null) => void;
  addLog: (log: Log) => void;
  updateLog: (id: string, updates: Partial<Log>) => void;
  removeLog: (id: string) => void;
  clearError: () => void;
  reset: () => void;

  // Async actions that take db as parameter
  createLog: (input: LogCreateInput, db: any) => Promise<Log>;
  updateLogInDB: (id: UUID, input: LogUpdateInput, db: any) => Promise<Log>;
  deleteLogFromDB: (id: UUID, db: any) => Promise<void>;
  getLogFromDB: (id: UUID, db: any) => Promise<Log>;
  getLogsFromDB: (query?: LogQuery, db?: any) => Promise<Log[]>;
}

export const useLogStore = create<LogState>()(
  devtools(
    (set, get) => ({
      logs: [],
      currentLog: null,
      loading: false,
      error: null,

      setLoading: (loading) => set({ loading }, false, "setLoading"),
      setError: (error) => set({ error }, false, "setError"),
      setLogs: (logs) => set({ logs }, false, "setLogs"),
      setCurrentLog: (log) => set({ currentLog: log }, false, "setCurrentLog"),

      addLog: (log) =>
        set((state) => ({ logs: [...state.logs, log] }), false, "addLog"),

      updateLog: (id, updates) =>
        set(
          (state) => ({
            logs: state.logs.map((log) =>
              log.id === id ? { ...log, ...updates } : log,
            ),
            currentLog:
              state.currentLog?.id === id
                ? { ...state.currentLog, ...updates }
                : state.currentLog,
          }),
          false,
          "updateLog",
        ),

      removeLog: (id) =>
        set(
          (state) => ({
            logs: state.logs.filter((log) => log.id !== id),
            currentLog: state.currentLog?.id === id ? null : state.currentLog,
          }),
          false,
          "removeLog",
        ),

      clearError: () => set({ error: null }, false, "clearError"),
      reset: () =>
        set(
          { logs: [], currentLog: null, loading: false, error: null },
          false,
          "reset",
        ),

      createLog: async (input: LogCreateInput, db: any): Promise<Log> => {
        try {
          set({ loading: true, error: null });

          const log: Log = {
            id: `log_${crypto.randomUUID()}`,
            ...input,
            createdAt: Date.now(),
          };

          const doc: PouchDBLogDocument = {
            _id: log.id,
            ...log,
          };

          await db.put(doc);

          // Add to local state
          get().addLog(log);
          set({ currentLog: log });

          return log;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to create log";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      updateLogInDB: async (
        id: UUID,
        input: LogUpdateInput,
        db: any,
      ): Promise<Log> => {
        try {
          set({ loading: true, error: null });

          const doc = await db.get(id);
          const existingLog = doc as unknown as Log;
          const updatedLog: Log = {
            id: existingLog.id,
            trackerId: existingLog.trackerId,
            timestamp: input.timestamp ?? existingLog.timestamp,
            value: input.value ?? existingLog.value,
            attributes: input.attributes ?? existingLog.attributes,
            note: input.note ?? (existingLog as any).note,
            createdAt: existingLog.createdAt,
          };

          await db.put({
            ...updatedLog,
            _id: id,
            _rev: doc._rev,
          });

          // Update local state
          get().updateLog(id, updatedLog);

          return updatedLog;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to update log";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      deleteLogFromDB: async (id: UUID, db: any): Promise<void> => {
        try {
          set({ loading: true, error: null });

          const doc = await db.get(id);
          await db.remove(doc);

          // Remove from local state
          get().removeLog(id);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to delete log";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      getLogFromDB: async (id: UUID, db: any): Promise<Log> => {
        try {
          set({ loading: true, error: null });

          const doc = await db.get(id);
          const log = doc as unknown as Log;

          set({ currentLog: log });
          return log;
        } catch (err) {
          if ((err as any).status === 404) {
            throw new Error("Log not found");
          }
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get log";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      getLogsFromDB: async (query: LogQuery = {}, db?: any): Promise<Log[]> => {
        if (!db) {
          throw new Error("Database instance is required");
        }

        try {
          set({ loading: true, error: null });

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
            logs = logs.filter((log: Log) => log.trackerId === query.trackerId);
          }
          if (query.from !== undefined) {
            logs = logs.filter((log: Log) => log.timestamp >= query.from!);
          }
          if (query.to !== undefined) {
            logs = logs.filter((log: Log) => log.timestamp <= query.to!);
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

          set({ logs });
          return logs;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get logs";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "log-store",
    },
  ),
);
