import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../use-cases/task";
import { queryKeys } from "../common/query-keys";
import type { Task } from "./types";
import log from "../../lib/logger";

export interface UseListTasksOptions {
  listId: string;
  limit?: number;
  enabled?: boolean;
}

export function useListTasks({
  listId,
  limit = 50,
  enabled = true,
}: UseListTasksOptions) {
  const [initiated, setInitiated] = useState(false);
  const queryClient = useQueryClient();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  // React Query for list tasks
  const listTasksQuery = useQuery({
    queryKey: queryKeys.listTasks(listId),
    queryFn: () => taskUseCases.getTasksByListId(listId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: enabled && Boolean(listId && listId.trim() !== ""),
  });

  // Check if there are more tasks
  const hasMore = Boolean(
    listTasksQuery.data &&
    listTasksQuery.data.length >= limit &&
    listTasksQuery.data.length > 0 &&
    !listTasksQuery.isFetching &&
    !listTasksQuery.isPending,
  );

  // Load more tasks (pagination)
  const loadMoreTasks = useCallback(async () => {
    const currentData = listTasksQuery.data || [];
    const currentLength = currentData.length;

    if (listTasksQuery.isFetching || listTasksQuery.isPending || !hasMore) {
      return;
    }

    try {
      const newTasks = await taskUseCases.getTasksByListId(listId);

      // Update query data with new tasks
      queryClient.setQueryData(queryKeys.listTasks(listId), [
        ...currentData,
        ...newTasks,
      ]);

      return newTasks;
    } catch (error) {
      log.error("Failed to load more list tasks:", error);
      throw error;
    }
  }, [
    listTasksQuery.data,
    listTasksQuery.isFetching,
    listTasksQuery.isPending,
    hasMore,
    listId,
    limit,
    queryClient,
  ]);

  // Refresh tasks
  const refreshTasks = useCallback(() => {
    return listTasksQuery.refetch();
  }, [listTasksQuery]);

  // Initialize on mount
  useEffect(() => {
    setInitiated(true);
  }, []);

  return {
    // Data
    tasks: listTasksQuery.data || [],
    loading: listTasksQuery.isPending,
    initiated,
    loadingMore: listTasksQuery.isFetching && !listTasksQuery.isPending,
    error: listTasksQuery.error
      ? listTasksQuery.error instanceof Error
        ? listTasksQuery.error.message
        : "Unknown error"
      : null,
    hasMore,

    // Actions
    refreshTasks,
    loadMoreTasks,
  };
}
