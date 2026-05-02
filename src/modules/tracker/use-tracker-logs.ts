import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import { queryKeys } from "../query-keys";
import type { TrackerLogCreateInput } from "../../domain/tracker/ITrackerRepository";

export function useTrackerLogs(trackerId: string) {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createTrackerUseCases(db), [db]);
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.trackerLogs(trackerId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.trackerStats(trackerId) });
  };

  const query = useQuery({
    queryKey: queryKeys.trackerLogs(trackerId),
    queryFn: () => useCases.getLogs({ trackerId }),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(trackerId),
  });

  const createMutation = useMutation({
    mutationFn: (input: TrackerLogCreateInput) => useCases.createLog(input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => useCases.deleteLog(id),
    onSuccess: invalidate,
  });

  return {
    ...query,
    createLog: (input: TrackerLogCreateInput) => createMutation.mutateAsync(input),
    deleteLog: (id: string) => deleteMutation.mutateAsync(id),
  };
}
