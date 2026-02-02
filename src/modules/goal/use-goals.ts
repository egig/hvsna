import { useCallback, useEffect } from "react";
import { useGoalStore } from "./goalStore";
import type { Goal, GoalQuery } from "./use-goal";
import { usePouchDB } from "src/pouchdb";

export interface UseGoalsReturn {
  loading: boolean;
  error: string | null;
  goals: Goal[];
  getGoals: (query?: GoalQuery) => Promise<Goal[]>;
  refreshGoals: () => Promise<Goal[]>;
}

export function useGoals(): UseGoalsReturn {
  const { db } = usePouchDB();
  const store = useGoalStore();

  useEffect(() => {
    getGoals();
  }, []);

  const getGoals = useCallback(
    async (query: GoalQuery = {}): Promise<Goal[]> => {
      return store.getGoalsFromDB(query, db);
    },
    [store, db],
  );

  const refreshGoals = useCallback(async (): Promise<Goal[]> => {
    return getGoals();
  }, [getGoals]);

  return {
    loading: store.loading,
    error: store.error,
    goals: store.goals,
    getGoals,
    refreshGoals,
  };
}
