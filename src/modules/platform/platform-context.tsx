import React, { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { Capacitor } from "@capacitor/core";

export type PlatformType = "web" | "pwa" | "capacitor";
export type NativePlatform = "ios" | "android" | "web";

interface PlatformContextType {
  platform: PlatformType;
  nativePlatform: NativePlatform;
  isNative: boolean;
  isPWA: boolean;
  isWeb: boolean;
}

const detectPlatform = (): PlatformType => {
  if (Capacitor.isNativePlatform()) {
    return "capacitor";
  }

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true;

  if (isStandalone) {
    return "pwa";
  }

  return "web";
};

const PlatformContext = createContext<PlatformContextType | undefined>(
  undefined
);

interface PlatformProviderProps {
  children: ReactNode;
}

export const PlatformProvider: React.FC<PlatformProviderProps> = ({
  children,
}) => {
  const value = useMemo<PlatformContextType>(() => {
    const platform = detectPlatform();
    const nativePlatform = Capacitor.getPlatform() as NativePlatform;

    return {
      platform,
      nativePlatform,
      isNative: platform === "capacitor",
      isPWA: platform === "pwa",
      isWeb: platform === "web",
    };
  }, []);

  return (
    <PlatformContext.Provider value={value}>
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = (): PlatformContextType => {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error("usePlatform must be used within a PlatformProvider");
  }
  return context;
};
