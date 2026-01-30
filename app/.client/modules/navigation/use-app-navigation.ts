import { useNavigate, useLocation } from "react-router";
import { useNavigation } from "./context";

type NavType = "forward" | "back" | "tab" | "modal";

interface NavigateOptions {
  state?: {
    navType?: NavType;
    [key: string]: any;
  };
  replace?: boolean;
}

export function useAppNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setNavType } = useNavigation();

  const navigateWithNavType = (
    to: string | number,
    navType: NavType = "forward",
    options?: NavigateOptions,
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
    goForward: (to: string, options?: NavigateOptions) =>
      navigateWithNavType(to, "forward", options),
    goBack: (to?: number) => {
      console.log("goBack", to);
      // Use React Router's navigation state to check if we can go back
      // If location.key is 'default', we're likely at the initial page
      if (location.key !== 'default') {
        navigateWithNavType(to || -1, "back");
      } else {
        navigateWithNavType("/", "back", { replace: true });
      }
    },
    goToTab: (to: string, options?: NavigateOptions) =>
      navigateWithNavType(to, "tab", options),
    openModal: (to: string, options?: NavigateOptions) =>
      navigateWithNavType(to, "modal", options),
  };
}
