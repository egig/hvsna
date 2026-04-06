import { useState, useCallback } from "react";
import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskQuery,
  RecurringTaskUpdateInput,
} from "./recurring-task";
import { usePouchDB } from "../../pouchdb";

export function useRecurringTasks() {
  const { db } = usePouchDB();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRecurringTask = useCallback(
    async (input: RecurringTaskCreateInput): Promise<RecurringTask> => {
      setLoading(true);
      setError(null);

      try {
        const id = input.id || `recurring_task_${crypto.randomUUID()}`;
        const now = Date.now();

        const recurringTask: RecurringTask = {
          id,
          user_id: "current_user", // TODO: Get from auth context
          name: input.name,
          description: input.description,
          attributes: input.attributes,
          repeat: input.repeat,
          repeatInterval: input.repeatInterval ?? 1,
          baseDateHijri: input.baseDateHijri,
          atTime: input.atTime,
          prayerTime: input.prayerTime,
          lat: input.lat,
          long: input.long,
          timezone: input.timezone,
          hijriDateOffset: input.hijriDateOffset,
          listId: input.listId,
          created_at: now,
          updated_at: now,
        };

        const response = await db.put({
          _id: id,
          ...recurringTask,
        });

        return {
          ...recurringTask,
          _rev: response.rev,
        } as unknown as RecurringTask;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create recurring task";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const getRecurringTask = useCallback(
    async (id: string): Promise<RecurringTask> => {
      setLoading(true);
      setError(null);

      try {
        const doc = await db.get(id);
        return doc as unknown as RecurringTask;
      } catch (err: any) {
        if (err.status === 404) {
          throw new Error("Recurring task not found");
        }
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get recurring task";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const getRecurringTasks = useCallback(
    async (query?: RecurringTaskQuery): Promise<RecurringTask[]> => {
      setLoading(true);
      setError(null);

      try {
        const response = await db.allDocs({
          include_docs: true,
          startkey: "recurring_task_",
          endkey: "recurring_task_\uffff",
        });

        let tasks = response.rows
          .filter((row: any) => row.doc)
          .map((row: any) => row.doc) as RecurringTask[];

        // Apply filters if query is provided
        if (query) {
          if (query.repeat) {
            tasks = tasks.filter((task) => task.repeat === query.repeat);
          }
        }

        return tasks;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get recurring tasks";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const updateRecurringTask = useCallback(
    async (
      id: string,
      input: RecurringTaskUpdateInput,
    ): Promise<RecurringTask> => {
      setLoading(true);
      setError(null);

      try {
        const existingDoc = await db.get(id);

        const updatedTask: RecurringTask = {
          ...(existingDoc as unknown as RecurringTask),
          ...input,
          updated_at: Date.now(),
        };

        const response = await db.put({
          _id: id,
          _rev: existingDoc._rev,
          ...updatedTask,
        });

        return {
          ...updatedTask,
          _rev: response.rev,
        } as unknown as RecurringTask;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update recurring task";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const deleteRecurringTask = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const doc = await db.get(id);
        await db.remove(doc);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to delete recurring task";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  return {
    createRecurringTask,
    getRecurringTask,
    getRecurringTasks,
    updateRecurringTask,
    deleteRecurringTask,
    loading,
    error,
  };
}
