import { useNavigate, useLocation } from "react-router";
import { setPendingNavType } from "./nav-type-signal";

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

  const navigateWithNavType = (
    to: string | number,
    navType: NavType = "forward",
    options?: NavigateOptions
  ) => {
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
      // navigate(-1) triggers a POP navigation which can't carry new state,
      // so we use the module-level signal to pass navType to PageTransition.
      setPendingNavType("back");
      if (location.key !== "default") {
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
