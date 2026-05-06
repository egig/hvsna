import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import { queryKeys } from "../query-keys";
import type { EvaluationConfig } from "../../domain/tracker/ITrackerRepository";

export function useTrackerEvaluations(trackerId?: string) {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createTrackerUseCases(db), [db]);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.trackers() });
    queryClient.invalidateQueries({
      queryKey: queryKeys.trackerStats(trackerId ?? ""),
    });
  };

  const trackerQuery = useQuery({
    queryKey: queryKeys.trackers(),
    queryFn: () => useCases.getTrackers(),
    staleTime: 1000 * 60 * 5,
  });

  const evaluations = trackerId
    ? trackerQuery.data?.find((t) => t.id === trackerId)?.evaluations ?? []
    : (trackerQuery.data ?? []).flatMap((t) => t.evaluations ?? []);

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      evaluations,
    }: {
      id: string;
      evaluations: EvaluationConfig[];
    }) => useCases.updateTracker(id, { evaluations }),
    onSuccess: invalidate,
  });

  return {
    data: evaluations,
    isLoading: trackerQuery.isLoading,
    isError: trackerQuery.isError,
    error: trackerQuery.error,
    updateEvaluations: (id: string, evaluations: EvaluationConfig[]) =>
      updateMutation.mutateAsync({ id, evaluations }),
  };
}
