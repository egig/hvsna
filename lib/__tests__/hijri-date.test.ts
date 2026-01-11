import { describe, it, expect } from 'vitest';
import { getHijriMonthDays } from '../hijri-date';

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
