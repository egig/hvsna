import React, { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";

export type PlatformType = "web" | "pwa";

interface PlatformContextType {
  platform: PlatformType;
  isPWA: boolean;
  isWeb: boolean;
}

const detectPlatform = (): PlatformType => {
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

    return {
      platform,
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
