import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { useSession } from "@clerk/clerk-react";

export const useAuth = () => {
  const { user, loading, error, fetchUser, clearError } = useAuthStore();
  const { isSignedIn, session } = useSession();

  // Auto-fetch user on mount if not already loaded and user is signed in
  useEffect(() => {
    if (!user && isSignedIn) {
      (async () => {
        let t = await session.getToken();
        await fetchUser(t as string);
      })();
    }
  }, [isSignedIn]);

  return {
    user,
    isSignedIn,
    loading,
    error,
    isAuthenticated: !!user,
    clearError,
  };
};
