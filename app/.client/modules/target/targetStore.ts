import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { EpochTime, UUID } from "~/lib/tracker/types";

export interface Target {
  id: string;
  name: string;
  trackerId: string;
  type: TargetType;
  reducer: TargetReducer;
  direction: TargetDirection;
  value: number;
  valueMax?: number;
  period?: TargetPeriod;
  soft: boolean;
  createdAt: EpochTime;
}

export type TargetType = "static" | "range";
export type TargetReducer = "sum" | "count" | "last" | "avg" | "min" | "max";
export type TargetDirection = "increase" | "decrease" | "neutral";
export type TargetPeriod = "daily" | "weekly" | "monthly" | "yearly" | "total";

export interface TargetCreateInput {
  trackerId: string;
  type: TargetType;
  reducer: TargetReducer;
  direction: TargetDirection;
  value: number;
  valueMax?: number;
  period?: TargetPeriod;
  soft: boolean;
}

export interface TargetUpdateInput {
  type?: TargetType;
  reducer?: TargetReducer;
  direction?: TargetDirection;
  value?: number;
  valueMax?: number;
  period?: TargetPeriod;
  soft?: boolean;
}

export interface TargetQuery {
  trackerId?: string;
  type?: TargetType;
  reducer?: TargetReducer;
  direction?: TargetDirection;
  period?: TargetPeriod;
  soft?: boolean;
  limit?: number;
  skip?: number;
}

interface PouchDBTargetDocument {
  _id: string;
  _rev?: string;
  id: string;
  trackerId: string;
  type: TargetType;
  reducer: TargetReducer;
  direction: TargetDirection;
  value: number;
  valueMax?: number;
  period?: TargetPeriod;
  soft: boolean;
  createdAt: EpochTime;
}

interface TargetState {
  targets: Target[];
  currentTarget: Target | null;
  loading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTargets: (targets: Target[]) => void;
  setCurrentTarget: (target: Target | null) => void;
  addTarget: (target: Target) => void;
  updateTarget: (id: string, updates: Partial<Target>) => void;
  removeTarget: (id: string) => void;
  clearError: () => void;
  reset: () => void;

  // Async actions that take db as parameter
  createTarget: (input: TargetCreateInput, db: any) => Promise<Target>;
  updateTargetInDB: (id: string, input: TargetUpdateInput, db: any) => Promise<Target>;
  deleteTargetFromDB: (id: string, db: any) => Promise<void>;
  getTargetFromDB: (id: string, db: any) => Promise<Target>;
  getTargetsFromDB: (query?: TargetQuery, db?: any) => Promise<Target[]>;
}

export const useTargetStore = create<TargetState>()(
  devtools(
    (set, get) => ({
      targets: [],
      currentTarget: null,
      loading: false,
      error: null,

      setLoading: (loading) => set({ loading }, false, "setLoading"),
      setError: (error) => set({ error }, false, "setError"),
      setTargets: (targets) => set({ targets }, false, "setTargets"),
      setCurrentTarget: (target) => set({ currentTarget: target }, false, "setCurrentTarget"),

      addTarget: (target) =>
        set(
          (state) => ({ targets: [...state.targets, target] }),
          false,
          "addTarget",
        ),

      updateTarget: (id, updates) =>
        set(
          (state) => ({
            targets: state.targets.map((target) =>
              target.id === id ? { ...target, ...updates } : target,
            ),
            currentTarget:
              state.currentTarget?.id === id
                ? { ...state.currentTarget, ...updates }
                : state.currentTarget,
          }),
          false,
          "updateTarget",
        ),

      removeTarget: (id) =>
        set(
          (state) => ({
            targets: state.targets.filter((target) => target.id !== id),
            currentTarget: state.currentTarget?.id === id ? null : state.currentTarget,
          }),
          false,
          "removeTarget",
        ),

      clearError: () => set({ error: null }, false, "clearError"),
      reset: () => set({ targets: [], currentTarget: null, loading: false, error: null }, false, "reset"),

      createTarget: async (input: TargetCreateInput, db: any): Promise<Target> => {
        try {
          set({ loading: true, error: null });

          const target: Target = {
            id: `target:${crypto.randomUUID()}`,
            ...input,
            createdAt: Date.now(),
          };

          const doc: PouchDBTargetDocument = {
            _id: target.id,
            ...target,
          };

          await db.put(doc);

          // Add to local state
          get().addTarget(target);
          set({ currentTarget: target });

          return target;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to create target";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      updateTargetInDB: async (id: UUID, input: TargetUpdateInput, db: any): Promise<Target> => {
        try {
          set({ loading: true, error: null });

          const doc = await db.get(id);
          const updatedTarget: Target = {
            ...(doc as unknown as Target),
            ...input,
          };

          await db.put({
            ...updatedTarget,
            _id: id,
            _rev: doc._rev,
          });

          // Update local state
          get().updateTarget(id, updatedTarget);

          return updatedTarget;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to update target";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      deleteTargetFromDB: async (id: UUID, db: any): Promise<void> => {
        try {
          set({ loading: true, error: null });

          const doc = await db.get(id);
          await db.remove(doc);

          // Remove from local state
          get().removeTarget(id);
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to delete target";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      getTargetFromDB: async (id: UUID, db: any): Promise<Target> => {
        try {
          set({ loading: true, error: null });

          const doc = await db.get(id);
          const target = doc as unknown as Target;

          set({ currentTarget: target });
          return target;
        } catch (err) {
          if ((err as any).status === 404) {
            throw new Error("Target not found");
          }
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get target";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      getTargetsFromDB: async (query: TargetQuery = {}, db?: any): Promise<Target[]> => {
        if (!db) {
          throw new Error("Database instance is required");
        }

        try {
          set({ loading: true, error: null });

          const result = await db.allDocs({
            include_docs: true,
            startkey: "target:",
            endkey: "target:\uffff",
          });

          let targets = result.rows
            .filter((row: any) => row.id.startsWith("target:"))
            .map((row: any) => row.doc as unknown as Target);

          // Apply filters
          if (query.trackerId) {
            targets = targets.filter((t: Target) => t.trackerId === query.trackerId);
          }
          if (query.type) {
            targets = targets.filter((t: Target) => t.type === query.type);
          }
          if (query.reducer) {
            targets = targets.filter((t: Target) => t.reducer === query.reducer);
          }
          if (query.direction) {
            targets = targets.filter((t: Target) => t.direction === query.direction);
          }
          if (query.period) {
            targets = targets.filter((t: Target) => t.period === query.period);
          }
          if (query.soft !== undefined) {
            targets = targets.filter((t: Target) => t.soft === query.soft);
          }

          // Apply pagination
          if (query.skip) {
            targets = targets.slice(query.skip);
          }
          if (query.limit) {
            targets = targets.slice(0, query.limit);
          }

          set({ targets });
          return targets;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Failed to get targets";
          set({ error: errorMessage });
          throw new Error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "target-store",
    },
  ),
);
