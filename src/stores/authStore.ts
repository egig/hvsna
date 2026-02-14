import { create } from "zustand";
import { devtools } from "zustand/middleware";
import axios from "axios";
import type { User, AuthState, AuthActions } from "../lib/types/user";

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

export const useAuthStore = create<AuthState & AuthActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setLoading: (loading) => set({ loading }, false, "setLoading"),

      setError: (error) => set({ error }, false, "setError"),

      setUser: (user) => set({ user }, false, "setUser"),

      fetchUser: async (token: string) => {
        set({ loading: true, error: null }, false, "fetchUser-start");

        try {
          const response = await axios.get<User>(
            `${import.meta.env.VITE_API_URL || "http://localhost:3000"}/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );

          set(
            {
              user: response.data,
              loading: false,
              error: null,
            },
            false,
            "fetchUser-success",
          );
        } catch (error) {
          const errorMessage = axios.isAxiosError(error)
            ? error.response?.data?.message || error.message
            : "Failed to fetch user";

          set(
            {
              user: null,
              loading: false,
              error: errorMessage,
            },
            false,
            "fetchUser-error",
          );
        }
      },

      clearError: () => set({ error: null }, false, "clearError"),
    }),
    {
      name: "auth-store",
    },
  ),
);
