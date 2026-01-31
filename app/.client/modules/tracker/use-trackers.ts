import { useCallback, useEffect } from "react";
import { useTrackerStore } from "../tracker/trackerStore";
import type { Tracker, TrackerQuery } from "../tracker/trackerStore";
import { usePouchDB } from "~/.client/pouchdb";

export function useTrackers() {
  const { db } = usePouchDB();
  const {
    trackers,
    loading,
    error,
    setLoading,
    setError,
    setTrackers,
    clearError,
    removeTracker,
  } = useTrackerStore();

  useEffect(() => {
    loadTrackers();
  }, []);

  const loadTrackers = async () => {
    try {
      await getTrackers();
    } catch (err) {
      console.error("Failed to load trackers:", err);
    }
  };

  const getTrackers = useCallback(
    async (query: TrackerQuery = {}): Promise<Tracker[]> => {
      setLoading(true);
      clearError();

      try {
        const result = await db.allDocs({
          include_docs: true,
          startkey: "trac_",
          endkey: "trac_:\uffff",
        });


        let trackers = result.rows
          .filter((row) => row.id.startsWith("trac_"))
          .map((row) => row.doc as unknown as Tracker);

        // Apply pagination
        if (query.skip) {
          trackers = trackers.slice(query.skip);
        }
        if (query.limit) {
          trackers = trackers.slice(0, query.limit);
        }

        setTrackers(trackers);
        return trackers;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get trackers";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, setTrackers, setError],
  );

  const refreshTrackers = useCallback(async (): Promise<Tracker[]> => {
    return getTrackers();
  }, [getTrackers]);

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

  return {
    trackers,
    loading,
    error,
    getTrackers,
    refreshTrackers,
    deleteTracker,
  };
}
