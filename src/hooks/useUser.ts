import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useClerk } from "@clerk/clerk-react";

export const useUser = () => {
  const { user, loading, error, clearError } = useAuth();
  const { isSignedIn, user: clerkUser } = useClerk();

  return {
    isSignedIn: !!isSignedIn,
    user,
    loading,
    error,
    clerkUser,
    clearError,
  };
};
