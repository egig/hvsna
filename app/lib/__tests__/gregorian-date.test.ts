import { describe, it, expect } from 'vitest';
import {
  getCurrentGregorianDate,
  getCurrentGregorianDateFormatted,
  getCurrentGregorianDateComponents
} from '../gregorian-date';
import type { GregorianDate } from '../gregorian-date';

describe('Gregorian Date Functions', () => {
  describe('getCurrentGregorianDate', () => {
    it('should return a valid Gregorian date object', () => {
      const result = getCurrentGregorianDate();
      
      expect(result).toHaveProperty('date');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('dayName');
      expect(result).toHaveProperty('monthName');
      expect(result).toHaveProperty('formatted');
      
      expect(typeof result.date).toBe('number');
      expect(typeof result.month).toBe('number');
      expect(typeof result.year).toBe('number');
      expect(typeof result.dayName).toBe('string');
      expect(typeof result.monthName).toBe('string');
      expect(typeof result.formatted).toBe('string');
    });

    it('should return date within valid ranges', () => {
      const result = getCurrentGregorianDate();
      
      expect(result.date).toBeGreaterThanOrEqual(1);
      expect(result.date).toBeLessThanOrEqual(31);
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
      expect(result.year).toBeGreaterThan(2000);
    });

    it('should return valid day name', () => {
      const result = getCurrentGregorianDate();
      const validDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      expect(validDayNames).toContain(result.dayName);
    });

    it('should return valid month name', () => {
      const result = getCurrentGregorianDate();
      const validMonthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      
      expect(validMonthNames).toContain(result.monthName);
    });

    it('should return correctly formatted date string', () => {
      const result = getCurrentGregorianDate();
      
      // Should match YYYY-MM-DD format
      expect(result.formatted).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return consistent results', () => {
      const result1 = getCurrentGregorianDate();
      const result2 = getCurrentGregorianDate();
      
      // Results should be very close (within a few seconds)
      expect(Math.abs(result1.year - result2.year)).toBeLessThanOrEqual(1);
      expect(Math.abs(result1.month - result2.month)).toBeLessThanOrEqual(1);
      expect(Math.abs(result1.date - result2.date)).toBeLessThanOrEqual(1);
    });
  });

  describe('getCurrentGregorianDateFormatted', () => {
    it('should return default format when no format provided', () => {
      const result = getCurrentGregorianDateFormatted();
      
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return custom format when format is provided', () => {
      const result = getCurrentGregorianDateFormatted('DD/MM/YYYY');
      
      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    });

    it('should return different formats for different inputs', () => {
      const defaultFormat = getCurrentGregorianDateFormatted();
      const customFormat = getCurrentGregorianDateFormatted('MM-DD-YYYY');
      
      expect(defaultFormat).not.toBe(customFormat);
      expect(defaultFormat).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(customFormat).toMatch(/^\d{2}-\d{2}-\d{4}$/);
    });

    it('should handle various format strings', () => {
      const yearOnly = getCurrentGregorianDateFormatted('YYYY');
      const monthOnly = getCurrentGregorianDateFormatted('MM');
      const dayOnly = getCurrentGregorianDateFormatted('DD');
      
      expect(yearOnly).toMatch(/^\d{4}$/);
      expect(monthOnly).toMatch(/^\d{2}$/);
      expect(dayOnly).toMatch(/^\d{2}$/);
    });
  });

  describe('getCurrentGregorianDateComponents', () => {
    it('should return all required components', () => {
      const result = getCurrentGregorianDateComponents();
      
      expect(result).toHaveProperty('day');
      expect(result).toHaveProperty('month');
      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('hour');
      expect(result).toHaveProperty('minute');
      expect(result).toHaveProperty('second');
      
      expect(typeof result.day).toBe('number');
      expect(typeof result.month).toBe('number');
      expect(typeof result.year).toBe('number');
      expect(typeof result.hour).toBe('number');
      expect(typeof result.minute).toBe('number');
      expect(typeof result.second).toBe('number');
    });

    it('should return values within valid ranges', () => {
      const result = getCurrentGregorianDateComponents();
      
      expect(result.day).toBeGreaterThanOrEqual(1);
      expect(result.day).toBeLessThanOrEqual(31);
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
      expect(result.year).toBeGreaterThan(2000);
      expect(result.hour).toBeGreaterThanOrEqual(0);
      expect(result.hour).toBeLessThanOrEqual(23);
      expect(result.minute).toBeGreaterThanOrEqual(0);
      expect(result.minute).toBeLessThanOrEqual(59);
      expect(result.second).toBeGreaterThanOrEqual(0);
      expect(result.second).toBeLessThanOrEqual(59);
    });

    it('should return consistent date components across functions', () => {
      const fullDate = getCurrentGregorianDate();
      const components = getCurrentGregorianDateComponents();
      
      expect(fullDate.date).toBe(components.day);
      expect(fullDate.month).toBe(components.month);
      expect(fullDate.year).toBe(components.year);
    });
  });
});
