import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { EpochTime } from "src/modules/tracker/types";

export interface AttributeOption {
  id: string;
  attributeId: string;
  name: string;
  createdAt: EpochTime;
}

export interface AttributeOptionCreateInput {
  attributeId: string;
  name: string;
}

export interface AttributeOptionUpdateInput {
  attributeId?: string;
  name?: string;
}

export interface AttributeOptionQuery {
  limit?: number;
  skip?: number;
  attributeId?: string;
}

interface AttributeOptionState {
  attributeOptions: AttributeOption[];
  loading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAttributeOptions: (attributeOptions: AttributeOption[]) => void;
  addAttributeOption: (attributeOption: AttributeOption) => void;
  updateAttributeOption: (
    id: string,
    updates: Partial<AttributeOption>,
  ) => void;
  removeAttributeOption: (id: string) => void;
  clearError: () => void;
}

export const useAttributeOptionStore = create<AttributeOptionState>()(
  devtools(
    (set, get) => ({
      attributeOptions: [],
      loading: false,
      error: null,

      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),

      setAttributeOptions: (attributeOptions) =>
        set({ attributeOptions }, false, "setAttributeOptions"),

      addAttributeOption: (attributeOption) =>
        set(
          (state) => ({
            attributeOptions: [...state.attributeOptions, attributeOption],
          }),
          false,
          "addAttributeOption",
        ),

      updateAttributeOption: (id, updates) =>
        set(
          (state) => ({
            attributeOptions: state.attributeOptions.map((attributeOption) =>
              attributeOption.id === id
                ? { ...attributeOption, ...updates }
                : attributeOption,
            ),
          }),
          false,
          "updateAttributeOption",
        ),

      removeAttributeOption: (id) =>
        set(
          (state) => ({
            attributeOptions: state.attributeOptions.filter(
              (attributeOption) => attributeOption.id !== id,
            ),
          }),
          false,
          "removeAttributeOption",
        ),

      clearError: () => set({ error: null }, false, "clearError"),
    }),
    {
      name: "attribute-option-store",
    },
  ),
);
