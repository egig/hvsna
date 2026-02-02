import { useCallback, useEffect, useState } from "react";
import { useTrackerStore } from "./trackerStore";
import type {
  Tracker,
  TrackerCreateInput,
  TrackerUpdateInput,
} from "./trackerStore";
import { usePouchDB } from "src/pouchdb";

export function useTracker(trackerId?: string) {
  const { db } = usePouchDB();
  const [tracker, setTracker] = useState<Tracker | null>(null);

  const {
    loading,
    error,
    setLoading,
    setError,
    addTracker,
    updateTracker: updateTrackerInStore,
    removeTracker,
    clearError,
  } = useTrackerStore();

  useEffect(() => {
    if (trackerId) {
      getTracker(trackerId)
        .then((fetchedTracker) => {
          if (fetchedTracker) {
            setTracker(fetchedTracker);
          }
        })
        .catch(() => {
          // Handle error silently or show error
        });
    }
  }, [trackerId]);

  const createTracker = useCallback(
    async (input: TrackerCreateInput): Promise<Tracker> => {
      setLoading(true);
      clearError();

      try {
        const tracker: Tracker = {
          id: `trac_${crypto.randomUUID()}`,
          ...input,
          createdAt: Date.now(),
        };

        await db.put({
          _id: tracker.id,
          ...tracker,
        });

        addTracker(tracker);
        return tracker;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create tracker";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, addTracker, setError],
  );

  const updateTracker = useCallback(
    async (id: string, input: TrackerUpdateInput): Promise<Tracker> => {
      setLoading(true);
      clearError();

      try {
        const doc = await db.get(id);
        const updatedTracker: Tracker = {
          ...(doc as unknown as Tracker),
          ...input,
        };

        await db.put({
          ...updatedTracker,
          _id: id,
          _rev: doc._rev,
        });

        updateTrackerInStore(id, updatedTracker);
        return updatedTracker;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update tracker";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, updateTrackerInStore, setError],
  );

  const deleteTracker = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      clearError();

      try {
        const doc = await db.get(id);
        await db.remove(doc);
        removeTracker(id);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete tracker";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, removeTracker, setError],
  );

  const getTracker = useCallback(
    async (id: string): Promise<Tracker> => {
      setLoading(true);
      clearError();

      try {
        const doc = await db.get(id);
        return doc as unknown as Tracker;
      } catch (err) {
        if ((err as any).status === 404) {
          throw new Error("Tracker not found");
        }
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get tracker";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, setError],
  );

  return {
    tracker,
    loading,
    error,
    createTracker,
    updateTracker,
    deleteTracker,
    getTracker,
  };
}
