import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { EpochTime, UUID } from "src/lib/tracker/types";

export interface Goal {
  id: string;
  name: string;
  trackerId: string;
  type: GoalType;
  calculation: GoalCalculation;
  direction: GoalDirection;
  value: number;
  valueMax?: number;
  period?: GoalPeriod;
  scope: string[];
  createdAt: EpochTime;
}

export type GoalType = "static" | "range";
export type GoalCalculation =
  | "sum"
  | "count"
  | "last"
  | "avg"
  | "min"
  | "max";
export type GoalDirection = "increase" | "decrease" | "neutral";
export type GoalPeriod =
  | "log"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "total";

export interface GoalCreateInput {
  trackerId: string;
  type: GoalType;
  calculation: GoalCalculation;
  direction: GoalDirection;
  value: number;
  valueMax?: number;
  period?: GoalPeriod;
  scope: string[];
}

export interface GoalUpdateInput {
  type?: GoalType;
  calculation?: GoalCalculation;
  direction?: GoalDirection;
  value?: number;
  valueMax?: number;
  period?: GoalPeriod;
  scope?: string[];
}

export interface GoalQuery {
  trackerId?: string;
  type?: GoalType;
  calculation?: GoalCalculation;
  direction?: GoalDirection;
  period?: GoalPeriod;
  limit?: number;
  skip?: number;
}

interface PouchDBGoalDocument {
  _id: string;
  _rev?: string;
  id: string;
  trackerId: string;
  type: GoalType;
  calculation: GoalCalculation;
  direction: GoalDirection;
  value: number;
  valueMax?: number;
  period?: GoalPeriod;
  scope: string[];
  createdAt: EpochTime;
}

interface GoalState {
  goals: Goal[];
  currentGoal: Goal | null;
  loading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setGoals: (goals: Goal[]) => void;
  setCurrentGoal: (goal: Goal | null) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  removeGoal: (id: string) => void;
  clearError: () => void;
  reset: () => void;

  // Async actions that take db as parameter
  createGoal: (input: GoalCreateInput, db: any) => Promise<Goal>;
  updateGoalInDB: (
    id: string,
    input: GoalUpdateInput,
    db: any,
  ) => Promise<Goal>;
  deleteGoalFromDB: (id: string, db: any) => Promise<void>;
  getGoalFromDB: (id: string, db: any) => Promise<Goal>;
  getGoalsFromDB: (query?: GoalQuery, db?: any) => Promise<Goal[]>;
}

export const useGoalStore = create<GoalState>()(
  devtools(
    (set, get) => ({
      goals: [],
      currentGoal: null,
      loading: false,
      error: null,

      setLoading: (loading) => set({ loading }, false, "setLoading"),
      setError: (error) => set({ error }, false, "setError"),
      setGoals: (goals) => set({ goals }, false, "setGoals"),
      setCurrentGoal: (goal) =>
        set({ currentGoal: goal }, false, "setCurrentGoal"),

      addGoal: (goal) =>
        set(
          (state) => ({ goals: [...state.goals, goal] }),
          false,
          "addGoal",
        ),

      updateGoal: (id, updates) =>
        set(
          (state) => ({
            goals: state.goals.map((goal) =>
              goal.id === id ? { ...goal, ...updates } : goal,
            ),
            currentGoal:
              state.currentGoal?.id === id
                ? { ...state.currentGoal, ...updates }
                : state.currentGoal,
          }),
          false,
          "updateGoal",
        ),

      removeGoal: (id) =>
        set(
          (state) => ({
            goals: state.goals.filter((goal) => goal.id !== id),
            currentGoal:
              state.currentGoal?.id === id ? null : state.currentGoal,
          }),
          false,
          "removeGoal",
        ),

      clearError: () => set({ error: null }, false, "clearError"),
      reset: () =>
        set(
          { goals: [], currentGoal: null, loading: false, error: null },
          false,
          "reset",
        ),

      createGoal: async (
        input: GoalCreateInput,
        db: any,
      ): Promise<Goal> => {
        try {
          set({ loading: true, error: null });

          const goal: Goal = {
            id: `goal_${crypto.randomUUID()}`,
            name: "",
            ...input,
            createdAt: Date.now(),
          };

          const doc: PouchDBGoalDocument = {
            _id: goal.id,
            ...goal,
          };

          await db.put(doc);

          // Add to local state
          get().addGoal(goal);
          set({ currentGoal: goal });

          return goal;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to create goal";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      updateGoalInDB: async (
        id: UUID,
        input: GoalUpdateInput,
        db: any,
      ): Promise<Goal> => {
        try {
          set({ loading: true, error: null });

          const doc = await db.get(id);
          const updatedGoal: Goal = {
            ...(doc as unknown as Goal),
            ...input,
          };

          await db.put({
            ...updatedGoal,
            _id: id,
            _rev: doc._rev,
          });

          // Update local state
          get().updateGoal(id, updatedGoal);

          return updatedGoal;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to update goal";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      deleteGoalFromDB: async (id: UUID, db: any): Promise<void> => {
        try {
          set({ loading: true, error: null });

          const doc = await db.get(id);
          await db.remove(doc);

          // Remove from local state
          get().removeGoal(id);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to delete goal";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      getGoalFromDB: async (id: UUID, db: any): Promise<Goal> => {
        try {
          set({ loading: true, error: null });

          const doc = await db.get(id);
          const goal = doc as unknown as Goal;

          set({ currentGoal: goal });
          return goal;
        } catch (err) {
          if ((err as any).status === 404) {
            throw new Error("Goal not found");
          }
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get goal";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      getGoalsFromDB: async (
        query: GoalQuery = {},
        db?: any,
      ): Promise<Goal[]> => {
        if (!db) {
          throw new Error("Database instance is required");
        }

        try {
          set({ loading: true, error: null });

          const result = await db.allDocs({
            include_docs: true,
            startkey: "goal_",
            endkey: "goal_\uffff",
          });

          let goals = result.rows
            .filter((row: any) => row.id.startsWith("goal_"))
            .map((row: any) => row.doc as unknown as Goal);

          // Apply filters
          if (query.trackerId) {
            goals = goals.filter(
              (g: Goal) => g.trackerId === query.trackerId,
            );
          }
          if (query.type) {
            goals = goals.filter((g: Goal) => g.type === query.type);
          }
          if (query.calculation) {
            goals = goals.filter(
              (g: Goal) => g.calculation === query.calculation,
            );
          }
          if (query.direction) {
            goals = goals.filter(
              (g: Goal) => g.direction === query.direction,
            );
          }
          if (query.period) {
            goals = goals.filter((g: Goal) => g.period === query.period);
          }

          // Apply pagination
          if (query.skip) {
            goals = goals.slice(query.skip);
          }
          if (query.limit) {
            goals = goals.slice(0, query.limit);
          }

          set({ goals });
          return goals;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get goals";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "goal-store",
    },
  ),
);
