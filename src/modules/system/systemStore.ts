import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SystemState {
  isBreakpointWrapperVisible: boolean;
  setBreakpointWrapperVisible: (visible: boolean) => void;
  toggleBreakpointWrapper: () => void;
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      isBreakpointWrapperVisible: true,
      setBreakpointWrapperVisible: (visible: boolean) =>
        set({ isBreakpointWrapperVisible: visible }),
      toggleBreakpointWrapper: () =>
        set((state) => ({
          isBreakpointWrapperVisible: !state.isBreakpointWrapperVisible,
        })),
    }),
    {
      name: "system-storage",
      partialize: (state) => ({
        isBreakpointWrapperVisible: state.isBreakpointWrapperVisible,
      }),
    },
  ),
);
