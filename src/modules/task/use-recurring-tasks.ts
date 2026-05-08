import { useState, useCallback } from "react";
import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskQuery,
  RecurringTaskUpdateInput,
} from "./recurring-task";
import { usePouchDB } from "../../pouchdb";
import { createRecurringTaskUseCases } from "../../usecases/recurring-task/RecurringTaskUseCasesFactory";

export function useRecurringTasks() {
  const { db } = usePouchDB();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recurringTaskUseCases = createRecurringTaskUseCases(db);

  const createRecurringTask = useCallback(
    async (input: RecurringTaskCreateInput): Promise<RecurringTask> => {
      setLoading(true);
      setError(null);

      try {
        const recurringTask = await recurringTaskUseCases.createRecurringTask(
          input
        );
        return recurringTask;
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
    [recurringTaskUseCases]
  );

  const getRecurringTask = useCallback(
    async (id: string): Promise<RecurringTask> => {
      setLoading(true);
      setError(null);

      try {
        const recurringTask = await recurringTaskUseCases.getRecurringTask(id);
        if (!recurringTask) {
          throw new Error("Recurring task not found");
        }
        return recurringTask;
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
    [recurringTaskUseCases]
  );

  const getRecurringTasks = useCallback(
    async (query?: RecurringTaskQuery): Promise<RecurringTask[]> => {
      setLoading(true);
      setError(null);

      try {
        const recurringTasks = await recurringTaskUseCases.getRecurringTasks(
          query
        );
        return recurringTasks;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get recurring tasks";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [recurringTaskUseCases]
  );

  const updateRecurringTask = useCallback(
    async (
      id: string,
      input: RecurringTaskUpdateInput
    ): Promise<RecurringTask> => {
      setLoading(true);
      setError(null);

      try {
        const recurringTask = await recurringTaskUseCases.updateRecurringTask(
          id,
          input
        );
        return recurringTask;
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
    [recurringTaskUseCases]
  );

  const deleteRecurringTask = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        await recurringTaskUseCases.deleteRecurringTask(id);
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
    [recurringTaskUseCases]
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
