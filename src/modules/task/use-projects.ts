import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectRepository } from "./project-repository";
import { queryKeys } from "../query-keys";
import type {
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectQuery,
} from "./types";
import log from "../logger";

export function useProjects() {
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
  const buildQuery = (): ProjectQuery => {
    const query: ProjectQuery = {};

    if (searchTextFilter && searchTextFilter.trim()) {
      query.searchText = searchTextFilter;
    }

    return query;
  };

  // React Query for projects
  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(filterKey),
    queryFn: () => projectRepository.find(buildQuery()),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: (input: ProjectCreateInput) => projectRepository.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects("") });
    },
    onError: (error) => {
      log.error("Failed to create project:", error);
    },
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProjectUpdateInput }) =>
      projectRepository.update(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects("") });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(id) });
    },
    onError: (error) => {
      log.error("Failed to update project:", error);
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: ({ id, deleteTasks }: { id: string; deleteTasks?: boolean }) =>
      projectRepository.delete(id, deleteTasks),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects("") });
      queryClient.invalidateQueries({ queryKey: queryKeys.project(id) });
    },
    onError: (error) => {
      log.error("Failed to delete project:", error);
    },
  });

  const getProject = useCallback(
    async (id: string): Promise<Project | null> => {
      try {
        const result = await queryClient.fetchQuery({
          queryKey: queryKeys.project(id),
          queryFn: () => projectRepository.findById(id),
          staleTime: 1000 * 60 * 5, // 5 minutes
        });
        return result;
      } catch (error) {
        log.error("Failed to get project:", error);
        return null;
      }
    },
    [queryClient]
  );

  // Create project
  const createProject = useCallback(
    async (input: ProjectCreateInput): Promise<Project | null> => {
      try {
        return await createProjectMutation.mutateAsync(input);
      } catch (error) {
        log.error("Failed to create project:", error);
        return null;
      }
    },
    [createProjectMutation]
  );

  // Update project
  const updateProject = useCallback(
    async (id: string, input: ProjectUpdateInput): Promise<Project | null> => {
      try {
        return await updateProjectMutation.mutateAsync({ id, input });
      } catch (error) {
        log.error("Failed to update project:", error);
        return null;
      }
    },
    [updateProjectMutation]
  );

  // Delete project
  const deleteProject = useCallback(
    async (id: string, deleteTasks?: boolean): Promise<boolean> => {
      try {
        await deleteProjectMutation.mutateAsync({ id, deleteTasks });
        return true;
      } catch (error) {
        log.error("Failed to delete project:", error);
        return false;
      }
    },
    [deleteProjectMutation]
  );

  // Refresh projects
  const refreshProjects = useCallback(() => {
    projectsQuery.refetch();
  }, [projectsQuery]);

  // Initialize on mount
  useEffect(() => {
    setInitiated(true);
  }, []);

  return {
    // Data
    projects: projectsQuery.data || [],
    loading: projectsQuery.isPending,
    initiated,
    error: projectsQuery.error
      ? projectsQuery.error instanceof Error
        ? projectsQuery.error.message
        : "Unknown error"
      : null,

    // Mutations loading states
    creating: createProjectMutation.isPending,
    updating: updateProjectMutation.isPending,
    deleting: deleteProjectMutation.isPending,

    // Filter state
    searchTextFilter,

    // Actions
    getProject,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects,

    // Filter actions
    setSearchTextFilter,
    clearFilters,
  };
}
