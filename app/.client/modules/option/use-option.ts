import { useCallback, useEffect, useState } from "react";
import { useAttributeOptionStore } from "./optionStore";
import type {
  AttributeOption,
  AttributeOptionCreateInput,
  AttributeOptionUpdateInput,
} from "./optionStore";
import { usePouchDB } from "~/.client/pouchdb";

export function useAttributeOption(attributeOptionId?: string) {
  const { db } = usePouchDB();
  const [attributeOption, setAttributeOption] =
    useState<AttributeOption | null>(null);

  const {
    loading,
    error,
    setLoading,
    setError,
    addAttributeOption,
    updateAttributeOption: updateAttributeOptionInStore,
    removeAttributeOption,
    clearError,
  } = useAttributeOptionStore();

  useEffect(() => {
    if (attributeOptionId) {
      getAttributeOption(attributeOptionId)
        .then((fetchedAttributeOption) => {
          if (fetchedAttributeOption) {
            setAttributeOption(fetchedAttributeOption);
          }
        })
        .catch(() => {
          // Handle error silently or show error
        });
    }
  }, [attributeOptionId]);

  const createAttributeOption = useCallback(
    async (input: AttributeOptionCreateInput): Promise<AttributeOption> => {
      setLoading(true);
      clearError();

      try {
        const attributeOption: AttributeOption = {
          id: `opt_:${crypto.randomUUID()}`,
          ...input,
          createdAt: Date.now(),
        };

        await db.put({
          _id: attributeOption.id,
          ...attributeOption,
        });

        addAttributeOption(attributeOption);
        return attributeOption;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to create attribute option";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, addAttributeOption, setError],
  );

  const updateAttributeOption = useCallback(
    async (
      id: string,
      input: AttributeOptionUpdateInput,
    ): Promise<AttributeOption> => {
      setLoading(true);
      clearError();

      try {
        const doc = await db.get(id);
        const updatedAttributeOption: AttributeOption = {
          ...(doc as unknown as AttributeOption),
          ...input,
        };

        await db.put({
          ...updatedAttributeOption,
          _id: id,
          _rev: doc._rev,
        });

        updateAttributeOptionInStore(id, updatedAttributeOption);
        return updatedAttributeOption;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update attribute option";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, updateAttributeOptionInStore, setError],
  );

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

  const getAttributeOption = useCallback(
    async (id: string): Promise<AttributeOption> => {
      setLoading(true);
      clearError();

      try {
        const doc = await db.get(id);
        return doc as unknown as AttributeOption;
      } catch (err) {
        if ((err as any).status === 404) {
          throw new Error("Attribute option not found");
        }
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to get attribute option";
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db, setLoading, clearError, setError],
  );

  return {
    attributeOption,
    loading,
    error,
    createAttributeOption,
    updateAttributeOption,
    deleteAttributeOption,
    getAttributeOption,
  };
}
