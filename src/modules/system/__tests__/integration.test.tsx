import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { SystemProvider, useSystemContext } from "../system-context";
import { useScreenSize } from "../../components/screen-size-wrapper";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

const wrapper = ({ children }: { children: ReactNode }) => (
  <SystemProvider>{children}</SystemProvider>
);

describe("System Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should work with useScreenSize hook", () => {
    const { result } = renderHook(() => useScreenSize(), { wrapper });

    expect(result.current.isDesktop).toBeDefined();
    expect(typeof result.current.isDesktop).toBe("boolean");
  });

  it("should work with useSystemContext (backward compatibility)", () => {
    const { result } = renderHook(() => useSystemContext(), { wrapper });

    expect(result.current.isScreenSizeOverlayVisible).toBeDefined();
    expect(result.current.isDesktop).toBeDefined();
    expect(typeof result.current.setScreenSizeOverlayVisible).toBe("function");
    expect(typeof result.current.setDesktop).toBe("function");
    expect(typeof result.current.toggleScreenSizeOverlay).toBe("function");
  });

  it("should allow state updates through context", () => {
    const { result } = renderHook(() => useSystemContext(), { wrapper });

    // Test initial state
    expect(result.current.isScreenSizeOverlayVisible).toBe(true);
    expect(result.current.isDesktop).toBe(true);

    // Update overlay visibility
    act(() => {
      result.current.setScreenSizeOverlayVisible(false);
    });
    expect(result.current.isScreenSizeOverlayVisible).toBe(false);

    // Update desktop state
    act(() => {
      result.current.setDesktop(false);
    });
    expect(result.current.isDesktop).toBe(false);

    // Toggle overlay
    act(() => {
      result.current.toggleScreenSizeOverlay();
    });
    expect(result.current.isScreenSizeOverlayVisible).toBe(true);
  });

  it("should maintain state consistency across hooks", () => {
    // Create a custom test component that uses both hooks
    const TestComponent = () => {
      const systemContext = useSystemContext();
      const screenSize = useScreenSize();
      return { systemContext, screenSize };
    };

    const { result } = renderHook(() => TestComponent(), { wrapper });

    // Both should have same initial desktop state
    expect(result.current.systemContext.isDesktop).toBe(
      result.current.screenSize.isDesktop,
    );

    // Update desktop state through context
    act(() => {
      result.current.systemContext.setDesktop(false);
    });

    // Both should reflect the change
    expect(result.current.systemContext.isDesktop).toBe(false);
    expect(result.current.screenSize.isDesktop).toBe(false);

    // Update desktop state back
    act(() => {
      result.current.systemContext.setDesktop(true);
    });

    expect(result.current.systemContext.isDesktop).toBe(true);
    expect(result.current.screenSize.isDesktop).toBe(true);
  });
});
