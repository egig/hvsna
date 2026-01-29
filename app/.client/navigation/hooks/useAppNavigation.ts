import { useNavigate } from 'react-router';
import { useNavigation } from '../contexts/NavigationContext';

type NavType = 'forward' | 'back' | 'tab' | 'modal';

interface NavigateOptions {
  state?: {
    navType?: NavType;
    [key: string]: any;
  };
  replace?: boolean;
}

export function useAppNavigation() {
  const navigate = useNavigate();
  const { setNavType } = useNavigation();

  const navigateWithNavType = (
    to: string | number,
    navType: NavType = 'forward',
    options?: NavigateOptions
  ) => {
    setNavType(navType);
    
    const navOptions: NavigateOptions = {
      ...options,
      state: {
        ...options?.state,
        navType,
      },
    };

    navigate(to as any, navOptions);
  };

  return {
    // Enhanced navigate function
    navigate: navigateWithNavType,
    
    // Convenience methods
    goForward: (to: string, options?: NavigateOptions) => navigateWithNavType(to, 'forward', options),
    goBack: (to?: number) => navigateWithNavType(to || -1, 'back'),
    goToTab: (to: string, options?: NavigateOptions) => navigateWithNavType(to, 'tab', options),
    openModal: (to: string, options?: NavigateOptions) => navigateWithNavType(to, 'modal', options),
  };
}
