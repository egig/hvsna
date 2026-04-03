import type { FeatureFlags } from "../feature-flags/types";

export interface User {
  userId: string;
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  dbName: string;
  syncURL?: string;
  featureFlags?: FeatureFlags;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  fetchUser: (t?: string) => Promise<void>;
  clearError: () => void;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
}
