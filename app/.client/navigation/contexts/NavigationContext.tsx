import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigationType } from 'react-router';

type NavType = 'forward' | 'back' | 'tab' | 'modal';

interface NavigationContextType {
  navType: NavType;
  setNavType: (type: NavType) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [navType, setNavType] = useState<NavType>('forward');
  const navigationType = useNavigationType();

  // Detect browser back/forward button usage
  useEffect(() => {
    if (navigationType === 'POP') {
      setNavType('back');
    }
  }, [navigationType]);

  return (
    <NavigationContext.Provider value={{ navType, setNavType }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
