import { useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";
import { useAllTasks } from "./use-all-tasks";
import log from "../logger";

export interface TagInfo {
  name: string;
  count: number;
}

export interface UseTagsOptions {
  limit?: number;
}

export function useTags(options?: UseTagsOptions) {
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);
  const queryClient = useQueryClient();
  const limit = options?.limit;

  const allTasksQuery = useAllTasks();
  const tasks = allTasksQuery.data || [];

  // Extract unique tags with usage counts
  const tags = useMemo<TagInfo[]>(() => {
    const tagCounts = new Map<string, number>();

    for (const task of tasks) {
      if (task.tags && Array.isArray(task.tags)) {
        for (const tag of task.tags) {
          const normalized = normalizeTag(tag);
          if (normalized) {
            tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1);
          }
        }
      }
    }

    let result = Array.from(tagCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (limit && result.length > limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [tasks, limit]);

  const tagNames = useMemo(() => tags.map((t) => t.name), [tags]);

  const refreshTags = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.allTasks() });
    queryClient.invalidateQueries({ queryKey: ["browsed-tasks"] });
  }, [queryClient]);

  // Rename a tag across all tasks
  const renameTag = useCallback(
    async (oldName: string, newName: string): Promise<void> => {
      const normalizedNew = normalizeTag(newName);
      if (!normalizedNew) {
        throw new Error("Invalid tag name");
      }
      if (oldName === normalizedNew) {
        return;
      }

      const tasksToUpdate = tasks.filter(
        (task) =>
          task.tags?.includes(oldName) && !task.tags?.includes(normalizedNew)
      );

      for (const task of tasksToUpdate) {
        const updatedTags = task.tags!.map((tag) =>
          tag === oldName ? normalizedNew : tag
        );
        try {
          await taskUseCases.updateTask(task.id!, { tags: updatedTags });
        } catch (err) {
          log.error(`Failed to update tag on task ${task.id}:`, err);
        }
      }

      refreshTags();
    },
    [tasks, taskUseCases, refreshTags]
  );

  // Delete a tag from all tasks
  const deleteTag = useCallback(
    async (tagName: string): Promise<void> => {
      const tasksToUpdate = tasks.filter((task) =>
        task.tags?.includes(tagName)
      );

      for (const task of tasksToUpdate) {
        const updatedTags = task.tags!.filter((tag) => tag !== tagName);
        try {
          await taskUseCases.updateTask(task.id!, {
            tags: updatedTags.length > 0 ? updatedTags : null,
          });
        } catch (err) {
          log.error(`Failed to remove tag from task ${task.id}:`, err);
        }
      }

      refreshTags();
    },
    [tasks, taskUseCases, refreshTags]
  );

  return {
    tags,
    tagNames,
    loading: allTasksQuery.isPending,
    error: allTasksQuery.error
      ? allTasksQuery.error instanceof Error
        ? allTasksQuery.error.message
        : "Unknown error"
      : null,
    refreshTags,
    renameTag,
    deleteTag,
  };
}

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}
