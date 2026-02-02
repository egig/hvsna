import { useCallback, useEffect } from "react";
import { useTrackerAttributeStore } from "./trackerAttributeStore";
import type {
  TrackerAttribute,
  TrackerAttributeQuery,
} from "./trackerAttributeStore";
import { usePouchDB } from "src/pouchdb";

export function useTrackerAttributes(trackerId?: string) {
  const { db } = usePouchDB();
  const {
    trackerAttributes,
    loading,
    error,
    setLoading,
    setError,
    setTrackerAttributes,
    clearError,
    removeTrackerAttribute,
  } = useTrackerAttributeStore();

  useEffect(() => {
    loadTrackerAttributes();
  }, [trackerId]);

  const loadTrackerAttributes = async () => {
    try {
      await getTrackerAttributes({ trackerId });
    } catch (err) {
      console.error("Failed to load tracker attributes:", err);
    }
  };

  const getTrackerAttributes = useCallback(
    async (query: TrackerAttributeQuery = {}): Promise<TrackerAttribute[]> => {
      setLoading(true);
      clearError();

      try {
        const result = await db.allDocs({
          include_docs: true,
          startkey: "attr_",
          endkey: "attr_\uffff",
        });

        let trackerAttributes = result.rows.map(
          (row) => row.doc as unknown as TrackerAttribute,
        );

        // Filter by trackerId if provided
        if (query.trackerId) {
          trackerAttributes = trackerAttributes.filter(
            (attr) => attr.trackerId === query.trackerId,
          );
        }

        // Apply pagination
        if (query.skip) {
          trackerAttributes = trackerAttributes.slice(query.skip);
        }
        if (query.limit) {
          trackerAttributes = trackerAttributes.slice(0, query.limit);
        }

        setTrackerAttributes(trackerAttributes);
        return trackerAttributes;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to get tracker attributes";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, setTrackerAttributes, setError],
  );

  const refreshTrackerAttributes = useCallback(async (): Promise<
    TrackerAttribute[]
  > => {
    return getTrackerAttributes({ trackerId });
  }, [getTrackerAttributes]);

  const deleteTrackerAttribute = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      clearError();

      try {
        const doc = await db.get(id);
        await db.remove(doc);
        removeTrackerAttribute(id);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to delete tracker attribute";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, removeTrackerAttribute, setError],
  );

  return {
    trackerAttributes,
    loading,
    error,
    getTrackerAttributes,
    refreshTrackerAttributes,
    deleteTrackerAttribute,
  };
}
