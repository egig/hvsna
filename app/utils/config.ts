/**
 * Application configuration
 * Centralizes hard-coded values for easier maintenance
 */

/**
 * Default location fallback (Jakarta, Indonesia)
 * Used when IP-based location detection fails
 */
export const DEFAULT_LOCATION = {
  latitude: 6.2001514,
  longitude: 106.829547,
} as const;

/**
 * Default timezone for prayer times
 * TODO: Should be dynamically determined from location data
 */
export const DEFAULT_TIMEZONE = 'Asia/Jakarta' as const;

/**
 * Prayer times API configuration
 * Based on Aladhan API (https://aladhan.com/prayer-times-api)
 */
export const PRAYER_TIMES_CONFIG = {
  /**
   * Calculation method
   * 20 = Institute of Geophysics, University of Tehran
   */
  method: 20,

  /**
   * Shafaq parameter for Isha time
   * 'general' uses a general approach
   */
  shafaq: 'general',

  /**
   * Tune parameter for adjusting prayer times (in minutes)
   * Format: Imsak,Fajr,Sunrise,Dhuhr,Asr,Sunset,Maghrib,Isha,Midnight
   */
  tune: '5,3,5,7,9,-1,0,8,-6',

  /**
   * Calendar method for Hijri date calculation
   * UAQ = Umm al-Qura University, Makkah
   */
  calendarMethod: 'UAQ',
} as const;
