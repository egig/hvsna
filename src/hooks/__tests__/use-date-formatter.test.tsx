import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { LanguageProvider } from "../../contexts/LanguageContext";
import { useDateFormatter } from "../use-date-formatter";

// Mock the PouchDBContext
vi.mock("../../pouchdb", () => ({
  usePouchDB: vi.fn(() => ({ db: null })),
}));

// Mock the useSettings hook
vi.mock("../../hooks/useSettings", () => ({
  useSettings: vi.fn(() => ({
    settings: { language: "en" },
    setLanguage: vi.fn(),
    loadSettings: vi.fn(),
  })),
}));

// Wrapper component for testing
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe("useDateFormatter", () => {
  it("should provide localized date formatting", () => {
    const { result } = renderHook(() => useDateFormatter(), { wrapper });

    expect(result.current.activeDate).toBeDefined();
    expect(result.current.gregorianDate).toBeInstanceOf(Date);
    expect(result.current.pageTitle).toBeTypeOf("string");
    expect(result.current.subTitle).toBeTypeOf("string");
    expect(result.current.hijriMonthNames).toHaveLength(12);
    expect(result.current.gregorianMonthNames).toHaveLength(12);
    expect(result.current.dayNames).toHaveLength(7);
    expect(result.current.weekDays).toHaveLength(7);
  });

  it("should use English translations by default", () => {
    const { result } = renderHook(() => useDateFormatter(), { wrapper });

    expect(result.current.hijriMonthNames[0]).toBe("Muharram");
    expect(result.current.gregorianMonthNames[0]).toBe("January");
    expect(result.current.dayNames[0]).toBe("Sunday");
    expect(result.current.weekDays[0]).toBe("Fri"); // Friday for Hijri calendar
  });

  it("should accept initial date option", () => {
    const testDate = new Date("2024-01-01");
    const { result } = renderHook(
      () => useDateFormatter({ initialDate: testDate }),
      { wrapper },
    );

    expect(result.current.activeDate.toDate().getFullYear()).toBe(2024);
  });
});
