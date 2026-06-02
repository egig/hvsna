import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import type { GeneralSettings, PrayerTimesFallback } from "./settings";
import { usePouchDB } from "@/pouchdb";
import { createSettingsUseCases } from "@/infra/settings/SettingsUseCasesFactory";
import type { Language } from "../i18n/language";

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
  timezone: "",
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
  setLanguage: (l: Language) => Promise<void>;
  resetSettings: () => Promise<void>;
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
  action: SettingsAction
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
  undefined
);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(settingsReducer, initialState);
  const { db } = usePouchDB();
  const useCases = createSettingsUseCases(db);

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

  const updateSettingsStore = useCallback(
    (updates: Partial<GeneralSettings>) => {
      dispatch({ type: "UPDATE_SETTINGS", payload: updates });
    },
    []
  );

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    clearError();
    try {
      const loaded = await useCases.loadSettings();
      setSettings(loaded);
    } catch (err: any) {
      setError(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
      setInitiated(true);
    }
  }, [db]);

  const updateSettings = useCallback(
    async (updates: Partial<GeneralSettings>): Promise<void> => {
      setLoading(true);
      clearError();
      try {
        await useCases.updateSettings(state.settings, updates);
        updateSettingsStore(updates);
      } catch (err: any) {
        setError(err.message || "Failed to update settings");
      } finally {
        setLoading(false);
      }
    },
    [db, state.settings]
  );

  const setLanguage = useCallback(
    async (language: Language): Promise<void> => {
      await updateSettings({ language });
    },
    [updateSettings]
  );

  const resetSettings = useCallback(async (): Promise<void> => {
    setLoading(true);
    clearError();
    try {
      const defaults = await useCases.resetSettings();
      setSettings(defaults);
    } catch (err: any) {
      setError(err.message || "Failed to reset settings");
    } finally {
      setLoading(false);
    }
  }, [db]);

  const contextValue: SettingsContextType = {
    ...state,
    setLoading,
    setInitiated,
    setError,
    setSettings,
    updateSettings,
    clearError,
    setLanguage,
    resetSettings,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {state.initiated && children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider"
    );
  }
  return context;
};
