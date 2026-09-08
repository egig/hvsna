import { useCallback, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useTaskRepository } from "./use-task-repository";
import { queryKeys } from "../query-keys";
import { useCompletionGrace } from "./completion-grace-context";

const PAGE_SIZE = 10;

export function useCompletedTasks() {
  const taskRepo = useTaskRepository();

  const query = useInfiniteQuery({
    queryKey: queryKeys.completedTasks(),
    queryFn: ({ pageParam }) => taskRepo.findAllCompleted(pageParam, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got a full page, return next offset
      return lastPage.length === PAGE_SIZE
        ? allPages.length * PAGE_SIZE
        : undefined;
    },
    staleTime: 1000 * 60 * 2,
  });

  const { suppress, snapshot } = useCompletionGrace();

  // Flatten all pages into single array; hide rows still lingering in their
  // pending list under the completion grace so they don't render twice.
  const tasks = useMemo(
    () => suppress(query.data?.pages.flat() ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [query.data, snapshot]
  );

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  return {
    tasks,
    loading: query.isPending,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Unknown error"
      : null,
    loadMore,
    hasMore: query.hasNextPage,
    isLoadingMore: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
