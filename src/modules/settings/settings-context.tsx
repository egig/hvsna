import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { GeneralSettings, PrayerTimesFallback } from "./settings";

const DEFAULT_PRAYER_TIMES: PrayerTimesFallback = {
  fajr: "05:00",
  sunrise: "06:00",
  dzuhr: "12:00",
  asr: "15:00",
  maghrib: "18:00",
  isha: "19:00",
};

const DEFAULT_SETTINGS: GeneralSettings = {
  language: "en",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  manualDateOffset: 0,
  theme: "system",
  notifications: true,
  prayerTimesFallback: DEFAULT_PRAYER_TIMES,
};

interface SettingsState {
  settings: GeneralSettings;
  loading: boolean;
  error: string | null;
  initiated: boolean;
}

interface SettingsActions {
  setLoading: (loading: boolean) => void;
  setInitiated: (initiated: boolean) => void;
  setError: (error: string | null) => void;
  setSettings: (settings: GeneralSettings) => void;
  updateSettings: (updates: Partial<GeneralSettings>) => void;
  clearError: () => void;
}

type SettingsContextType = SettingsState & SettingsActions;

const initialState: SettingsState = {
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
  initiated: false,
};

type SettingsAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_INITIATED"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_SETTINGS"; payload: GeneralSettings }
  | { type: "UPDATE_SETTINGS"; payload: Partial<GeneralSettings> }
  | { type: "CLEAR_ERROR" };

const settingsReducer = (
  state: SettingsState,
  action: SettingsAction,
): SettingsState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_INITIATED":
      return { ...state, initiated: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_SETTINGS":
      return { ...state, settings: action.payload };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setInitiated = useCallback((initiated: boolean) => {
    dispatch({ type: "SET_INITIATED", payload: initiated });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const setSettings = useCallback((settings: GeneralSettings) => {
    dispatch({ type: "SET_SETTINGS", payload: settings });
  }, []);

  const updateSettings = useCallback((updates: Partial<GeneralSettings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: updates });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const contextValue: SettingsContextType = {
    ...state,
    setLoading,
    setInitiated,
    setError,
    setSettings,
    updateSettings,
    clearError,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider",
    );
  }
  return context;
};
