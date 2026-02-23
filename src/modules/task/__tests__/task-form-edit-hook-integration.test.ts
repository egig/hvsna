import { describe, it, expect } from "vitest";
import { parseHijriDateString, parseTimeString } from "../task-form-helpers";

describe("task-form-edit-hook integration", () => {
  it("should parse Hijri date and time for edit form", () => {
    // Simulate the edit form parsing logic
    const mockTask = {
      atDateHijri: "14450815",
      atTime: "14:30",
    };

    // Parse YYYYMMDD format using helper function
    const { year, month, day } = parseHijriDateString(mockTask.atDateHijri);

    // Parse time if available using helper function
    let hour = 0;
    let minute = 0;
    if (mockTask.atTime) {
      const timeParts = parseTimeString(mockTask.atTime);
      hour = timeParts.hour;
      minute = timeParts.minute;
    }

    expect(year).toBe(1445);
    expect(month).toBe(8);
    expect(day).toBe(15);
    expect(hour).toBe(14);
    expect(minute).toBe(30);
  });

  it("should handle task without time", () => {
    const mockTask = {
      atDateHijri: "14450815",
      atTime: undefined,
    };

    const { year, month, day } = parseHijriDateString(mockTask.atDateHijri);

    let hour = 0;
    let minute = 0;
    if (mockTask.atTime) {
      const timeParts = parseTimeString(mockTask.atTime);
      hour = timeParts.hour;
      minute = timeParts.minute;
    }

    expect(year).toBe(1445);
    expect(month).toBe(8);
    expect(day).toBe(15);
    expect(hour).toBe(0);
    expect(minute).toBe(0);
  });
});
