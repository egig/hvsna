import React, { useEffect, useState, type ReactNode } from "react";
import { LanguageProvider } from "../contexts/LanguageContext";
import { useSettings } from "../modules/settings/useSettings";

interface LanguageProviderWrapperProps {
  children: ReactNode;
}

export const LanguageProviderWrapper: React.FC<
  LanguageProviderWrapperProps
> = ({ children }) => {
  const { loading } = useSettings();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mark as ready when settings are loaded
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return <LanguageProvider>{children}</LanguageProvider>;
};
