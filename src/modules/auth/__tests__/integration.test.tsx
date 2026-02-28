import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider } from "../auth-context";
import { useAuth } from "../use-auth";
import { vi, describe, it, expect } from "vitest";

// Mock Clerk
vi.mock("@clerk/clerk-react", () => ({
  useSession: () => ({
    isSignedIn: false,
    session: null,
  }),
}));

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("Auth Integration", () => {
  it("should work with existing useAuth hook", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isSignedIn).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(typeof result.current.clearError).toBe("function");
  });
});
