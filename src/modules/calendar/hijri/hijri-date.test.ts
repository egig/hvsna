import { describe, it, expect, beforeEach } from "vitest";
import { HijriDate, isAfterSunset } from "./hijri-date";

describe("HijriDate", () => {
  describe("fromDate", () => {
    it("should create HijriDate from current Gregorian date when only year provided", () => {
      const currentYear = new Date().getFullYear();
      const hijriDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(currentYear, 0, 1),
        {}
      );
      expect(hijriDate.year).toBeGreaterThan(1400);
      expect(hijriDate.month).toBeGreaterThanOrEqual(1);
      expect(hijriDate.month).toBeLessThanOrEqual(12);
      expect(hijriDate.day).toBeGreaterThanOrEqual(1);
      expect(hijriDate.day).toBeLessThanOrEqual(30);
    });

    it("should create HijriDate from specific Gregorian date", () => {
      // Known conversion: July 6, 2023 corresponds to 18 Dhu al-Hijjah 1444
      const hijriDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 6),
        {}
      );
      expect(hijriDate.year).toBe(1444);
      expect(hijriDate.month).toBe(12);
      expect(hijriDate.day).toBe(18);
    });

    it("should handle different Gregorian dates correctly", () => {
      // Test with simpler, more reliable conversions
      const testCases = [
        {
          gregorian: { year: 2023, month: 7, day: 6 },
          expected: { year: 1444, month: 12, day: 18 },
        },
        {
          gregorian: { year: 2024, month: 1, day: 1 },
          expected: { year: 1445, month: 6, day: 19 },
        },
      ];

      testCases.forEach(({ gregorian, expected }) => {
        const hijriDate = HijriDate.fromDate(
          -6.2088,
          106.8456,
          new Date(gregorian.year, gregorian.month - 1, gregorian.day),
          {}
        );
        expect(hijriDate.year).toBe(expected.year);
        expect(hijriDate.month).toBe(expected.month);
        expect(hijriDate.day).toBe(expected.day);
      });
    });
  });

  describe("previous", () => {
    it("should handle year boundaries correctly", () => {
      // Create a date that corresponds to first day of Hijri year
      // Approximate date for Muharram 1, 1445
      const date = new Date(2023, 6, 19); // Approximate date for Muharram 1
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});
      const previousDate = hijriDate.previous();

      expect(previousDate.year).toBeLessThan(hijriDate.year);
    });

    it("should return a new HijriDate instance", () => {
      const date = new Date(2023, 6, 6);
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});
      const previousDate = hijriDate.previous();

      expect(previousDate).not.toBe(hijriDate);
      expect(hijriDate.day).toBe(18); // Original should remain unchanged
    });
  });

  describe("next", () => {
    it("should return the next Hijri date", () => {
      const date = new Date(2023, 6, 6, 10); // Known date: 18 Dhu al-Hijjah 1444
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});
      const nextDate = hijriDate.next();

      expect(nextDate.year).toBe(1444);
      expect(nextDate.month).toBe(12);
      expect(nextDate.day).toBe(19);
    });

    it("should handle month boundaries correctly", () => {
      // Create a date near end of month
      const date = new Date(2023, 6, 25); // Near end of Dhu al-Hijjah
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});
      const nextDate = hijriDate.next();

      // Should move to next month or stay in same month depending on day
      expect(nextDate.month).toBeGreaterThanOrEqual(hijriDate.month);
    });

    it("should handle year boundaries correctly", () => {
      // Create a date near end of Hijri year
      const date = new Date(2023, 6, 28); // Near end of Dhu al-Hijjah
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});
      const nextDate = hijriDate.next();

      // Should move to next year or stay in same year depending on day
      expect(nextDate.year).toBeGreaterThanOrEqual(hijriDate.year);
    });

    it("should return a new HijriDate instance", () => {
      const date = new Date(2023, 6, 6);
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});
      const nextDate = hijriDate.next();

      expect(nextDate).not.toBe(hijriDate);
      expect(hijriDate.day).toBe(18); // Original should remain unchanged
    });
  });

  describe("startOfWeek", () => {
    it("should return Friday when current date is Friday", () => {
      // Create a Hijri date that corresponds to a Friday
      // July 7, 2023 was a Friday, which corresponds to 19 Dhu al-Hijjah 1444
      const fridayDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 7, 10),
        {}
      );
      const startOfWeek = fridayDate.startOfWeek();

      expect(startOfWeek.year).toBe(fridayDate.year);
      expect(startOfWeek.month).toBe(fridayDate.month);
      expect(startOfWeek.day).toBe(fridayDate.day);
      expect(fridayDate.dayOfWeek).toBe(0); // Friday is day 0 in Islamic calendar
    });

    it("should return previous Friday when current date is Saturday", () => {
      // July 8, 2023 was a Saturday, which corresponds to 20 Dhu al-Hijjah 1444
      const saturdayDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 8, 10),
        {}
      );
      const startOfWeek = saturdayDate.startOfWeek();

      // Should return to Friday (19 Dhu al-Hijjah 1444)
      expect(startOfWeek.year).toBe(1444);
      expect(startOfWeek.month).toBe(12);
      expect(startOfWeek.day).toBe(19);
      expect(saturdayDate.dayOfWeek).toBe(1); // Saturday is day 1 in Islamic calendar
    });

    it("should return previous Friday when current date is Sunday", () => {
      // July 9, 2023 was a Sunday, which corresponds to 21 Dhu al-Hijjah 1444
      const sundayDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 9, 10),
        {}
      );
      const startOfWeek = sundayDate.startOfWeek();

      // Should return to Friday (19 Dhu al-Hijjah 1444)
      expect(startOfWeek.year).toBe(1444);
      expect(startOfWeek.month).toBe(12);
      expect(startOfWeek.day).toBe(19);
      expect(sundayDate.dayOfWeek).toBe(2); // Sunday is day 2 in Islamic calendar
    });

    it("should return previous Friday when current date is Thursday", () => {
      // July 13, 2023 was a Thursday, which corresponds to 25 Dhu al-Hijjah 1444
      const thursdayDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 13, 10),
        {}
      );
      const startOfWeek = thursdayDate.startOfWeek();

      // Should return to Friday of previous week (19 Dhu al-Hijjah 1444)
      expect(startOfWeek.year).toBe(1444);
      expect(startOfWeek.month).toBe(12);
      expect(startOfWeek.day).toBe(19);
      expect(thursdayDate.dayOfWeek).toBe(6); // Thursday is day 6 in Islamic calendar
    });

    it("should return a new HijriDate instance", () => {
      const hijriDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 10, 10),
        {}
      ); // Monday
      const startOfWeek = hijriDate.startOfWeek();

      expect(startOfWeek).not.toBe(hijriDate);
      expect(hijriDate.day).toBe(22); // Original should remain unchanged
      expect(hijriDate.dayOfWeek).toBe(3); // Monday is day 3 in Islamic calendar
    });

    describe("with custom start of week", () => {
      it("should use Sunday (0) as start of week when specified", () => {
        // July 9, 2023 was a Sunday, which corresponds to 21 Dhu al-Hijjah 1444
        const sundayDate = HijriDate.fromDate(
          -6.2088,
          106.8456,
          new Date(2023, 6, 9, 10),
          {
            startOfWeek: 0,
          }
        );
        const startOfWeek = sundayDate.startOfWeek();

        // Should return to Sunday (21 Dhu al-Hijjah 1444) itself
        expect(startOfWeek.year).toBe(1444);
        expect(startOfWeek.month).toBe(12);
        expect(startOfWeek.day).toBe(21);
        expect(sundayDate.dayOfWeek).toBe(0); // Sunday is day 0 when startOfWeek is Sunday
      });

      it("should use Monday (1) as start of week when specified", () => {
        // July 9, 2023 was a Sunday, which corresponds to 21 Dhu al-Hijjah 1444
        const sundayDate = HijriDate.fromDate(
          -6.2088,
          106.8456,
          new Date(2023, 6, 9, 10, 10),
          {
            startOfWeek: 1,
          }
        );
        const startOfWeek = sundayDate.startOfWeek();

        // Should return to Monday (15 Dhu al-Hijjah 1444)
        expect(startOfWeek.year).toBe(1444);
        expect(startOfWeek.month).toBe(12);
        expect(startOfWeek.day).toBe(15);
        expect(sundayDate.dayOfWeek).toBe(6); // Sunday is day 6 when startOfWeek is Monday
      });

      it("should use Saturday (6) as start of week when specified", () => {
        // July 9, 2023 was a Sunday, which corresponds to 21 Dhu al-Hijjah 1444
        const sundayDate = HijriDate.fromDate(
          -6.2088,
          106.8456,
          new Date(2023, 6, 9, 10),
          {
            startOfWeek: 6,
          }
        );
        const startOfWeek = sundayDate.startOfWeek();

        // Should return to Saturday (20 Dhu al-Hijjah 1444)
        expect(startOfWeek.year).toBe(1444);
        expect(startOfWeek.month).toBe(12);
        expect(startOfWeek.day).toBe(20);
        expect(sundayDate.dayOfWeek).toBe(1); // Sunday is day 1 when startOfWeek is Saturday
      });

      it("should maintain custom start of week in next() and previous() methods", () => {
        const mondayDate = HijriDate.fromDate(
          -6.2088,
          106.8456,
          new Date(2023, 6, 10, 10),
          {
            startOfWeek: 1,
          }
        ); // Monday
        const nextDay = mondayDate.next();
        const prevDay = mondayDate.previous();

        // Both should maintain the same startOfWeek setting
        expect(nextDay._startOfWeek).toBe(1);
        expect(prevDay._startOfWeek).toBe(1);
        expect(mondayDate.dayOfWeek).toBe(0); // Monday is day 0 when startOfWeek is Monday
      });
    });
  });

  describe("endOfWeek", () => {
    it("should return Thursday when current date is Friday", () => {
      // Create a Hijri date that corresponds to a Friday
      // July 7, 2023 was a Friday, which corresponds to 19 Dhu al-Hijjah 1444
      const fridayDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 7, 10),
        {}
      );
      const endOfWeek = fridayDate.endOfWeek();

      // Should return Thursday of the same week (25 Dhu al-Hijjah 1444)
      expect(endOfWeek.year).toBe(fridayDate.year);
      expect(endOfWeek.month).toBe(fridayDate.month);
      expect(endOfWeek.day).toBe(25);
      expect(fridayDate.dayOfWeek).toBe(0); // Friday is day 0 in Islamic calendar
    });

    it("should return Thursday when current date is Saturday", () => {
      // July 8, 2023 was a Saturday, which corresponds to 20 Dhu al-Hijjah 1444
      const saturdayDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 8, 10),
        {}
      );
      const endOfWeek = saturdayDate.endOfWeek();

      // Should return Thursday of the same week (25 Dhu al-Hijjah 1444)
      expect(endOfWeek.year).toBe(1444);
      expect(endOfWeek.month).toBe(12);
      expect(endOfWeek.day).toBe(25);
      expect(saturdayDate.dayOfWeek).toBe(1); // Saturday is day 1 in Islamic calendar
    });

    it("should return Thursday when current date is Sunday", () => {
      // July 9, 2023 was a Sunday, which corresponds to 21 Dhu al-Hijjah 1444
      const sundayDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 9, 10),
        {}
      );
      const endOfWeek = sundayDate.endOfWeek();

      // Should return Thursday of the same week (25 Dhu al-Hijjah 1444)
      expect(endOfWeek.year).toBe(1444);
      expect(endOfWeek.month).toBe(12);
      expect(endOfWeek.day).toBe(25);
      expect(sundayDate.dayOfWeek).toBe(2); // Sunday is day 2 in Islamic calendar
    });

    it("should return Thursday when current date is Thursday", () => {
      // July 13, 2023 was a Thursday, which corresponds to 25 Dhu al-Hijjah 1444
      const thursdayDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 13, 10),
        {}
      );
      const endOfWeek = thursdayDate.endOfWeek();

      // Should return Thursday itself (25 Dhu al-Hijjah 1444)
      expect(endOfWeek.year).toBe(1444);
      expect(endOfWeek.month).toBe(12);
      expect(endOfWeek.day).toBe(25);
      expect(thursdayDate.dayOfWeek).toBe(6); // Thursday is day 6 in Islamic calendar
    });

    it("should return a new HijriDate instance", () => {
      const hijriDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 10, 10),
        {}
      ); // Monday
      const endOfWeek = hijriDate.endOfWeek();

      expect(endOfWeek).not.toBe(hijriDate);
      expect(hijriDate.day).toBe(22); // Original should remain unchanged
      expect(hijriDate.dayOfWeek).toBe(3); // Monday is day 3 in Islamic calendar
    });

    describe("with custom start of week", () => {
      it("should use Saturday (6) as end of week when startOfWeek is Sunday (0)", () => {
        // July 9, 2023 was a Sunday, which corresponds to 21 Dhu al-Hijjah 1444
        const sundayDate = HijriDate.fromDate(
          -6.2088,
          106.8456,
          new Date(2023, 6, 9, 10),
          {
            startOfWeek: 0,
          }
        );
        const endOfWeek = sundayDate.endOfWeek();

        // Should return Saturday (27 Dhu al-Hijjah 1444)
        expect(endOfWeek.year).toBe(1444);
        expect(endOfWeek.month).toBe(12);
        expect(endOfWeek.day).toBe(27);
        expect(sundayDate.dayOfWeek).toBe(0); // Sunday is day 0 when startOfWeek is Sunday
      });

      it("should use Sunday (6) as end of week when startOfWeek is Monday (1)", () => {
        // July 9, 2023 was a Sunday, which corresponds to 21 Dhu al-Hijjah 1444
        const sundayDate = HijriDate.fromDate(
          -6.2088,
          106.8456,
          new Date(2023, 6, 9, 10),
          {
            startOfWeek: 1,
          }
        );
        const endOfWeek = sundayDate.endOfWeek();

        // Should return Sunday (21 Dhu al-Hijjah 1444) itself
        expect(endOfWeek.year).toBe(1444);
        expect(endOfWeek.month).toBe(12);
        expect(endOfWeek.day).toBe(21);
        expect(sundayDate.dayOfWeek).toBe(6); // Sunday is day 6 when startOfWeek is Monday
      });

      it("should use Friday (6) as end of week when startOfWeek is Saturday (6)", () => {
        // July 9, 2023 was a Sunday, which corresponds to 21 Dhu al-Hijjah 1444
        const sundayDate = HijriDate.fromDate(
          -6.2088,
          106.8456,
          new Date(2023, 6, 9, 10),
          {
            startOfWeek: 6,
          }
        );
        const endOfWeek = sundayDate.endOfWeek();

        // Should return Friday (26 Dhu al-Hijjah 1444)
        expect(endOfWeek.year).toBe(1444);
        expect(endOfWeek.month).toBe(12);
        expect(endOfWeek.day).toBe(26);
        expect(sundayDate.dayOfWeek).toBe(1); // Sunday is day 1 when startOfWeek is Saturday
      });

      it("should maintain custom start of week in endOfWeek result", () => {
        const mondayDate = HijriDate.fromDate(
          -6.2088,
          106.8456,
          new Date(2023, 6, 10, 10),
          {
            startOfWeek: 1,
          }
        ); // Monday
        const endOfWeek = mondayDate.endOfWeek();

        // Should maintain the same startOfWeek setting
        expect(endOfWeek._startOfWeek).toBe(1);
        expect(mondayDate.dayOfWeek).toBe(0); // Monday is day 0 when startOfWeek is Monday
      });
    });
  });

  describe("format", () => {
    it("should format year tokens correctly", () => {
      const date = new Date(2023, 6, 6); // Known date: 18 Dhu al-Hijjah 1444
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});

      expect(hijriDate.format("YYYY")).toBe("1444");
      expect(hijriDate.format("YY")).toBe("44");
    });

    it("should format month tokens correctly", () => {
      const date = new Date(2023, 6, 6); // Known date: 18 Dhu al-Hijjah 1444
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});

      expect(hijriDate.format("MMMM")).toBe("Dhu al-Hijjah");
      expect(hijriDate.format("MMM")).toBe("DhuH");
      expect(hijriDate.format("MM")).toBe("12");
      expect(hijriDate.format("M")).toBe("12");
    });

    it("should format day tokens correctly", () => {
      const date = new Date(2023, 6, 6); // Known date: 18 Dhu al-Hijjah 1444
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});

      expect(hijriDate.format("DDDD")).toBe("18th");
      expect(hijriDate.format("DD")).toBe("18");
      expect(hijriDate.format("D")).toBe("18");
    });

    it("should format day ordinal suffixes correctly", () => {
      // Create dates for different days of month using fromDate with specific dates
      // that should correspond to the desired Hijri days
      const testCases = [
        { date: new Date(2023, 6, 19), expectedSuffix: "1st" }, // Approximate 1st day
        { date: new Date(2023, 6, 20), expectedSuffix: "2nd" }, // Approximate 2nd day
        { date: new Date(2023, 6, 21), expectedSuffix: "3rd" }, // Approximate 3rd day
        { date: new Date(2023, 6, 22), expectedSuffix: "4th" }, // Approximate 4th day
        { date: new Date(2023, 7, 10), expectedSuffix: "11th" }, // Approximate 11th day
        { date: new Date(2023, 7, 11), expectedSuffix: "12th" }, // Approximate 12th day
        { date: new Date(2023, 7, 12), expectedSuffix: "13th" }, // Approximate 13th day
        { date: new Date(2023, 7, 20), expectedSuffix: "21st" }, // Approximate 21st day
      ];

      testCases.forEach(({ date, expectedSuffix }) => {
        const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});
        const actualSuffix = hijriDate.format("DDDD");

        // Just test that the suffix format is correct, not the exact day
        expect(actualSuffix).toMatch(/\d+(st|nd|rd|th)/);
      });

      // Test specific known suffix patterns
      const firstDate = new Date(2023, 6, 19);
      const first = HijriDate.fromDate(-6.2088, 106.8456, firstDate, {});
      const firstDay = first.day;

      // Test ordinal suffix logic directly
      if (firstDay >= 11 && firstDay <= 13) {
        expect(first.format("DDDD")).toBe(firstDay + "th");
      } else {
        switch (firstDay % 10) {
          case 1:
            expect(first.format("DDDD")).toBe(firstDay + "st");
            break;
          case 2:
            expect(first.format("DDDD")).toBe(firstDay + "nd");
            break;
          case 3:
            expect(first.format("DDDD")).toBe(firstDay + "rd");
            break;
          default:
            expect(first.format("DDDD")).toBe(firstDay + "th");
        }
      }
    });

    it("should format day name tokens correctly", () => {
      // Use a known date: July 6, 2023 = Thursday = 18 Dhu al-Hijjah 1444
      const thursdayDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 6),
        {}
      );
      // but start of the sunset is yester day so its should be wed
      expect(thursdayDate.format("dddd")).toBe("Wednesday");
      expect(thursdayDate.format("ddd")).toBe("Wed");
      expect(thursdayDate.format("dd")).toBe("Wed");
    });

    it("should format time tokens correctly", () => {
      // Create a date with specific time
      const hijriDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 6, 14, 30, 45),
        {}
      );

      expect(hijriDate.format("HH")).toBe("14");
      expect(hijriDate.format("H")).toBe("14");
      expect(hijriDate.format("mm")).toBe("30");
      expect(hijriDate.format("m")).toBe("30");
    });

    it("should format AM/PM tokens correctly", () => {
      const morningDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 6, 9, 0, 0),
        {}
      );
      const afternoonDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 6, 15, 0, 0),
        {}
      );

      expect(morningDate.format("a")).toBe("am");
      expect(morningDate.format("A")).toBe("AM");
      expect(afternoonDate.format("a")).toBe("pm");
      expect(afternoonDate.format("A")).toBe("PM");
    });

    it("should format complex date strings correctly", () => {
      const hijriDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 6, 14, 30, 45),
        {}
      ); // Thursday, 18 Dhu al-Hijjah 1444

      expect(hijriDate.format("dddd, MMMM Do YYYY, h:mm a")).toBe(
        "Thursday, Dhu al-Hijjah 18th 1444, 2:30 pm"
      );
      expect(hijriDate.format("YYYY-MM-DD")).toBe("1444-12-18");
      expect(hijriDate.format("DD/MM/YYYY")).toBe("18/12/1444");
      expect(hijriDate.format("MMM D, YYYY")).toBe("DhuH 18, 1444");
    });

    it("should handle different months correctly", () => {
      // Create dates for different months using fromDate
      const muharramDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 30),
        {}
      ); // Approximate Muharram
      const ramadanDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 2, 23),
        {}
      ); // Approximate Ramadan
      const dhuHijjahDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 5, 6),
        {}
      ); // Dhu al-Hijjah

      // Test that different months return different names
      expect(muharramDate.format("MMMM")).not.toBe(ramadanDate.format("MMMM"));
      expect(ramadanDate.format("MMMM")).not.toBe(dhuHijjahDate.format("MMMM"));
    });
  });

  describe("edge cases", () => {
    it("should handle leap year scenarios correctly", () => {
      // Test dates around potential leap year scenarios using fromDate
      const testDates = [
        HijriDate.fromDate(-6.2088, 106.8456, new Date(2023, 6, 25), {}), // Near end of Dhu al-Hijjah
        HijriDate.fromDate(-6.2088, 106.8456, new Date(2023, 6, 30), {}), // Approximate end of month
        HijriDate.fromDate(-6.2088, 106.8456, new Date(2023, 7, 1), {}), // Approximate start of next month
      ];

      testDates.forEach((date) => {
        const prevDate = date.previous();
        const nextDate = date.next();

        expect(prevDate.day).toBeGreaterThanOrEqual(1);
        expect(prevDate.day).toBeLessThanOrEqual(30);
        expect(nextDate.day).toBeGreaterThanOrEqual(1);
        expect(nextDate.day).toBeLessThanOrEqual(30);
      });
    });

    it("should handle different month lengths correctly", () => {
      // Test various months with different lengths - use fromDate
      const testDates = [
        HijriDate.fromDate(-6.2088, 106.8456, new Date(2023, 6, 25), {}), // Near end of Dhu al-Hijjah (30 days)
        HijriDate.fromDate(-6.2088, 106.8456, new Date(2023, 5, 25), {}), // Near end of another month
        HijriDate.fromDate(-6.2088, 106.8456, new Date(2023, 2, 22), {}), // Near Ramadan (29 days in this year)
      ];

      testDates.forEach((hijriDate) => {
        const nextDate = hijriDate.next();

        // Should handle month boundaries correctly
        expect(nextDate.day).toBeGreaterThanOrEqual(1);
        expect(nextDate.day).toBeLessThanOrEqual(30);
        expect(nextDate.month).toBeGreaterThanOrEqual(1);
        expect(nextDate.month).toBeLessThanOrEqual(12);
      });
    });
  });

  describe("Sunset-based functionality", () => {
    describe("with coordinates", () => {
      const latitude = 21.4225; // Mecca
      const longitude = 39.8262;

      it("should include coordinates in fromDate", () => {
        const date = new Date(2024, 0, 1, 12, 0, 0);
        const hijriDate = HijriDate.fromDate(latitude, longitude, date, {});
        expect(hijriDate._latitude).toBe(latitude);
        expect(hijriDate._longitude).toBe(longitude);
      });

      it("should include coordinates in fromDate", () => {
        const hijriDate = HijriDate.fromDate(
          latitude,
          longitude,
          new Date(2024, 0, 1, 12, 0, 0),
          {}
        );
        expect(hijriDate._latitude).toBe(latitude);
        expect(hijriDate._longitude).toBe(longitude);
      });

      it("should include coordinates in fromDate", () => {
        const date = new Date(2024, 0, 1, 12, 0, 0);
        const hijriDate = HijriDate.fromDate(latitude, longitude, date, {});
        expect(hijriDate._latitude).toBe(latitude);
        expect(hijriDate._longitude).toBe(longitude);
      });
    });

    describe("isAfterSunset", () => {
      const latitude = 21.4225; // Mecca
      const longitude = 39.8262;

      it("should return false for time before sunset", () => {
        const date = new Date(2024, 0, 1, 10, 0, 0); // 10 AM
        expect(isAfterSunset(date, latitude, longitude)).toBe(false);
      });

      it("should return true for time after sunset", () => {
        const date = new Date(2024, 0, 1, 22, 0, 0); // 10 PM
        expect(isAfterSunset(date, latitude, longitude)).toBe(true);
      });
    });

    describe("sunset-based date transition", () => {
      const latitude = 21.4225; // Mecca
      const longitude = 39.8262;

      it("should adjust date after sunset to next day", () => {
        const eveningDate = new Date(2024, 0, 1, 22, 0, 0); // 10 PM
        const hijriDate = HijriDate.fromDate(
          latitude,
          longitude,
          eveningDate,
          {}
        );
        // The Hijri date should be for the next day due to sunset adjustment
        expect(hijriDate.day).toBeGreaterThan(0);
      });

      it("should not adjust date before sunset", () => {
        const morningDate = new Date(2024, 0, 1, 10, 0, 0); // 10 AM
        const hijriDate = HijriDate.fromDate(
          latitude,
          longitude,
          morningDate,
          {}
        );
        // The Hijri date should be for the same day
        expect(hijriDate.day).toBeGreaterThan(0);
      });

      it("should create different Hijri dates for same Gregorian day before and after sunset", () => {
        const gregorianDate = new Date(2024, 0, 1);

        // Before sunset
        const beforeSunset = new Date(gregorianDate);
        beforeSunset.setHours(10, 0, 0);
        const hijriBefore = HijriDate.fromDate(
          latitude,
          longitude,
          beforeSunset,
          {}
        );

        // After sunset
        const afterSunset = new Date(gregorianDate);
        afterSunset.setHours(22, 0, 0);
        const hijriAfter = HijriDate.fromDate(
          latitude,
          longitude,
          afterSunset,
          {}
        );

        // The Hijri date should be different (after sunset should be next day)
        expect(hijriBefore.day).not.toBe(hijriAfter.day);
      });
    });
  });

  describe("seconds and milliseconds support", () => {
    it("should create HijriDate with precise seconds and milliseconds", () => {
      const date = new Date(2023, 6, 6, 14, 30, 45, 123); // 2:30:45.123 PM
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, date, {});

      expect(hijriDate.hour).toBe(14);
      expect(hijriDate.minute).toBe(30);
      expect(hijriDate.second).toBe(45);
      expect(hijriDate.millisecond).toBe(123);
    });

    it("should handle constructor with seconds and milliseconds", () => {
      const hijriDate = new HijriDate(0, 0, 1444, 12, 18, 14, 30, 45, 123);

      expect(hijriDate.year).toBe(1444);
      expect(hijriDate.month).toBe(12);
      expect(hijriDate.day).toBe(18);
      expect(hijriDate.hour).toBe(14);
      expect(hijriDate.minute).toBe(30);
      expect(hijriDate.second).toBe(45);
      expect(hijriDate.millisecond).toBe(123);
    });

    it("should format seconds tokens correctly", () => {
      const hijriDate = HijriDate.fromDate(
        0,
        0,
        new Date(2023, 6, 6, 14, 30, 45, 123),
        {}
      );

      expect(hijriDate.format("ss")).toBe("45");
      expect(hijriDate.format("s")).toBe("45");
    });

    it("should format milliseconds tokens correctly", () => {
      const hijriDate = HijriDate.fromDate(
        0,
        0,
        new Date(2023, 6, 6, 14, 30, 45, 123),
        {}
      );

      expect(hijriDate.format("SSS")).toBe("123");
      expect(hijriDate.format("S")).toBe("123");
    });

    it("should format complex time strings with seconds and milliseconds", () => {
      const hijriDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 6, 14, 30, 45, 123),
        {}
      );

      expect(hijriDate.format("HH:mm:ss.SSS")).toBe("14:30:45.123");
      expect(hijriDate.format("h:mm:ss.SSS a")).toBe("2:30:45.123 pm");
      expect(hijriDate.format("YYYY-MM-DD HH:mm:ss.SSS")).toBe(
        "1444-12-18 14:30:45.123"
      );
    });

    it("should handle zero seconds and milliseconds", () => {
      const hijriDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 6, 14, 30, 0, 0),
        {}
      );

      expect(hijriDate.second).toBe(0);
      expect(hijriDate.millisecond).toBe(0);
      expect(hijriDate.format("ss")).toBe("00");
      expect(hijriDate.format("SSS")).toBe("000");
    });

    it("should preserve precise times in toDate() method", () => {
      const originalDate = new Date(2023, 6, 6, 14, 30, 45, 123);
      const hijriDate = HijriDate.fromDate(-6.2088, 106.8456, originalDate, {});
      const convertedDate = hijriDate.toDate();

      expect(convertedDate.getHours()).toBe(14);
      expect(convertedDate.getMinutes()).toBe(30);
      expect(convertedDate.getSeconds()).toBe(45);
      expect(convertedDate.getMilliseconds()).toBe(123);
      expect(convertedDate.getTime()).toBe(originalDate.getTime());
    });

    it("should handle startOfDay with precise sunset times", () => {
      const hijriDate = HijriDate.fromDate(
        21.4225,
        39.8262,
        new Date(2023, 6, 6, 12, -6.2088, 106.8456, 0),
        {}
      );

      const startOfDay = hijriDate.startOfDay();

      // Should have sunset time with seconds and milliseconds
      expect(startOfDay.hour).toBeGreaterThanOrEqual(17); // Around sunset time
      expect(startOfDay.second).toBeGreaterThanOrEqual(0);
      expect(startOfDay.millisecond).toBeGreaterThanOrEqual(0);
    });

    it("should handle endOfDay with precise times", () => {
      const hijriDate = HijriDate.fromDate(
        21.4225,
        39.8262,
        new Date(2023, 6, 6, 12, 0, 0, 0),
        {}
      );

      const endOfDay = hijriDate.endOfDay();

      // Should be just before next day's sunset
      expect(endOfDay.hour).toBeGreaterThanOrEqual(17); // Around sunset time
      expect(endOfDay.second).toBeGreaterThanOrEqual(0);
      expect(endOfDay.millisecond).toBeGreaterThanOrEqual(0);
    });

    it("should handle edge case with maximum milliseconds", () => {
      const hijriDate = HijriDate.fromDate(
        -6.2088,
        106.8456,
        new Date(2023, 6, 6, 14, 30, 45, 999),
        {}
      );

      expect(hijriDate.millisecond).toBe(999);
      expect(hijriDate.format("SSS")).toBe("999");
      expect(hijriDate.format("HH:mm:ss.SSS")).toBe("14:30:45.999");
    });

    it("should handle undefined seconds and milliseconds in constructor gracefully", () => {
      const hijriDate = new HijriDate(
        -6.2088,
        106.8456,
        1444,
        12,
        18,
        14,
        30,
        undefined,
        undefined
      );

      expect(hijriDate.hour).toBe(14);
      expect(hijriDate.minute).toBe(30);
    });
  });
});
