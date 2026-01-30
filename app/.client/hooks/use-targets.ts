import { useCallback, useEffect } from "react";
import { usePouchDB } from "../contexts/PouchDB";
import { useTargetStore } from "../stores/targetStore";
import type { Target, TargetQuery } from "./use-target";

export interface UseTargetsReturn {
  loading: boolean;
  error: string | null;
  targets: Target[];
  getTargets: (query?: TargetQuery) => Promise<Target[]>;
  refreshTargets: () => Promise<Target[]>;
}

export function useTargets(): UseTargetsReturn {
  const { db } = usePouchDB();
  const store = useTargetStore();

  useEffect(() => {
    getTargets();
  }, []);

  const getTargets = useCallback(
    async (query: TargetQuery = {}): Promise<Target[]> => {
      return store.getTargetsFromDB(query, db);
    },
    [store, db],
  );

  const refreshTargets = useCallback(async (): Promise<Target[]> => {
    return getTargets();
  }, [getTargets]);

  return {
    loading: store.loading,
    error: store.error,
    targets: store.targets,
    getTargets,
    refreshTargets,
  };
}
