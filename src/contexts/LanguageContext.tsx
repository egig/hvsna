import React, { createContext, useContext, type ReactNode, useEffect } from 'react';
import type { Language } from '../lib/types/settings';
import { translations } from '../locales';
import { useSettings } from '../hooks/useSettings';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguageContext = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { settings, setLanguage, loadSettings } = useSettings();

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const t = (key: string): string => {
    return (translations[settings.language] as any)?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      language: settings.language, 
      setLanguage, 
      t 
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
