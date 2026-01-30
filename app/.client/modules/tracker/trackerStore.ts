import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { EpochTime } from "~/lib/tracker/types";

export interface Tracker {
  id: string;
  name: string;
  unit: string;
  baseline: number;
  createdAt: EpochTime;
  customAttributes?: TrackerAttribute[];
}

export interface TrackerAttribute {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select";
  required?: boolean;
  options?: string[];
  defaultValue?: string | number;
}

export interface TrackerCreateInput {
  name: string;
  unit: string;
  baseline: number;
}

export interface TrackerUpdateInput {
  name?: string;
  unit?: string;
  baseline?: number;
}

export interface TrackerQuery {
  limit?: number;
  skip?: number;
}

interface TrackerState {
  trackers: Tracker[];
  loading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTrackers: (trackers: Tracker[]) => void;
  addTracker: (tracker: Tracker) => void;
  updateTracker: (id: string, updates: Partial<Tracker>) => void;
  removeTracker: (id: string) => void;
  clearError: () => void;
}

export const useTrackerStore = create<TrackerState>()(
  devtools(
    (set, get) => ({
      trackers: [],
      loading: false,
      error: null,

      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),

      setTrackers: (trackers) => set({ trackers }, false, "setTrackers"),

      addTracker: (tracker) =>
        set(
          (state) => ({ trackers: [...state.trackers, tracker] }),
          false,
          "addTracker",
        ),

      updateTracker: (id, updates) =>
        set(
          (state) => ({
            trackers: state.trackers.map((tracker) =>
              tracker.id === id ? { ...tracker, ...updates } : tracker,
            ),
          }),
          false,
          "updateTracker",
        ),

      removeTracker: (id) =>
        set(
          (state) => ({
            trackers: state.trackers.filter((tracker) => tracker.id !== id),
          }),
          false,
          "removeTracker",
        ),

      clearError: () => set({ error: null }, false, "clearError"),
    }),
    {
      name: "tracker-store",
    },
  ),
);
