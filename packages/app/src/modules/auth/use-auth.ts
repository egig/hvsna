import { useEffect } from "react";
import { useAuthContext } from "./auth-context";
import { getAuthService } from "../../infra/auth/AuthServiceFactory";

export const useAuth = () => {
  const {
    user,
    loading,
    error,
    fetchUser,
    clearError,
    login,
    register,
    logout,
    setUser,
    verifyEmail,
    resendVerification,
  } = useAuthContext();

  // Auto-fetch user on mount if authenticated but user data not loaded
  useEffect(() => {
    (async () => {
      try {
        // Check if user has valid tokens (is authenticated)
        const hasTokens = await getAuthService().isAuthenticated();

        // If authenticated but no user data, fetch user details
        if (hasTokens && !user && !loading) {
          await fetchUser();
        }
      } catch (error) {
        // Error is handled by React Query and available in the error state
        console.error("Failed to check authentication status:", error);
      }
    })();
  }, [user, loading, fetchUser]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    fetchUser,
    clearError,
    login,
    register,
    logout,
    setUser,
    verifyEmail,
    resendVerification,
  };
};
