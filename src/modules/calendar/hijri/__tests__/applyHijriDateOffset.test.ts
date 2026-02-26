import { describe, it, expect } from "vitest";
import { HijriDate } from "../hijri-date";

// We need to access the private function for testing
// Since it's not exported, we'll test it indirectly through the public methods
describe("applyHijriDateOffset (via HijriDate methods)", () => {
  it("should handle positive offset (subtract days)", () => {
    // Test with a known Hijri date: 1445-01-15
    const originalDate = HijriDate.hijriToJsDate(1445, 1, 15);
    const offsetDate = HijriDate.hijriToJsDate(
      1445,
      1,
      15,
      undefined,
      undefined,
      { offset: 3 },
    );

    // Should be 3 days earlier: 1445-01-12
    const expectedDate = HijriDate.hijriToJsDate(1445, 1, 12);

    expect(offsetDate.getTime()).toBe(expectedDate.getTime());
  });

  it("should handle negative offset (add days)", () => {
    // Test with a known Hijri date: 1445-01-15
    const originalDate = HijriDate.hijriToJsDate(1445, 1, 15);
    const offsetDate = HijriDate.hijriToJsDate(
      1445,
      1,
      15,
      undefined,
      undefined,
      { offset: -2 },
    );

    // Should be 2 days later: 1445-01-17
    const expectedDate = HijriDate.hijriToJsDate(1445, 1, 17);

    expect(offsetDate.getTime()).toBe(expectedDate.getTime());
  });

  it("should handle month underflow with positive offset", () => {
    // Test beginning of month: 1445-01-03 with offset 5 (subtract 5 days)
    const offsetDate = HijriDate.hijriToJsDate(
      1445,
      1,
      3,
      undefined,
      undefined,
      { offset: 5 },
    );

    // Should underflow to previous month: 1444-12-? (subtract 3 days to go to previous month)
    const resultHijri = HijriDate.fromDate(offsetDate);
    expect(resultHijri.month).toBe(12);
    expect(resultHijri.year).toBe(1444);
  });

  it("should return same date when offset is 0", () => {
    const originalDate = HijriDate.hijriToJsDate(1445, 6, 15);
    const offsetDate = HijriDate.hijriToJsDate(
      1445,
      6,
      15,
      undefined,
      undefined,
      { offset: 0 },
    );

    expect(offsetDate.getTime()).toBe(originalDate.getTime());
  });

  it("should handle large positive offset (subtract many days)", () => {
    // Test with large offset: 1445-06-15 with offset 100 (subtract 100 days)
    const offsetDate = HijriDate.hijriToJsDate(
      1445,
      6,
      15,
      undefined,
      undefined,
      { offset: 100 },
    );

    // Should be approximately 100 days earlier, likely in previous month
    const resultHijri = HijriDate.fromDate(offsetDate);
    expect(resultHijri.year).toBeLessThanOrEqual(1445);
    expect(resultHijri.month).toBeLessThan(6);
  });

  it("should handle large negative offset (add many days)", () => {
    // Test with large negative offset: 1445-06-15 with offset -50 (add 50 days)
    const offsetDate = HijriDate.hijriToJsDate(
      1445,
      6,
      15,
      undefined,
      undefined,
      { offset: -50 },
    );

    // Should be approximately 50 days later, likely in next month
    const resultHijri = HijriDate.fromDate(offsetDate);
    expect(resultHijri.year).toBeGreaterThanOrEqual(1445);
    expect(resultHijri.month).toBeGreaterThan(6);
  });
});
