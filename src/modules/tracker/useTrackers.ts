import { useState, useCallback } from "react";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import type { Tracker, TrackerCreateInput, TrackerUpdateInput } from "../../domain/tracker/Tracker";

export function useTrackers() {
  const { db } = usePouchDB();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTracker = useCallback(
    async (input: TrackerCreateInput): Promise<Tracker> => {
      setLoading(true);
      setError(null);

      try {
        const useCases = createTrackerUseCases(db);
        return await useCases.createTracker(input);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create tracker";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const getTracker = useCallback(
    async (id: string): Promise<Tracker | null> => {
      setLoading(true);
      setError(null);

      try {
        const useCases = createTrackerUseCases(db);
        return await useCases.getTracker(id);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get tracker";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const getTrackers = useCallback(async (): Promise<Tracker[]> => {
    setLoading(true);
    setError(null);

    try {
      const useCases = createTrackerUseCases(db);
      return await useCases.getTrackers();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to get trackers";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [db]);

  const updateTracker = useCallback(
    async (id: string, input: TrackerUpdateInput): Promise<Tracker> => {
      setLoading(true);
      setError(null);

      try {
        const useCases = createTrackerUseCases(db);
        return await useCases.updateTracker(id, input);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update tracker";
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  const deleteTracker = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const useCases = createTrackerUseCases(db);
        await useCases.deleteTracker(id);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete tracker";
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
    createTracker,
    getTracker,
    getTrackers,
    updateTracker,
    deleteTracker,
  };
}
