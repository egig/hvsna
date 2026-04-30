import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";
import type { Task } from "./types";
import log from "../logger";

export interface UseProjectTasksOptions {
  projectId: string;
  limit?: number;
  enabled?: boolean;
}

export function useProjectTasks({
  projectId,
  limit = 50,
  enabled = true,
}: UseProjectTasksOptions) {
  const [initiated, setInitiated] = useState(false);
  const queryClient = useQueryClient();
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);

  // React Query for list tasks
  const projectTasksQuery = useQuery({
    queryKey: queryKeys.projectTasks(projectId),
    queryFn: () => taskUseCases.getTasksByProjectId(projectId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: enabled && Boolean(projectId && projectId.trim() !== ""),
  });

  // Check if there are more tasks
  const hasMore = Boolean(
    projectTasksQuery.data &&
      projectTasksQuery.data.length >= limit &&
      projectTasksQuery.data.length > 0 &&
      !projectTasksQuery.isFetching &&
      !projectTasksQuery.isPending
  );

  // Load more tasks (pagination)
  const loadMoreTasks = useCallback(async () => {
    const currentData = projectTasksQuery.data || [];
    const currentLength = currentData.length;

    if (projectTasksQuery.isFetching || projectTasksQuery.isPending || !hasMore) {
      return;
    }

    try {
      const newTasks = await taskUseCases.getTasksByProjectId(projectId);

      // Update query data with new tasks
      queryClient.setQueryData(queryKeys.projectTasks(projectId), [
        ...currentData,
        ...newTasks,
      ]);

      return newTasks;
    } catch (error) {
      log.error("Failed to load more project tasks:", error);
      throw error;
    }
  }, [
    projectTasksQuery.data,
    projectTasksQuery.isFetching,
    projectTasksQuery.isPending,
    hasMore,
    projectId,
    limit,
    queryClient,
  ]);

  // Refresh tasks
  const refreshTasks = useCallback(() => {
    return projectTasksQuery.refetch();
  }, [projectTasksQuery]);

  // Initialize on mount
  useEffect(() => {
    setInitiated(true);
  }, []);

  return {
    // Data
    tasks: projectTasksQuery.data || [],
    loading: projectTasksQuery.isPending,
    initiated,
    loadingMore: projectTasksQuery.isFetching && !projectTasksQuery.isPending,
    error: projectTasksQuery.error
      ? projectTasksQuery.error instanceof Error
        ? projectTasksQuery.error.message
        : "Unknown error"
      : null,
    hasMore,

    // Actions
    refreshTasks,
    loadMoreTasks,
  };
}
