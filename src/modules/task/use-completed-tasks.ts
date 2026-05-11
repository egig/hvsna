import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTaskUseCases } from "../../usecases/task";
import { queryKeys } from "../query-keys";

const PAGE_SIZE = 50;

export function useCompletedTasks() {
  const { db } = usePouchDB();
  const taskUseCases = createTaskUseCases(db);
  const [offset, setOffset] = useState(0);

  const query = useQuery({
    queryKey: [...queryKeys.completedTasks(), offset],
    queryFn: () => taskUseCases.getTasks({ status: 1 }),
    staleTime: 1000 * 60 * 2,
  });

  const loadMore = useCallback(() => {
    if (!query.isFetching) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [query.isFetching]);

  const handleInfiniteScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (nearBottom && !query.isFetching) {
        loadMore();
      }
    },
    [query.isFetching, loadMore]
  );

  return {
    tasks: query.data ?? [],
    loading: query.isPending,
    error: query.error
      ? query.error instanceof Error
        ? query.error.message
        : "Unknown error"
      : null,
    handleInfiniteScroll,
    refetch: query.refetch,
  };
}
