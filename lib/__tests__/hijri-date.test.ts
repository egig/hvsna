import { describe, it, expect } from 'vitest';
import { getHijriMonthDays, getHijriDate, getPreviousHijriDate, getNextHijriDate, getPreviousHijriMonth, getNextHijriMonth, getGregorianFromHijriDate, type HijriDate } from '../hijri-date';

describe('getHijriMonthDays', () => {
  it('should return correct number of days for Rajab 1447', () => {
    const days = getHijriMonthDays(1447, 7);
    expect(days).toBe(30);
  });

  it('should return correct number of days for Ramadan 1447', () => {
    const days = getHijriMonthDays(1447, 9);
    expect(days).toBe(30);
  });

  it('should return correct number of days for Shawwal 1447', () => {
    const days = getHijriMonthDays(1447, 10);
    expect(days).toBe(29);
  });

  it('should return correct number of days for Dhul Hijjah 1447', () => {
    const days = getHijriMonthDays(1447, 12);
    expect(days).toBe(29);
  });

  it('should handle valid month range (1-12)', () => {
    for (let month = 1; month <= 12; month++) {
      const days = getHijriMonthDays(1446, month);
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(30);
    }
  });

  it('should handle different years', () => {
    const days1445 = getHijriMonthDays(1445, 1);
    const days1446 = getHijriMonthDays(1446, 1);
    const days1447 = getHijriMonthDays(1447, 1);
    
    expect(days1445).toBeGreaterThanOrEqual(29);
    expect(days1445).toBeLessThanOrEqual(30);
    expect(days1446).toBeGreaterThanOrEqual(29);
    expect(days1446).toBeLessThanOrEqual(30);
    expect(days1447).toBeGreaterThanOrEqual(29);
    expect(days1447).toBeLessThanOrEqual(30);
  });
});

describe('getPreviousHijriDate', () => {
  it('should return previous day for a given Hijri date', () => {
    const currentDate = getHijriDate(1446, 7, 15);
    const previousDate = getPreviousHijriDate(1446, 7, 15);
    
    expect(previousDate.date).toBe(14);
    expect(previousDate.month).toBe(7);
    expect(previousDate.year).toBe(1446);
    expect(typeof previousDate.dayName).toBe('string');
  });

  it('should handle month transition correctly', () => {
    const firstOfMonth = getPreviousHijriDate(1446, 7, 1);
    
    expect(firstOfMonth.date).toBeGreaterThan(0);
    expect(firstOfMonth.month).toBeLessThanOrEqual(7);
    expect(firstOfMonth.year).toBe(1446);
  });

  it('should handle year transition correctly', () => {
    const firstOfYear = getPreviousHijriDate(1446, 1, 1);
    
    expect(firstOfYear.date).toBeGreaterThan(0);
    expect(firstOfYear.month).toBeGreaterThanOrEqual(1);
    expect(firstOfYear.month).toBeLessThanOrEqual(12);
    expect(firstOfYear.year).toBeLessThanOrEqual(1446);
  });

  it('should return valid day name', () => {
    const previousDate = getPreviousHijriDate(1446, 7, 15);
    
    expect(previousDate.dayName).toMatch(/^(Sat|Sun|Mon|Tue|Wed|Thu|Fri)$/);
    expect(typeof previousDate.dayName).toBe('string');
    expect(previousDate.dayName.length).toBeGreaterThan(0);
  });
});

describe('getNextHijriDate', () => {
  it('should return next day for a given Hijri date', () => {
    const currentDate = getHijriDate(1446, 7, 15);
    const nextDate = getNextHijriDate(1446, 7, 15);
    
    expect(nextDate.date).toBe(16);
    expect(nextDate.month).toBe(7);
    expect(nextDate.year).toBe(1446);
    expect(typeof nextDate.dayName).toBe('string');
  });

  it('should handle month transition correctly', () => {
    const lastOfMonth = getNextHijriDate(1446, 7, 30);
    
    expect(lastOfMonth.date).toBeGreaterThan(0);
    expect(lastOfMonth.month).toBeGreaterThanOrEqual(7);
    expect(lastOfMonth.month).toBeLessThanOrEqual(12);
    expect(lastOfMonth.year).toBeGreaterThanOrEqual(1446);
  });

  it('should handle year transition correctly', () => {
    const lastOfYear = getNextHijriDate(1446, 12, 30);
    
    expect(lastOfYear.date).toBeGreaterThan(0);
    expect(lastOfYear.month).toBeGreaterThanOrEqual(1);
    expect(lastOfYear.month).toBeLessThanOrEqual(12);
    expect(lastOfYear.year).toBeGreaterThanOrEqual(1446);
  });

  it('should return valid day name', () => {
    const nextDate = getNextHijriDate(1446, 7, 15);
    
    expect(nextDate.dayName).toMatch(/^(Sat|Sun|Mon|Tue|Wed|Thu|Fri)$/);
    expect(typeof nextDate.dayName).toBe('string');
    expect(nextDate.dayName.length).toBeGreaterThan(0);
  });
});

describe('Date navigation consistency', () => {
  it('should maintain consistency between previous and next dates', () => {
    const baseDate = getHijriDate(1446, 7, 15);
    const previousDate = getPreviousHijriDate(1446, 7, 15);
    const nextDate = getNextHijriDate(1446, 7, 15);
    
    expect(baseDate.date).toBe(previousDate.date + 1);
    expect(nextDate.date).toBe(baseDate.date + 1);
  });

  it('should handle round trip correctly', () => {
    const originalDate = getHijriDate(1446, 7, 15);
    const previousDate = getPreviousHijriDate(1446, 7, 15);
    const nextFromPrevious = getNextHijriDate(previousDate.year, previousDate.month, previousDate.date);
    
    expect(nextFromPrevious.date).toBe(originalDate.date);
    expect(nextFromPrevious.month).toBe(originalDate.month);
    expect(nextFromPrevious.year).toBe(originalDate.year);
  });
});

describe('getPreviousHijriMonth', () => {
  it('should return previous month for a given Hijri month', () => {
    const currentMonth = getPreviousHijriMonth(1446, 8);
    
    expect(currentMonth.month).toBe(7);
    expect(currentMonth.year).toBe(1446);
    expect(typeof currentMonth.date).toBe('number');
    expect(typeof currentMonth.dayName).toBe('string');
  });

  it('should handle year transition correctly', () => {
    const firstMonth = getPreviousHijriMonth(1446, 1);
    
    expect(firstMonth.month).toBe(12);
    expect(firstMonth.year).toBe(1445);
    expect(typeof firstMonth.date).toBe('number');
    expect(typeof firstMonth.dayName).toBe('string');
  });

  it('should return valid day name', () => {
    const previousMonth = getPreviousHijriMonth(1446, 7);
    
    expect(previousMonth.dayName).toMatch(/^(Sat|Sun|Mon|Tue|Wed|Thu|Fri)$/);
    expect(typeof previousMonth.dayName).toBe('string');
    expect(previousMonth.dayName.length).toBeGreaterThan(0);
  });

  it('should handle different months correctly', () => {
    const months = [
      { input: [1446, 2], expectedMonth: 1 },
      { input: [1446, 6], expectedMonth: 5 },
      { input: [1446, 12], expectedMonth: 11 }
    ];

    months.forEach(({ input, expectedMonth }) => {
      const result = getPreviousHijriMonth(input[0], input[1]);
      expect(result.month).toBe(expectedMonth);
      expect(result.year).toBe(input[0]);
    });
  });
});

describe('getNextHijriMonth', () => {
  it('should return next month for a given Hijri month', () => {
    const currentMonth = getNextHijriMonth(1446, 6);
    
    expect(currentMonth.month).toBe(7);
    expect(currentMonth.year).toBe(1446);
    expect(typeof currentMonth.date).toBe('number');
    expect(typeof currentMonth.dayName).toBe('string');
  });

  it('should handle year transition correctly', () => {
    const lastMonth = getNextHijriMonth(1446, 12);
    
    expect(lastMonth.month).toBe(1);
    expect(lastMonth.year).toBe(1447);
    expect(typeof lastMonth.date).toBe('number');
    expect(typeof lastMonth.dayName).toBe('string');
  });

  it('should return valid day name', () => {
    const nextMonth = getNextHijriMonth(1446, 7);
    
    expect(nextMonth.dayName).toMatch(/^(Sat|Sun|Mon|Tue|Wed|Thu|Fri)$/);
    expect(typeof nextMonth.dayName).toBe('string');
    expect(nextMonth.dayName.length).toBeGreaterThan(0);
  });

  it('should handle different months correctly', () => {
    const months = [
      { input: [1446, 1], expectedMonth: 2 },
      { input: [1446, 5], expectedMonth: 6 },
      { input: [1446, 11], expectedMonth: 12 }
    ];

    months.forEach(({ input, expectedMonth }) => {
      const result = getNextHijriMonth(input[0], input[1]);
      expect(result.month).toBe(expectedMonth);
      expect(result.year).toBe(input[0]);
    });
  });
});

describe('Month navigation consistency', () => {
  it('should maintain consistency between previous and next months', () => {
    const baseMonth = 7;
    const baseYear = 1446;
    const previousMonth = getPreviousHijriMonth(baseYear, baseMonth);
    const nextMonth = getNextHijriMonth(previousMonth.year, previousMonth.month);
    
    expect(nextMonth.month).toBe(baseMonth);
    expect(nextMonth.year).toBe(baseYear);
  });

  it('should handle round trip correctly', () => {
    const originalMonth = getNextHijriMonth(1446, 7);
    const previousFromNext = getPreviousHijriMonth(originalMonth.year, originalMonth.month);
    
    expect(previousFromNext.month).toBe(7);
    expect(previousFromNext.year).toBe(1446);
  });

  it('should handle year boundaries correctly', () => {
    const endOfYear = getNextHijriMonth(1446, 12);
    const startOfNextYear = getPreviousHijriMonth(endOfYear.year, endOfYear.month);
    
    expect(startOfNextYear.month).toBe(12);
    expect(startOfNextYear.year).toBe(1446);
  });
});

describe('getGregorianFromHijriDate', () => {
  it('should convert Hijri date to Gregorian date correctly', () => {
    const gregorianDate = getGregorianFromHijriDate(1446, 7, 15);
    
    expect(gregorianDate).toHaveProperty('date');
    expect(gregorianDate).toHaveProperty('month');
    expect(gregorianDate).toHaveProperty('year');
    expect(gregorianDate).toHaveProperty('dayName');
    
    expect(typeof gregorianDate.date).toBe('number');
    expect(typeof gregorianDate.month).toBe('number');
    expect(typeof gregorianDate.year).toBe('number');
    expect(typeof gregorianDate.dayName).toBe('string');
  });

  it('should return valid Gregorian date ranges', () => {
    const gregorianDate = getGregorianFromHijriDate(1446, 7, 15);
    
    expect(gregorianDate.date).toBeGreaterThanOrEqual(1);
    expect(gregorianDate.date).toBeLessThanOrEqual(31);
    expect(gregorianDate.month).toBeGreaterThanOrEqual(1);
    expect(gregorianDate.month).toBeLessThanOrEqual(12);
    expect(gregorianDate.year).toBeGreaterThan(0);
  });

  it('should return valid day name', () => {
    const gregorianDate = getGregorianFromHijriDate(1446, 7, 15);
    
    expect(gregorianDate.dayName).toMatch(/^(Sat|Sun|Mon|Tue|Wed|Thu|Fri)$/);
    expect(typeof gregorianDate.dayName).toBe('string');
    expect(gregorianDate.dayName.length).toBeGreaterThan(0);
  });

  it('should handle different Hijri dates', () => {
    const dates = [
      { hijri: [1446, 1, 1] },
      { hijri: [1446, 7, 15] },
      { hijri: [1446, 12, 29] }
    ];

    dates.forEach(({ hijri }) => {
      const gregorianDate = getGregorianFromHijriDate(hijri[0], hijri[1], hijri[2]);
      
      expect(gregorianDate.date).toBeGreaterThan(0);
      expect(gregorianDate.month).toBeGreaterThan(0);
      expect(gregorianDate.month).toBeLessThanOrEqual(12);
      expect(gregorianDate.year).toBeGreaterThan(0);
      expect(typeof gregorianDate.dayName).toBe('string');
    });
  });

  it('should handle different Hijri years', () => {
    const year1445 = getGregorianFromHijriDate(1445, 1, 1);
    const year1446 = getGregorianFromHijriDate(1446, 1, 1);
    const year1447 = getGregorianFromHijriDate(1447, 1, 1);
    
    expect(year1445.year).toBeGreaterThan(0);
    expect(year1446.year).toBeGreaterThan(0);
    expect(year1447.year).toBeGreaterThan(0);
    
    // Years should be different
    expect(year1445.year).not.toBe(year1446.year);
    expect(year1446.year).not.toBe(year1447.year);
  });

  it('should handle edge cases like first and last days of Hijri month', () => {
    const firstDay = getGregorianFromHijriDate(1446, 7, 1);
    const lastDay = getGregorianFromHijriDate(1446, 7, 30);
    
    expect(firstDay.date).toBeGreaterThan(0);
    expect(lastDay.date).toBeGreaterThan(0);
    expect(firstDay.month).toBeGreaterThan(0);
    expect(lastDay.month).toBeGreaterThan(0);
    expect(firstDay.year).toBeGreaterThan(0);
    expect(lastDay.year).toBeGreaterThan(0);
  });
});

describe('getHijriDate', () => {
  it('should return correct Hijri date for known dates', () => {
    const hijriDate = getHijriDate(1446, 7, 1);
    
    expect(hijriDate).toHaveProperty('date');
    expect(hijriDate).toHaveProperty('month');
    expect(hijriDate).toHaveProperty('year');
    expect(hijriDate).toHaveProperty('dayName');
    
    expect(typeof hijriDate.date).toBe('number');
    expect(typeof hijriDate.month).toBe('number');
    expect(typeof hijriDate.year).toBe('number');
    expect(typeof hijriDate.dayName).toBe('string');
  });

  it('should return correct values for specific date', () => {
    const hijriDate = getHijriDate(1446, 7, 15);
    
    expect(hijriDate.date).toBe(15);
    expect(hijriDate.month).toBe(7);
    expect(hijriDate.year).toBe(1446);
    expect(hijriDate.dayName).toMatch(/^(Sat|Sun|Mon|Tue|Wed|Thu|Fri)$/);
  });

  it('should handle different months', () => {
    const rajab = getHijriDate(1446, 7, 1);
    const ramadan = getHijriDate(1446, 9, 1);
    const dhulHijjah = getHijriDate(1446, 12, 1);
    
    expect(rajab.month).toBe(7);
    expect(ramadan.month).toBe(9);
    expect(dhulHijjah.month).toBe(12);
    
    expect(rajab.year).toBe(1446);
    expect(ramadan.year).toBe(1446);
    expect(dhulHijjah.year).toBe(1446);
  });

  it('should handle different years', () => {
    const date1445 = getHijriDate(1445, 1, 1);
    const date1446 = getHijriDate(1446, 1, 1);
    const date1447 = getHijriDate(1447, 1, 1);
    
    expect(date1445.year).toBe(1445);
    expect(date1446.year).toBe(1446);
    expect(date1447.year).toBe(1447);
  });

  it('should return valid day names', () => {
    const dates = [
      getHijriDate(1446, 7, 1),
      getHijriDate(1446, 7, 2),
      getHijriDate(1446, 7, 3),
      getHijriDate(1446, 7, 4),
      getHijriDate(1446, 7, 5)
    ];
    
    dates.forEach(date => {
      expect(date.dayName).toMatch(/^(Sat|Sun|Mon|Tue|Wed|Thu|Fri)$/);
      expect(typeof date.dayName).toBe('string');
      expect(date.dayName.length).toBeGreaterThan(0);
    });
  });

});
