import { useMutation } from "@tanstack/react-query";
import { useInvalidateTaskQueries } from "./use-invalidate-task-queries";
import type {
  RecurringTask,
  RecurringTaskCreateInput,
  RecurringTaskQuery,
  RecurringTaskUpdateInput,
} from "./recurring-task";
import { useRecurringTaskRepository } from "./use-recurring-task-repository";

export function useRecurringTasks() {
  const invalidateTaskQueries = useInvalidateTaskQueries();

  const recurringRepo = useRecurringTaskRepository();

  const createRecurringTaskMutation = useMutation({
    mutationFn: (input: RecurringTaskCreateInput) =>
      recurringRepo.create(input),
    onSuccess: () => {
      invalidateTaskQueries();
    },
    onError: (error) => {
      console.error("Failed to create recurring task:", error);
      throw error;
    },
  });

  const getRecurringTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const recurringTask = await recurringRepo.findById(id);
      if (!recurringTask) {
        throw new Error("Recurring task not found");
      }
      return recurringTask;
    },
    onError: (error) => {
      console.error("Failed to get recurring task:", error);
      throw error;
    },
  });

  const getRecurringTasksMutation = useMutation({
    mutationFn: (query?: RecurringTaskQuery) =>
      recurringRepo.find(query),
    onError: (error) => {
      console.error("Failed to get recurring tasks:", error);
      throw error;
    },
  });

  const updateRecurringTaskMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: RecurringTaskUpdateInput;
    }) => recurringRepo.update(id, input),
    onSuccess: () => {
      invalidateTaskQueries();
    },
    onError: (error) => {
      console.error("Failed to update recurring task:", error);
      throw error;
    },
  });

  const deleteRecurringTaskMutation = useMutation({
    mutationFn: (id: string) => recurringRepo.delete(id),
    onError: (error) => {
      console.error("Failed to delete recurring task:", error);
      throw error;
    },
  });

  return {
    createRecurringTask: (input: RecurringTaskCreateInput) =>
      createRecurringTaskMutation.mutateAsync(input),
    getRecurringTask: (id: string) => getRecurringTaskMutation.mutateAsync(id),
    getRecurringTasks: (query?: RecurringTaskQuery) =>
      getRecurringTasksMutation.mutateAsync(query),
    updateRecurringTask: (id: string, input: RecurringTaskUpdateInput) =>
      updateRecurringTaskMutation.mutateAsync({ id, input }),
    deleteRecurringTask: (id: string) =>
      deleteRecurringTaskMutation.mutateAsync(id),
    loading:
      createRecurringTaskMutation.isPending ||
      getRecurringTaskMutation.isPending ||
      getRecurringTasksMutation.isPending ||
      updateRecurringTaskMutation.isPending ||
      deleteRecurringTaskMutation.isPending,
    error:
      createRecurringTaskMutation.error?.message ??
      getRecurringTaskMutation.error?.message ??
      getRecurringTasksMutation.error?.message ??
      updateRecurringTaskMutation.error?.message ??
      deleteRecurringTaskMutation.error?.message ??
      null,
  };
}
