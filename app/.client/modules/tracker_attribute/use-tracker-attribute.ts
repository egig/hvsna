import { useCallback, useEffect, useState } from "react";
import { useTrackerAttributeStore } from "../tracker_attribute/trackerAttributeStore";
import type {
  TrackerAttribute,
  TrackerAttributeCreateInput,
  TrackerAttributeUpdateInput,
} from "../tracker_attribute/trackerAttributeStore";
import { usePouchDB } from "~/.client/pouchdb";

export function useTrackerAttribute(trackerAttributeId?: string) {
  const { db } = usePouchDB();
  const [trackerAttribute, setTrackerAttribute] = useState<TrackerAttribute | null>(null);

  const {
    loading,
    error,
    setLoading,
    setError,
    addTrackerAttribute,
    updateTrackerAttribute: updateTrackerAttributeInStore,
    removeTrackerAttribute,
    clearError,
  } = useTrackerAttributeStore();

  useEffect(() => {
    if (trackerAttributeId) {
      getTrackerAttribute(trackerAttributeId)
        .then((fetchedTrackerAttribute) => {
          if (fetchedTrackerAttribute) {
            setTrackerAttribute(fetchedTrackerAttribute);
          }
        })
        .catch(() => {
          // Handle error silently or show error
        });
    }
  }, [trackerAttributeId]);

  const createTrackerAttribute = useCallback(
    async (input: TrackerAttributeCreateInput): Promise<TrackerAttribute> => {
      setLoading(true);
      clearError();

      try {
        const trackerAttribute: TrackerAttribute = {
          id: `tracker_attribute:${crypto.randomUUID()}`,
          ...input,
          createdAt: Date.now(),
        };

        await db.put({
          _id: trackerAttribute.id,
          ...trackerAttribute,
        });

        addTrackerAttribute(trackerAttribute);
        return trackerAttribute;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create tracker attribute";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, addTrackerAttribute, setError],
  );

  const updateTrackerAttribute = useCallback(
    async (id: string, input: TrackerAttributeUpdateInput): Promise<TrackerAttribute> => {
      setLoading(true);
      clearError();

      try {
        const doc = await db.get(id);
        const updatedTrackerAttribute: TrackerAttribute = {
          ...(doc as unknown as TrackerAttribute),
          ...input,
        };

        await db.put({
          ...updatedTrackerAttribute,
          _id: id,
          _rev: doc._rev,
        });

        updateTrackerAttributeInStore(id, updatedTrackerAttribute);
        return updatedTrackerAttribute;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update tracker attribute";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, updateTrackerAttributeInStore, setError],
  );

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
          err instanceof Error ? err.message : "Failed to delete tracker attribute";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, removeTrackerAttribute, setError],
  );

  const getTrackerAttribute = useCallback(
    async (id: string): Promise<TrackerAttribute> => {
      setLoading(true);
      clearError();

      try {
        const doc = await db.get(id);
        return doc as unknown as TrackerAttribute;
      } catch (err) {
        if ((err as any).status === 404) {
          throw new Error("Tracker attribute not found");
        }
        const errorMessage =
          err instanceof Error ? err.message : "Failed to get tracker attribute";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, setError],
  );

  return {
    trackerAttribute,
    loading,
    error,
    createTrackerAttribute,
    updateTrackerAttribute,
    deleteTrackerAttribute,
    getTrackerAttribute,
  };
}
