import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getAuthUseCases } from "../../infra/auth/AuthServiceFactory";

const authService = getAuthUseCases();
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();

  // Query for user data
  const userQuery = useQuery<User>({
    queryKey: ["user"],
    queryFn: () => authService.getCurrentUser(),
    enabled: false, // Disabled by default, will be enabled when authenticated
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authService.initialize();
        const isAuthenticated = await authService.isAuthenticated();
        if (isAuthenticated) {
          userQuery.refetch();
        }
      } catch (error) {
        console.error("Failed to initialize auth:", error);
      }
    };

    initializeAuth();
  }, [userQuery]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      await authService.login({ email, password });
      const user = await authService.getCurrentUser();
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["user"], user);
    },
    onError: (error) => {
      console.error("Login failed:", error);
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      await authService.register(userData);
      const user = await authService.getCurrentUser();
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["user"], user);
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authService.logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(["user"], null);
      queryClient.removeQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      // Even if logout fails, clear user data
      queryClient.setQueryData(["user"], null);
      queryClient.removeQueries({ queryKey: ["user"] });
    },
  });

  const fetchUser = useCallback(async (): Promise<void> => {
    try {
      const user = await authService.getCurrentUser();
      queryClient.setQueryData(["user"], user);
    } catch (error) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? (error as any).message
          : "Failed to fetch user";
      throw new Error(errorMessage);
    }
  }, [queryClient]);

  const setUser = useCallback(
    (user: User | null) => {
      if (user) {
        queryClient.setQueryData(["user"], user);
      } else {
        queryClient.setQueryData(["user"], null);
        queryClient.removeQueries({ queryKey: ["user"] });
      }
    },
    [queryClient],
  );

  const clearError = useCallback(() => {
    // Clear any error state
    queryClient.resetQueries({ queryKey: ["user"] });
  }, [queryClient]);

  const login = useCallback(
    async (email: string, password: string) => {
      return loginMutation.mutateAsync({ email, password });
    },
    [loginMutation],
  );

  const register = useCallback(
    async (userData: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      return registerMutation.mutateAsync(userData);
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const contextValue: AuthContextType = {
    user: userQuery.data || null,
    loading:
      userQuery.isLoading ||
      loginMutation.isPending ||
      registerMutation.isPending ||
      logoutMutation.isPending,
    error: userQuery.error
      ? (userQuery.error as Error).message
      : loginMutation.error
        ? (loginMutation.error as Error).message
        : registerMutation.error
          ? (registerMutation.error as Error).message
          : logoutMutation.error
            ? (logoutMutation.error as Error).message
            : null,
    setUser,
    fetchUser,
    clearError,
    // Add new auth actions
    login,
    register,
    logout,
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
