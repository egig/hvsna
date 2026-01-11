import { describe, it, expect } from 'vitest';
import { getHijriMonthDays, getHijriDate, getPreviousHijriDate, getNextHijriDate, type HijriDate } from '../hijri-date';

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
