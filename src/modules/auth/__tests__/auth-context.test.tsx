import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthProvider, useAuthContext } from "../auth-context";
import axios from "axios";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";

// Mock axios
vi.mock("axios");
const mockedAxios = axios as any;

// Mock environment variable
beforeEach(() => {
  vi.stubEnv("VITE_API_URL", "http://localhost:3000");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide initial state", () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.setLoading).toBe("function");
    expect(typeof result.current.setError).toBe("function");
    expect(typeof result.current.setUser).toBe("function");
    expect(typeof result.current.fetchUser).toBe("function");
    expect(typeof result.current.clearError).toBe("function");
  });

  it("should set loading state", () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it("should set error state", () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });

    act(() => {
      result.current.setError("Test error");
    });

    expect(result.current.error).toBe("Test error");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should set user state", () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    const mockUser = {
      userId: "1",
      externalId: "ext1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      createdAt: "2023-01-01",
      dbName: "test_db",
    };

    act(() => {
      result.current.setUser(mockUser);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it("should fetch user successfully", async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    const mockUser = {
      userId: "1",
      externalId: "ext1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      createdAt: "2023-01-01",
      dbName: "test_db",
    };

    mockedAxios.get.mockResolvedValue({ data: mockUser });

    await act(async () => {
      await result.current.fetchUser("test-token");
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockedAxios.get).toHaveBeenCalledWith("http://localhost:3000/me", {
      headers: {
        Authorization: "Bearer test-token",
      },
    });
  });

  it("should handle fetch user error", async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    const errorMessage = "User not found";

    // Create a regular Error object (not an AxiosError)
    const regularError = new Error(errorMessage);

    mockedAxios.get.mockRejectedValue(regularError);
    mockedAxios.isAxiosError = vi.fn().mockReturnValue(false);

    await act(async () => {
      await result.current.fetchUser("test-token");
    });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    // For non-Axios errors, it falls back to the default message
    expect(result.current.error).toBe("Failed to fetch user");
  });

  it("should handle axios error with response data", async () => {
    const { result } = renderHook(() => useAuthContext(), { wrapper });
    const errorMessage = "Invalid token";

    const axiosError = {
      isAxiosError: true,
      response: {
        data: { message: errorMessage },
      },
      message: "Request failed",
    };

    mockedAxios.get.mockRejectedValue(axiosError);
    mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

    await act(async () => {
      await result.current.fetchUser("invalid-token");
    });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });
});
