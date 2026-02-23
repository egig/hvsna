import { describe, it, expect } from "vitest";
import {
  parseHijriDateString,
  formatHijriDateString,
  parseTimeString,
} from "../task-form-helpers";

describe("task-form-helpers", () => {
  describe("parseHijriDateString", () => {
    it("should parse valid Hijri date string correctly", () => {
      const result = parseHijriDateString("14450815");
      expect(result).toEqual({
        year: 1445,
        month: 8,
        day: 15,
      });
    });

    it("should throw error for invalid format", () => {
      expect(() => parseHijriDateString("1445")).toThrow(
        "Invalid Hijri date format: 1445. Expected YYYYMMDD format.",
      );
      expect(() => parseHijriDateString("")).toThrow(
        "Invalid Hijri date format: . Expected YYYYMMDD format.",
      );
    });

    it("should throw error for invalid month", () => {
      expect(() => parseHijriDateString("14451315")).toThrow(
        "Invalid month 13 in Hijri date: 14451315. Month must be 1-12.",
      );
    });

    it("should throw error for invalid day", () => {
      expect(() => parseHijriDateString("14450831")).toThrow(
        "Invalid day 31 in Hijri date: 14450831. Day must be 1-30.",
      );
    });

    it("should throw error for non-numeric components", () => {
      expect(() => parseHijriDateString("ABCD1234")).toThrow(
        "Invalid Hijri date components in: ABCD1234",
      );
    });
  });

  describe("formatHijriDateString", () => {
    it("should format Hijri date components correctly", () => {
      const result = formatHijriDateString(1445, 8, 15);
      expect(result).toBe("14450815");
    });

    it("should pad single digit month and day with zeros", () => {
      const result = formatHijriDateString(1445, 1, 5);
      expect(result).toBe("14450105");
    });

    it("should handle year less than 1000", () => {
      const result = formatHijriDateString(45, 8, 15);
      expect(result).toBe("00450815");
    });
  });

  describe("parseTimeString", () => {
    it("should parse valid time string correctly", () => {
      const result = parseTimeString("14:30");
      expect(result).toEqual({
        hour: 14,
        minute: 30,
      });
    });

    it("should return zeros for empty string", () => {
      const result = parseTimeString("");
      expect(result).toEqual({
        hour: 0,
        minute: 0,
      });
    });

    it("should handle invalid format gracefully", () => {
      const result = parseTimeString("invalid");
      expect(result).toEqual({
        hour: 0,
        minute: 0,
      });
    });

    it("should throw error for invalid hour", () => {
      expect(() => parseTimeString("25:30")).toThrow(
        "Invalid hour 25 in time: 25:30. Hour must be 0-23.",
      );
    });

    it("should throw error for invalid minute", () => {
      expect(() => parseTimeString("14:60")).toThrow(
        "Invalid minute 60 in time: 14:60. Minute must be 0-59.",
      );
    });
  });
});
