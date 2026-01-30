import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { EpochTime } from "~/lib/tracker/types";

export interface TrackerAttribute {
  id: string;
  name: string;
  type: "text" | "number" | "boolean" | "date" | "options";
  required: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
  trackerId: string;
  options?: string[];
  createdAt: EpochTime;
}

export interface TrackerAttributeCreateInput {
  name: string;
  type: "text" | "number" | "boolean" | "date" | "options";
  required: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
  trackerId: string;
  options?: string[];
}

export interface TrackerAttributeUpdateInput {
  name?: string;
  type?: "text" | "number" | "boolean" | "date" | "options";
  required?: boolean;
  defaultValue?: string | number | boolean;
  description?: string;
  trackerId?: string;
  options?: string[];
}

export interface TrackerAttributeQuery {
  limit?: number;
  skip?: number;
  trackerId?: string;
}

interface TrackerAttributeState {
  trackerAttributes: TrackerAttribute[];
  loading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setTrackerAttributes: (trackerAttributes: TrackerAttribute[]) => void;
  addTrackerAttribute: (trackerAttribute: TrackerAttribute) => void;
  updateTrackerAttribute: (id: string, updates: Partial<TrackerAttribute>) => void;
  removeTrackerAttribute: (id: string) => void;
  clearError: () => void;
}

export const useTrackerAttributeStore = create<TrackerAttributeState>()(
  devtools(
    (set, get) => ({
      trackerAttributes: [],
      loading: false,
      error: null,

      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),

      setTrackerAttributes: (trackerAttributes) => set({ trackerAttributes }, false, "setTrackerAttributes"),

      addTrackerAttribute: (trackerAttribute) =>
        set(
          (state) => ({ trackerAttributes: [...state.trackerAttributes, trackerAttribute] }),
          false,
          "addTrackerAttribute",
        ),

      updateTrackerAttribute: (id, updates) =>
        set(
          (state) => ({
            trackerAttributes: state.trackerAttributes.map((trackerAttribute) =>
              trackerAttribute.id === id ? { ...trackerAttribute, ...updates } : trackerAttribute,
            ),
          }),
          false,
          "updateTrackerAttribute",
        ),

      removeTrackerAttribute: (id) =>
        set(
          (state) => ({
            trackerAttributes: state.trackerAttributes.filter((trackerAttribute) => trackerAttribute.id !== id),
          }),
          false,
          "removeTrackerAttribute",
        ),

      clearError: () => set({ error: null }, false, "clearError"),
    }),
    {
      name: "tracker-attribute-store",
    },
  ),
);
