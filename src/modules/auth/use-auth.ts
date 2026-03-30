import { useEffect } from "react";
import { useSession } from "@clerk/react";
import { useAuthContext } from "./auth-context";

export const useAuth = () => {
  const { user, loading, error, fetchUser, clearError } = useAuthContext();
  const { isSignedIn, session } = useSession();

  // Auto-fetch user on mount if not already loaded and user is signed in
  useEffect(() => {
    if (!user && isSignedIn) {
      (async () => {
        let t = await session.getToken();
        try {
          await fetchUser(t as string);
        } catch (error) {
          // Error is handled by React Query and available in the error state
          console.error("Failed to fetch user:", error);
        }
      })();
    }
  }, [user, isSignedIn, session, fetchUser]);

  return {
    user,
    isSignedIn,
    loading,
    error,
    isAuthenticated: !!user,
    clearError,
  };
};
