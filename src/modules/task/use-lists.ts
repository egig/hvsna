import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRepository } from "./list-repository";
import { queryKeys } from "../common/query-keys";
import type {
  List,
  ListCreateInput,
  ListUpdateInput,
  ListQuery,
} from "./types";
import log from "../../lib/logger";

export function useLists() {
  const [initiated, setInitiated] = useState(false);
  const queryClient = useQueryClient();

  // Local filter state
  const [searchTextFilter, setSearchTextFilter] = useState<string>("");

  const clearFilters = useCallback(() => {
    setSearchTextFilter("");
  }, []);

  // Create filter key for React Query
  const createFilterKey = () => {
    const filterParts = [searchTextFilter || ""];
    return filterParts.join("|");
  };

  const filterKey = createFilterKey();

  // Build query object for repository
  const buildQuery = (): ListQuery => {
    const query: ListQuery = {};

    if (searchTextFilter && searchTextFilter.trim()) {
      query.searchText = searchTextFilter;
    }

    return query;
  };

  // React Query for lists
  const listsQuery = useQuery({
    queryKey: queryKeys.lists(filterKey),
    queryFn: () => listRepository.find(buildQuery()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create list mutation
  const createListMutation = useMutation({
    mutationFn: (input: ListCreateInput) => listRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists("") });
    },
    onError: (error) => {
      log.error("Failed to create list:", error);
    },
  });

  // Update list mutation
  const updateListMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ListUpdateInput }) =>
      listRepository.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists("") });
    },
    onError: (error) => {
      log.error("Failed to update list:", error);
    },
  });

  // Delete list mutation
  const deleteListMutation = useMutation({
    mutationFn: ({ id, deleteTasks }: { id: string; deleteTasks?: boolean }) =>
      listRepository.delete(id, deleteTasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists("") });
    },
    onError: (error) => {
      log.error("Failed to delete list:", error);
    },
  });

  // Get single list
  const getList = useCallback(async (id: string): Promise<List | null> => {
    try {
      return await listRepository.findById(id);
    } catch (error) {
      log.error("Failed to get list:", error);
      return null;
    }
  }, []);

  // Create list
  const createList = useCallback(
    async (input: ListCreateInput): Promise<List | null> => {
      try {
        return await createListMutation.mutateAsync(input);
      } catch (error) {
        log.error("Failed to create list:", error);
        return null;
      }
    },
    [createListMutation],
  );

  // Update list
  const updateList = useCallback(
    async (id: string, input: ListUpdateInput): Promise<List | null> => {
      try {
        return await updateListMutation.mutateAsync({ id, input });
      } catch (error) {
        log.error("Failed to update list:", error);
        return null;
      }
    },
    [updateListMutation],
  );

  // Delete list
  const deleteList = useCallback(
    async (id: string, deleteTasks?: boolean): Promise<boolean> => {
      try {
        await deleteListMutation.mutateAsync({ id, deleteTasks });
        return true;
      } catch (error) {
        log.error("Failed to delete list:", error);
        return false;
      }
    },
    [deleteListMutation],
  );

  // Refresh lists
  const refreshLists = useCallback(() => {
    listsQuery.refetch();
  }, [listsQuery]);

  // Initialize on mount
  useEffect(() => {
    setInitiated(true);
  }, []);

  return {
    // Data
    lists: listsQuery.data || [],
    loading: listsQuery.isPending,
    initiated,
    error: listsQuery.error
      ? listsQuery.error instanceof Error
        ? listsQuery.error.message
        : "Unknown error"
      : null,

    // Mutations loading states
    creating: createListMutation.isPending,
    updating: updateListMutation.isPending,
    deleting: deleteListMutation.isPending,

    // Filter state
    searchTextFilter,

    // Actions
    getList,
    createList,
    updateList,
    deleteList,
    refreshLists,

    // Filter actions
    setSearchTextFilter,
    clearFilters,
  };
}
