import React, { useEffect } from "react";
import { useSystemStore } from "../system/systemStore";

export const useScreenSize = () => {
  const { isDesktop } = useSystemStore();
  return { isDesktop };
};

interface ScreenSizeProviderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const ScreenSizeProvider: React.FC<ScreenSizeProviderProps> = ({
  children,
  onClose,
  className = "",
}) => {
  const {
    setDesktop,
  } = useSystemStore();

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      const isDesktopDevice = width >= 768;
      setDesktop(isDesktopDevice);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, [setDesktop]);

  return <>{children}</>;
};
