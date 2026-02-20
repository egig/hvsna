import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SystemState {
  isScreenSizeOverlayVisible: boolean;
  isDesktop: boolean;
  setScreenSizeOverlayVisible: (visible: boolean) => void;
  setDesktop: (isDesktop: boolean) => void;
  toggleScreenSizeOverlay: () => void;
}

export const useSystemStore = create<SystemState>()(
  persist(
    (set) => ({
      isScreenSizeOverlayVisible: true,
      isDesktop: true,
      setScreenSizeOverlayVisible: (visible: boolean) =>
        set({ isScreenSizeOverlayVisible: visible }),
      setDesktop: (isDesktop: boolean) => set({ isDesktop }),
      toggleScreenSizeOverlay: () =>
        set((state) => ({
          isScreenSizeOverlayVisible: !state.isScreenSizeOverlayVisible,
        })),
    }),
    {
      name: "system-storage",
      partialize: (state) => ({
        isScreenSizeOverlayVisible: state.isScreenSizeOverlayVisible,
        isDesktop: state.isDesktop,
      }),
    },
  ),
);
