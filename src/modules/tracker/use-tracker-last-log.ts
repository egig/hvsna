import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePouchDB } from "../../pouchdb";
import { createTrackerUseCases } from "../../usecases/tracker/TrackerUseCasesFactory";
import { queryKeys } from "../query-keys";

export function useTrackerLastLog(trackerId: string) {
  const { db } = usePouchDB();
  const useCases = useMemo(() => createTrackerUseCases(db), [db]);

  return useQuery({
    queryKey: queryKeys.trackerLastLog(trackerId),
    queryFn: async () => {
      const logs = await useCases.getLogs({ trackerId });
      if (!logs.length) return null;
      const sorted = [...logs].sort(
        (a, b) =>
          (b.occurredAt ?? b.createdAt ?? 0) -
          (a.occurredAt ?? a.createdAt ?? 0)
      );
      return sorted[0];
    },
    staleTime: 1000 * 60 * 2,
    enabled: Boolean(trackerId),
  });
}
