import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import { queryKeys } from "../query-keys";
import type {
  TrackerCreateInput,
  TrackerUpdateInput,
} from "../../domain/tracker/ITrackerRepository";

export function useTrackers() {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createTrackerUseCases(db), [db]);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.trackers() });
  };

  const query = useQuery({
    queryKey: queryKeys.trackers(),
    queryFn: () => useCases.getTrackers(),
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: (input: TrackerCreateInput) => useCases.createTracker(input),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TrackerUpdateInput }) =>
      useCases.updateTracker(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => useCases.deleteTracker(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.trackers() });
      queryClient.invalidateQueries({ queryKey: ["tracker-logs"] });
      queryClient.invalidateQueries({ queryKey: ["tracker-stats"] });
    },
  });

  return {
    ...query,
    createTracker: (input: TrackerCreateInput) =>
      createMutation.mutateAsync(input),
    updateTracker: (id: string, input: TrackerUpdateInput) =>
      updateMutation.mutateAsync({ id, input }),
    deleteTracker: (id: string) => deleteMutation.mutateAsync(id),
  };
}
