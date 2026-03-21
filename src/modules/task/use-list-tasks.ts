import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { taskRepository } from "./task-repository";
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

  // React Query for list tasks
  const listTasksQuery = useQuery({
    queryKey: queryKeys.listTasks(listId),
    queryFn: () => taskRepository.findTasksByListId(listId, 0, limit),
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
      const newTasks = await taskRepository.findTasksByListId(
        listId,
        currentLength,
        limit,
      );

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
