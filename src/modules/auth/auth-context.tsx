import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import axios from "axios";
import type { User, AuthState, AuthActions } from "./user";

type AuthContextType = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_USER"; payload: User | null }
  | { type: "FETCH_USER_START" }
  | { type: "FETCH_USER_SUCCESS"; payload: User }
  | { type: "FETCH_USER_ERROR"; payload: string };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_USER":
      return { ...state, user: action.payload };
    case "FETCH_USER_START":
      return { ...state, loading: true, error: null };
    case "FETCH_USER_SUCCESS":
      return { ...state, user: action.payload, loading: false, error: null };
    case "FETCH_USER_ERROR":
      return { ...state, user: null, loading: false, error: action.payload };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: "SET_ERROR", payload: error });
  }, []);

  const setUser = useCallback((user: User | null) => {
    dispatch({ type: "SET_USER", payload: user });
  }, []);

  const fetchUser = useCallback(async (token: string) => {
    dispatch({ type: "FETCH_USER_START" });

    try {
      const response = await axios.get<User>(
        `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch({ type: "FETCH_USER_SUCCESS", payload: response.data });
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Failed to fetch user";

      dispatch({ type: "FETCH_USER_ERROR", payload: errorMessage });
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "SET_ERROR", payload: null });
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    setLoading,
    setError,
    setUser,
    fetchUser,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
