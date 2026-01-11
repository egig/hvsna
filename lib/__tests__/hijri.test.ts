import { describe, it, expect } from 'vitest';
import { getCurrentHijriDate, getCurrentHijriDateWithMonthName } from '../hijri-date';
import type { HijriDate } from '../hijri-date';
import { HIJRI_MONTH_NAMES, HIJRI_MONTH_NAMES_EN } from '../hijri-months';
import { DAY_NAMES_AR, DAY_NAMES_EN, DAY_NAMES_EN_SHORT } from '../days';

describe('Hijri Date Functions', () => {
  describe('getCurrentHijriDate', () => {
    it('should return a valid Hijri date object', () => {
      const result = getCurrentHijriDate();
      
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('year');
      
      expect(typeof result.date).toBe('number');
      expect(typeof result.month).toBe('number');
      expect(typeof result.year).toBe('number');
    });

    it('should return date within valid range', () => {
      const result = getCurrentHijriDate();
      
      expect(result.date).toBeGreaterThanOrEqual(1);
      expect(result.date).toBeLessThanOrEqual(30);
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
      expect(result.year).toBeGreaterThan(1000);
    });

    it('should return consistent results', () => {
      const result1 = getCurrentHijriDate();
      const result2 = getCurrentHijriDate();
      
      // Results should be very close (within a few seconds)
      expect(Math.abs(result1.year - result2.year)).toBeLessThanOrEqual(1);
      expect(Math.abs(result1.month - result2.month)).toBeLessThanOrEqual(1);
      expect(Math.abs(result1.date - result2.date)).toBeLessThanOrEqual(1);
    });
  });

  describe('getCurrentHijriDateWithMonthName', () => {
    it('should return a Hijri date with month name', () => {
      const result = getCurrentHijriDateWithMonthName();
      
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('year');
      
      expect(typeof result.date).toBe('number');
      expect(typeof result.month).toBe('string');
      expect(typeof result.year).toBe('number');
    });

    it('should return a valid Arabic month name', () => {
      const result = getCurrentHijriDateWithMonthName();
      
      expect(HIJRI_MONTH_NAMES).toContain(result.month);
    });
  });
});

describe('Hijri Months Constants', () => {
  describe('HIJRI_MONTH_NAMES', () => {
    it('should have 12 months', () => {
      expect(HIJRI_MONTH_NAMES).toHaveLength(12);
    });

    it('should contain valid Arabic month names', () => {
      const expectedMonths = [
        'محرم',
        'صفر',
        'ربيع الأول',
        'ربيع الثاني',
        'جمادى الأولى',
        'جمادى الآخرة',
        'رجب',
        'شعبان',
        'رمضان',
        'شوال',
        'ذو القعدة',
        'ذو الحجة'
      ];
      
      expect(HIJRI_MONTH_NAMES).toEqual(expectedMonths);
    });
  });

  describe('HIJRI_MONTH_NAMES_EN', () => {
    it('should have 12 months', () => {
      expect(HIJRI_MONTH_NAMES_EN).toHaveLength(12);
    });

    it('should contain valid English month names', () => {
      const expectedMonths = [
        'Muharram',
        'Safar',
        'Rabi al-Awwal',
        'Rabi al-Thani',
        'Jumada al-Awwal',
        'Jumada al-Thani',
        'Rajab',
        'Shaban',
        'Ramadan',
        'Shawwal',
        'Dhu al-Qidah',
        'Dhu al-Hijjah'
      ];
      
      expect(HIJRI_MONTH_NAMES_EN).toEqual(expectedMonths);
    });
  });
});

describe('Days Constants', () => {
  describe('DAY_NAMES_AR', () => {
    it('should have 7 days', () => {
      expect(DAY_NAMES_AR).toHaveLength(7);
    });

    it('should contain valid Arabic day names', () => {
      const expectedDays = [
        'الأحد',
        'الإثنين',
        'الثلاثاء',
        'الأربعاء',
        'الخميس',
        'الجمعة',
        'السبت'
      ];
      
      expect(DAY_NAMES_AR).toEqual(expectedDays);
    });
  });

  describe('DAY_NAMES_EN', () => {
    it('should have 7 days', () => {
      expect(DAY_NAMES_EN).toHaveLength(7);
    });

    it('should contain valid English day names', () => {
      const expectedDays = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
      ];
      
      expect(DAY_NAMES_EN).toEqual(expectedDays);
    });
  });

  describe('DAY_NAMES_EN_SHORT', () => {
    it('should have 7 days', () => {
      expect(DAY_NAMES_EN_SHORT).toHaveLength(7);
    });

    it('should contain valid short English day names', () => {
      const expectedDays = [
        'Sun',
        'Mon',
        'Tue',
        'Wed',
        'Thu',
        'Fri',
        'Sat'
      ];
      
      expect(DAY_NAMES_EN_SHORT).toEqual(expectedDays);
    });

    it('should have 3-letter abbreviations', () => {
      DAY_NAMES_EN_SHORT.forEach((day: string) => {
        expect(day).toHaveLength(3);
      });
    });
  });
});
