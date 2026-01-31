import { useCallback, useEffect } from "react";
import { useAttributeOptionStore } from "./optionStore";
import type {
  AttributeOption,
  AttributeOptionQuery,
} from "./optionStore";
import { usePouchDB } from "~/.client/pouchdb";

export function useAttributeOptions(attributeId?: string) {
  const { db } = usePouchDB();
  const {
    attributeOptions,
    loading,
    error,
    setLoading,
    setError,
    setAttributeOptions,
    clearError,
    removeAttributeOption,
  } = useAttributeOptionStore();

  useEffect(() => {
    loadAttributeOptions();
  }, [attributeId]);

  const loadAttributeOptions = async () => {
    try {
      await getAttributeOptions({ attributeId });
    } catch (err) {
      console.error("Failed to load attribute options:", err);
    }
  };

  const getAttributeOptions = useCallback(
    async (query: AttributeOptionQuery = {}): Promise<AttributeOption[]> => {
      setLoading(true);
      clearError();

      try {
        const result = await db.allDocs({
          include_docs: true,
          startkey: "opt_:",
          endkey: ":\uffff",
        });

        let attributeOptions = result.rows.map(
          (row) => row.doc as unknown as AttributeOption,
        );

        // Filter by attributeId if provided
        if (query.attributeId) {
          attributeOptions = attributeOptions.filter(
            (option) => option.attributeId === query.attributeId,
          );
        }        

        // Apply pagination
        if (query.skip) {
          attributeOptions = attributeOptions.slice(query.skip);
        }
        if (query.limit) {
          attributeOptions = attributeOptions.slice(0, query.limit);
        }

        setAttributeOptions(attributeOptions);
        return attributeOptions;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to get attribute options";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, setAttributeOptions, setError],
  );

  const refreshAttributeOptions = useCallback(async (): Promise<
    AttributeOption[]
  > => {
    return getAttributeOptions({ attributeId });
  }, [getAttributeOptions]);

  const deleteAttributeOption = useCallback(
    async (id: string): Promise<void> => {
      setLoading(true);
      clearError();

      try {
        const doc = await db.get(id);
        await db.remove(doc);
        removeAttributeOption(id);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to delete attribute option";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, removeAttributeOption, setError],
  );

  return {
    attributeOptions,
    loading,
    error,
    getAttributeOptions,
    refreshAttributeOptions,
    deleteAttributeOption,
  };
}
