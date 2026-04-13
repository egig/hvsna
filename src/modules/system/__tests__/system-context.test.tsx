import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { SystemProvider, useSystemContext } from "../system-context";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";

const wrapper = ({ children }: { children: ReactNode }) => (
  <SystemProvider>{children}</SystemProvider>
);

describe("SystemContext", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should provide initial state", () => {
    const { result } = renderHook(() => useSystemContext(), { wrapper });

    expect(result.current.isScreenSizeOverlayVisible).toBe(true);
    expect(result.current.isDesktop).toBe(true);
    expect(typeof result.current.setScreenSizeOverlayVisible).toBe("function");
    expect(typeof result.current.setDesktop).toBe("function");
    expect(typeof result.current.toggleScreenSizeOverlay).toBe("function");
  });

  it("should set screen size overlay visibility", () => {
    const { result } = renderHook(() => useSystemContext(), { wrapper });

    act(() => {
      result.current.setScreenSizeOverlayVisible(false);
    });

    expect(result.current.isScreenSizeOverlayVisible).toBe(false);

    act(() => {
      result.current.setScreenSizeOverlayVisible(true);
    });

    expect(result.current.isScreenSizeOverlayVisible).toBe(true);
  });

  it("should set desktop state", () => {
    const { result } = renderHook(() => useSystemContext(), { wrapper });

    act(() => {
      result.current.setDesktop(false);
    });

    expect(result.current.isDesktop).toBe(false);

    act(() => {
      result.current.setDesktop(true);
    });

    expect(result.current.isDesktop).toBe(true);
  });

  it("should toggle screen size overlay visibility", () => {
    const { result } = renderHook(() => useSystemContext(), { wrapper });

    // Initial state should be true
    expect(result.current.isScreenSizeOverlayVisible).toBe(true);

    // Toggle to false
    act(() => {
      result.current.toggleScreenSizeOverlay();
    });

    expect(result.current.isScreenSizeOverlayVisible).toBe(false);

    // Toggle back to true
    act(() => {
      result.current.toggleScreenSizeOverlay();
    });

    expect(result.current.isScreenSizeOverlayVisible).toBe(true);
  });

  it("should persist state to localStorage", () => {
    const { result } = renderHook(() => useSystemContext(), { wrapper });

    // Change state
    act(() => {
      result.current.setScreenSizeOverlayVisible(false);
      result.current.setDesktop(false);
    });

    // Check localStorage
    const stored = localStorage.getItem("system-storage");
    expect(stored).toBeTruthy();

    if (stored) {
      const parsed = JSON.parse(stored);
      expect(parsed.isScreenSizeOverlayVisible).toBe(false);
      expect(parsed.isDesktop).toBe(false);
    }
  });

  it("should load state from localStorage on initialization", () => {
    // Set up localStorage with initial data
    localStorage.setItem(
      "system-storage",
      JSON.stringify({
        isScreenSizeOverlayVisible: false,
        isDesktop: false,
      })
    );

    const { result } = renderHook(() => useSystemContext(), { wrapper });

    expect(result.current.isScreenSizeOverlayVisible).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it("should handle localStorage errors gracefully", () => {
    // Mock localStorage to throw an error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error("Storage error");
    });

    const { result } = renderHook(() => useSystemContext(), { wrapper });

    // Should still work despite localStorage error
    expect(result.current.isScreenSizeOverlayVisible).toBe(true);
    expect(result.current.isDesktop).toBe(true);

    // Restore original localStorage
    localStorage.setItem = originalSetItem;
  });

  it("should handle corrupted localStorage gracefully", () => {
    // Set corrupted data in localStorage
    localStorage.setItem("system-storage", "invalid json");

    const { result } = renderHook(() => useSystemContext(), { wrapper });

    // Should fall back to initial state
    expect(result.current.isScreenSizeOverlayVisible).toBe(true);
    expect(result.current.isDesktop).toBe(true);
  });

  it("should handle multiple state changes correctly", () => {
    const { result } = renderHook(() => useSystemContext(), { wrapper });

    act(() => {
      result.current.setScreenSizeOverlayVisible(false);
    });

    act(() => {
      result.current.setDesktop(false);
    });

    act(() => {
      result.current.toggleScreenSizeOverlay();
    });

    expect(result.current.isScreenSizeOverlayVisible).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });
});
