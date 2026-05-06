import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function useTrackerEvaluationResult(
  trackerId: string,
  evaluationId: string,
  todayTimestamp?: number
) {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createTrackerUseCases(db), [db]);
  const dayKey = todayTimestamp
    ? startOfDay(todayTimestamp)
    : startOfDay(Date.now());

  return useQuery({
    queryKey: ["tracker-eval-result", trackerId, evaluationId, dayKey],
    queryFn: () =>
      useCases.getEvaluationResult(trackerId, evaluationId, dayKey),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(trackerId) && Boolean(evaluationId),
  });
}
