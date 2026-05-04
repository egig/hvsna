import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import { queryKeys } from "../query-keys";

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function useTrackerStats(trackerId: string, todayTimestamp?: number) {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createTrackerUseCases(db), [db]);
  const dayKey = todayTimestamp ? startOfDay(todayTimestamp) : undefined;

  return useQuery({
    queryKey: [...queryKeys.trackerStats(trackerId), dayKey],
    queryFn: () => useCases.getStats(trackerId, dayKey),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(trackerId),
  });
}
