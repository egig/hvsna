import { renderHook, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { SettingsProvider, useSettingsContext } from "../settings-context";
import { vi, describe, it, expect } from "vitest";

const wrapper = ({ children }: { children: ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe("Settings Integration", () => {
  it("should work with useSettingsContext (backward compatibility)", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    expect(result.current.settings.language).toBeDefined();
    expect(result.current.settings.timezone).toBeDefined();
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

  it("should have correct initial state structure", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    // Check that all expected properties exist
    expect(result.current.settings).toHaveProperty("language");
    expect(result.current.settings).toHaveProperty("timezone");
    expect(result.current.settings).toHaveProperty("theme");
    expect(result.current.settings).toHaveProperty("notifications");
    expect(result.current.settings).toHaveProperty("manualDateOffset");
  });

  it("should allow settings updates", () => {
    const { result } = renderHook(() => useSettingsContext(), { wrapper });

    // Test that we can update settings
    expect(result.current.settings.language).toBe("en");

    // Update language
    act(() => {
      result.current.updateSettings({ language: "id" });
    });
    expect(result.current.settings.language).toBe("id");

    // Update multiple properties
    act(() => {
      result.current.updateSettings({
        theme: "dark",
        notifications: false,
        manualDateOffset: 2,
      });
    });

    expect(result.current.settings.theme).toBe("dark");
    expect(result.current.settings.notifications).toBe(false);
    expect(result.current.settings.manualDateOffset).toBe(2);
    expect(result.current.settings.language).toBe("id"); // Should be preserved
  });
});
