import React, { createContext, useContext, useEffect, useState } from "react";

interface ScreenSizeState {
  isDesktop: boolean;
}

type ScreenSizeContextType = ScreenSizeState;
const ScreenSizeContext = createContext<ScreenSizeContextType | undefined>(
  undefined
);

export const useScreenSize = (): ScreenSizeContextType => {
  const context = useContext(ScreenSizeContext);
  if (context === undefined) {
    throw new Error("useSystemContext must be used within a SystemProvider");
  }
  return context;
};

interface ScreenSizeProviderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const ScreenSizeProvider: React.FC<ScreenSizeProviderProps> = ({
  children,
}) => {
  const [isDesktop, setDesktop] = useState<boolean>(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const isDesktopDevice = width >= 1080;
      setDesktop(isDesktopDevice);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, [setDesktop]);

  return (
    <ScreenSizeContext.Provider value={{ isDesktop }}>
      {children}
    </ScreenSizeContext.Provider>
  );
};
