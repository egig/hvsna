import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { SettingsProvider, useSettingsContext } from "../settings-context";
import type { GeneralSettings } from "../settings";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe("SettingsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should provide initial state", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    expect(result.current.settings.language).toBe("en");
    expect(result.current.settings.timezone).toBeDefined();
    expect(result.current.settings.theme).toBe("system");
    expect(result.current.settings.notifications).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.initiated).toBe(false);
    expect(typeof result.current.setLoading).toBe("function");
    expect(typeof result.current.setInitiated).toBe("function");
    expect(typeof result.current.setError).toBe("function");
    expect(typeof result.current.setSettings).toBe("function");
    expect(typeof result.current.updateSettings).toBe("function");
    expect(typeof result.current.clearError).toBe("function");
  });

  it("should set loading state", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it("should set initiated state", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    act(() => {
      result.current.setInitiated(true);
    });

    expect(result.current.initiated).toBe(true);

    act(() => {
      result.current.setInitiated(false);
    });

    expect(result.current.initiated).toBe(false);
  });

  it("should set error state", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    act(() => {
      result.current.setError("Test error");
    });

    expect(result.current.error).toBe("Test error");

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should set entire settings object", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });
    const mockSettings: GeneralSettings = {
      language: "id",
      timezone: "Asia/Jakarta",
      manualDateOffset: 2,
      theme: "dark",
      notifications: false,
    };

    act(() => {
      result.current.setSettings(mockSettings);
    });

    expect(result.current.settings).toEqual(mockSettings);
  });

  it("should update partial settings", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    act(() => {
      result.current.updateSettings({ language: "id" });
    });

    expect(result.current.settings.language).toBe("id");
    // Other settings should remain unchanged
    expect(result.current.settings.theme).toBe("system");
    expect(result.current.settings.notifications).toBe(true);

    act(() => {
      result.current.updateSettings({ theme: "light", notifications: false });
    });

    expect(result.current.settings.language).toBe("id"); // Still preserved
    expect(result.current.settings.theme).toBe("light");
    expect(result.current.settings.notifications).toBe(false);
  });

  it("should handle multiple updates correctly", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    act(() => {
      result.current.updateSettings({ language: "id" });
    });

    act(() => {
      result.current.updateSettings({ timezone: "Europe/Berlin" });
    });

    act(() => {
      result.current.updateSettings({ manualDateOffset: 1 });
    });

    expect(result.current.settings.language).toBe("id");
    expect(result.current.settings.timezone).toBe("Europe/Berlin");
    expect(result.current.settings.manualDateOffset).toBe(1);
    expect(result.current.settings.theme).toBe("system"); // Still default
  });

  it("should preserve existing settings when updating", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    // Set initial custom settings
    const initialSettings: GeneralSettings = {
      language: "id",
      timezone: "Asia/Jakarta",
      manualDateOffset: 3,
      theme: "dark",
      notifications: false,
    };

    act(() => {
      result.current.setSettings(initialSettings);
    });

    // Update only one property
    act(() => {
      result.current.updateSettings({ language: "en" });
    });

    expect(result.current.settings.language).toBe("en");
    expect(result.current.settings.timezone).toBe("Asia/Jakarta");
    expect(result.current.settings.manualDateOffset).toBe(3);
    expect(result.current.settings.theme).toBe("dark");
    expect(result.current.settings.notifications).toBe(false);
  });
});
