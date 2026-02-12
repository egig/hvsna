export interface User {
  userId: string;
  externalId: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  dbName: string;
  syncURL?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setUser: (user: User | null) => void;
  fetchUser: (t: string) => Promise<void>;
  clearError: () => void;
}
