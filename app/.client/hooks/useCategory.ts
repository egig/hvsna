import { useCallback, useState } from "react";
import { usePouchDB } from "../contexts/PouchDB";
import type { UUID, EpochTime } from "../../lib/tracker/types";

export interface Category {
  id: UUID;
  name: string;
  createdAt: EpochTime;
}

export interface CategoryCreateInput {
  name: string;
}

export interface CategoryUpdateInput {
  name?: string;
}

export interface CategoryQuery {
  limit?: number;
  skip?: number;
}

export function useCategory() {
  const { db } = usePouchDB();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = useCallback(
    async (input: CategoryCreateInput): Promise<Category> => {
      setLoading(true);
      setError(null);

      try {
        const category: Category = {
          id: `category_${crypto.randomUUID()}`,
          ...input,
          createdAt: Date.now(),
        };

        await db.put({
          _id: category.id,
          ...category,
        });

        return category;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create category",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const updateCategory = useCallback(
    async (id: UUID, input: CategoryUpdateInput): Promise<Category> => {
      setLoading(true);
      setError(null);

      try {
        const doc = await db.get(id);
        const updatedCategory: Category = {
          ...doc,
          ...input,
        };

        await db.put({
          ...updatedCategory,
          _id: id,
          _rev: doc._rev,
        });

        return updatedCategory;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update category",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const deleteCategory = useCallback(
    async (id: UUID): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const doc = await db.get(id);
        await db.remove(doc);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to delete category",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const getCategory = useCallback(
    async (id: UUID): Promise<Category> => {
      setLoading(true);
      setError(null);

      try {
        const doc = await db.get(id);
        return doc as Category;
      } catch (err) {
        if ((err as any).status === 404) {
          throw new Error("Category not found");
        }
        setError(err instanceof Error ? err.message : "Failed to get category");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const getCategories = useCallback(
    async (query: CategoryQuery = {}): Promise<Category[]> => {
      setLoading(true);
      setError(null);

      try {
        const result = await db.allDocs({
          include_docs: true,
          startkey: "category_",
          endkey: "category_\uffff",
        });

        let categories = result.rows
          .filter((row: any) => row.id.startsWith("category_"))
          .map((row: any) => row.doc as Category);

        // Sort by name
        categories.sort((a: Category, b: Category) =>
          a.name.localeCompare(b.name),
        );

        // Apply pagination
        if (query.skip) {
          categories = categories.slice(query.skip);
        }
        if (query.limit) {
          categories = categories.slice(0, query.limit);
        }

        return categories;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get categories",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [db],
  );

  const refreshCategories = useCallback(async (): Promise<Category[]> => {
    return getCategories();
  }, [getCategories]);

  return {
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategory,
    getCategories,
    refreshCategories,
  };
}
