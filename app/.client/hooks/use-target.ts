import { useCallback } from "react";
import { usePouchDB } from "../contexts/PouchDB";
import { useTargetStore } from "../stores/targetStore";
import type {
  Target,
  TargetCreateInput,
  TargetUpdateInput,
} from "../stores/targetStore";
import type { UUID } from "../../lib/tracker/types";

export interface UseTargetReturn {
  loading: boolean;
  error: string | null;
  createTarget: (input: TargetCreateInput) => Promise<Target>;
  updateTarget: (id: UUID, input: TargetUpdateInput) => Promise<Target>;
  deleteTarget: (id: UUID) => Promise<void>;
  getTarget: (id: UUID) => Promise<Target>;
}

export function useTarget(): UseTargetReturn {
  const { db } = usePouchDB();
  const store = useTargetStore();

  const createTarget = useCallback(
    async (input: TargetCreateInput): Promise<Target> => {
      return store.createTarget(input, db);
    },
    [store, db],
  );

  const updateTarget = useCallback(
    async (id: UUID, input: TargetUpdateInput): Promise<Target> => {
      return store.updateTargetInDB(id, input, db);
    },
    [store, db],
  );

  const deleteTarget = useCallback(
    async (id: UUID): Promise<void> => {
      return store.deleteTargetFromDB(id, db);
    },
    [store, db],
  );

  const getTarget = useCallback(
    async (id: UUID): Promise<Target> => {
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
  };
}

// Re-export types from the store
export type {
  Target,
  TargetCreateInput,
  TargetUpdateInput,
  TargetQuery,
  TargetType,
  TargetReducer,
  TargetDirection,
  TargetPeriod,
} from "../stores/targetStore";
