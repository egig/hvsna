import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import { queryKeys } from "../query-keys";

export function useTrackerStats(trackerId: string, todayDateHijri?: string) {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createTrackerUseCases(db), [db]);

  return useQuery({
    queryKey: [...queryKeys.trackerStats(trackerId), todayDateHijri],
    queryFn: () => useCases.getStats(trackerId, todayDateHijri),
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(trackerId),
  });
}
