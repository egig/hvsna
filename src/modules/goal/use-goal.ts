import { useCallback, useEffect, useState } from "react";
import { useGoalStore } from "./goalStore";
import type {
  Goal,
  GoalCreateInput,
  GoalUpdateInput,
} from "./goalStore";
import type { UUID } from "crypto";
import { usePouchDB } from "../..//pouchdb";

export interface UseGoalReturn {
  loading: boolean;
  error: string | null;
  createGoal: (input: GoalCreateInput) => Promise<Goal>;
  updateGoal: (id: string, input: GoalUpdateInput) => Promise<Goal>;
  deleteGoal: (id: string) => Promise<void>;
  getGoal: (id: string) => Promise<Goal>;
  goal: Goal | null;
}

export function useGoal(goalId?: string): UseGoalReturn {
  const { db } = usePouchDB();
  const store = useGoalStore();
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (goalId) {
      store.getGoalFromDB(goalId, db).then(setGoal);
    }
  }, [goalId]);

  const createGoal = useCallback(
    async (input: GoalCreateInput): Promise<Goal> => {
      return store.createGoal(input, db);
    },
    [store, db],
  );

  const updateGoal = useCallback(
    async (id: string, input: GoalUpdateInput): Promise<Goal> => {
      return store.updateGoalInDB(id, input, db);
    },
    [store, db],
  );

  const deleteGoal = useCallback(
    async (id: string): Promise<void> => {
      return store.deleteGoalFromDB(id, db);
    },
    [store, db],
  );

  const getGoal = useCallback(
    async (id: string): Promise<Goal> => {
      return store.getGoalFromDB(id, db);
    },
    [store, db],
  );

  return {
    loading: store.loading,
    error: store.error,
    createGoal,
    updateGoal,
    deleteGoal,
    getGoal,
    goal,
  };
}

// Re-export types from the store
export type {
  Goal,
  GoalCreateInput,
  GoalUpdateInput,
  GoalQuery,
  GoalType,
  GoalCalculation,
  GoalDirection,
  GoalPeriod,
} from "./goalStore";
