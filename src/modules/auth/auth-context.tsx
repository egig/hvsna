import React, {
  createContext,
  useContext,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import type { User, AuthState, AuthActions } from "./user";

type AuthContextType = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const fetchUserFn = async (token: string): Promise<User> => {
  const response = await axios.get<User>(
    `${import.meta.env.VITE_API_URL}/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  // Query for user data - we'll manage this reactively
  const userQuery = useQuery<User>({
    queryKey: ["user"],
    queryFn: () => {
      throw new Error("User query must be triggered with token");
    },
    enabled: false, // Disabled by default, will be enabled when token is available
    retry: false,
  });

  const fetchUser = useCallback(async (token: string): Promise<void> => {
    try {
      const result = await queryClient.fetchQuery({
        queryKey: ["user"],
        queryFn: () => fetchUserFn(token),
      });
      // Data is automatically set in the query cache by fetchQuery
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : "Failed to fetch user";
      throw new Error(errorMessage);
    }
  }, [queryClient]);


  const setUser = useCallback((user: User | null) => {
    if (user) {
      queryClient.setQueryData(["user"], user);
    } else {
      queryClient.setQueryData(["user"], null);
      queryClient.removeQueries({ queryKey: ["user"] });
    }
  }, [queryClient]);

  const clearError = useCallback(() => {
    // Clear any error state
    queryClient.resetQueries({ queryKey: ["user"] });
  }, [queryClient]);

  const contextValue: AuthContextType = {
    user: userQuery.data || null,
    loading: userQuery.isLoading,
    error: userQuery.error ? (userQuery.error as Error).message : null,
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
