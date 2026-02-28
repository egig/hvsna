import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";

interface SystemState {
  isScreenSizeOverlayVisible: boolean;
  isDesktop: boolean;
}

interface SystemActions {
  setScreenSizeOverlayVisible: (visible: boolean) => void;
  setDesktop: (isDesktop: boolean) => void;
  toggleScreenSizeOverlay: () => void;
}

type SystemContextType = SystemState & SystemActions;

const initialState: SystemState = {
  isScreenSizeOverlayVisible: true,
  isDesktop: true,
};

type SystemAction =
  | { type: "SET_SCREEN_SIZE_OVERLAY_VISIBLE"; payload: boolean }
  | { type: "SET_DESKTOP"; payload: boolean }
  | { type: "TOGGLE_SCREEN_SIZE_OVERLAY" };

const systemReducer = (
  state: SystemState,
  action: SystemAction,
): SystemState => {
  switch (action.type) {
    case "SET_SCREEN_SIZE_OVERLAY_VISIBLE":
      return { ...state, isScreenSizeOverlayVisible: action.payload };
    case "SET_DESKTOP":
      return { ...state, isDesktop: action.payload };
    case "TOGGLE_SCREEN_SIZE_OVERLAY":
      return {
        ...state,
        isScreenSizeOverlayVisible: !state.isScreenSizeOverlayVisible,
      };
    default:
      return state;
  }
};

const STORAGE_KEY = "system-storage";

const getStoredState = (): SystemState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...initialState, ...parsed };
    }
  } catch (error) {
    console.warn("Error loading system state from localStorage:", error);
  }
  return initialState;
};

const saveStoredState = (state: SystemState): void => {
  try {
    const toStore = {
      isScreenSizeOverlayVisible: state.isScreenSizeOverlayVisible,
      isDesktop: state.isDesktop,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  } catch (error) {
    console.warn("Error saving system state to localStorage:", error);
  }
};

const SystemContext = createContext<SystemContextType | undefined>(undefined);

interface SystemProviderProps {
  children: ReactNode;
}

export const SystemProvider: React.FC<SystemProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(systemReducer, getStoredState());

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveStoredState(state);
  }, [state]);

  const setScreenSizeOverlayVisible = useCallback((visible: boolean) => {
    dispatch({ type: "SET_SCREEN_SIZE_OVERLAY_VISIBLE", payload: visible });
  }, []);

  const setDesktop = useCallback((isDesktop: boolean) => {
    dispatch({ type: "SET_DESKTOP", payload: isDesktop });
  }, []);

  const toggleScreenSizeOverlay = useCallback(() => {
    dispatch({ type: "TOGGLE_SCREEN_SIZE_OVERLAY" });
  }, []);

  const contextValue: SystemContextType = {
    ...state,
    setScreenSizeOverlayVisible,
    setDesktop,
    toggleScreenSizeOverlay,
  };

  return (
    <SystemContext.Provider value={contextValue}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystemContext = (): SystemContextType => {
  const context = useContext(SystemContext);
  if (context === undefined) {
    throw new Error("useSystemContext must be used within a SystemProvider");
  }
  return context;
};
