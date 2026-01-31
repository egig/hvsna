import { useCallback, useEffect, useState } from "react";
import { useTargetStore } from "../target/targetStore";
import type {
  Target,
  TargetCreateInput,
  TargetUpdateInput,
} from "../target/targetStore";
import type { UUID } from "crypto";
import { usePouchDB } from "~/.client/pouchdb";

export interface UseTargetReturn {
  loading: boolean;
  error: string | null;
  createTarget: (input: TargetCreateInput) => Promise<Target>;
  updateTarget: (id: string, input: TargetUpdateInput) => Promise<Target>;
  deleteTarget: (id: string) => Promise<void>;
  getTarget: (id: string) => Promise<Target>;
  target: Target | null;
}

export function useTarget(targetId: string): UseTargetReturn {
  const { db } = usePouchDB();
  const store = useTargetStore();
  const [target, setTarget] = useState<Target | null>(null);

  useEffect(() => {
    if (targetId) {
      store.getTargetFromDB(targetId, db).then(setTarget);
    }
  }, [targetId]);

  const createTarget = useCallback(
    async (input: TargetCreateInput): Promise<Target> => {
      return store.createTarget(input, db);
    },
    [store, db],
  );

  const updateTarget = useCallback(
    async (id: string, input: TargetUpdateInput): Promise<Target> => {
      return store.updateTargetInDB(id, input, db);
    },
    [store, db],
  );

  const deleteTarget = useCallback(
    async (id: string): Promise<void> => {
      return store.deleteTargetFromDB(id, db);
    },
    [store, db],
  );

  const getTarget = useCallback(
    async (id: string): Promise<Target> => {
      return store.getTargetFromDB(id, db);
    },
    [store, db],
  );

  return {
    loading: store.loading,
    error: store.error,
    createTarget,
    updateTarget,
    deleteTarget,
    getTarget,
    target,
  };
}

// Re-export types from the store
export type {
  Target,
  TargetCreateInput,
  TargetUpdateInput,
  TargetQuery,
  TargetType,
  TargetCalculation,
  TargetDirection,
  TargetPeriod,
} from "../target/targetStore";
