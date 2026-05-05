import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import { queryKeys } from "../query-keys";
import { useHijriDate } from "../calendar/hijri/use-hijri-date";

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function useTrackerStats(trackerId: string, todayTimestamp?: number) {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createTrackerUseCases(db), [db]);
  const dayKey = todayTimestamp ? startOfDay(todayTimestamp) : undefined;
  const { currentHijriDate } = useHijriDate();
  const weekStartDay = currentHijriDate._startOfWeek ?? 5;

  return useQuery({
    queryKey: [...queryKeys.trackerStats(trackerId), dayKey, weekStartDay],
    queryFn: () => useCases.getStats(trackerId, dayKey, weekStartDay),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(trackerId),
  });
}
