/**
 * Application configuration
 * Centralizes hard-coded values for easier maintenance
 */

/**
 * Representative coordinates for major IANA timezones.
 * Used as fallback when user has not set a GPS/manual location.
 */
export const TIMEZONE_COORDINATES: Record<
  string,
  { latitude: number; longitude: number }
> = {
  // Africa
  "Africa/Abidjan": { latitude: 5.36, longitude: -4.0083 },
  "Africa/Accra": { latitude: 5.556, longitude: -0.1969 },
  "Africa/Addis_Ababa": { latitude: 9.025, longitude: 38.7469 },
  "Africa/Algiers": { latitude: 36.7372, longitude: 3.0865 },
  "Africa/Cairo": { latitude: 30.0444, longitude: 31.2357 },
  "Africa/Casablanca": { latitude: 33.5731, longitude: -7.5898 },
  "Africa/Dar_es_Salaam": { latitude: -6.7924, longitude: 39.2083 },
  "Africa/Djibouti": { latitude: 11.5892, longitude: 43.1456 },
  "Africa/Douala": { latitude: 4.0511, longitude: 9.7679 },
  "Africa/Johannesburg": { latitude: -26.2041, longitude: 28.0473 },
  "Africa/Kampala": { latitude: 0.3476, longitude: 32.5825 },
  "Africa/Khartoum": { latitude: 15.5007, longitude: 32.5599 },
  "Africa/Lagos": { latitude: 6.5244, longitude: 3.3792 },
  "Africa/Nairobi": { latitude: -1.2921, longitude: 36.8219 },
  "Africa/Tripoli": { latitude: 32.8872, longitude: 13.1913 },
  "Africa/Tunis": { latitude: 36.819, longitude: 10.1658 },
  // Americas
  "America/Anchorage": { latitude: 61.2181, longitude: -149.9003 },
  "America/Argentina/Buenos_Aires": { latitude: -34.6037, longitude: -58.3816 },
  "America/Bogota": { latitude: 4.711, longitude: -74.0721 },
  "America/Chicago": { latitude: 41.8781, longitude: -87.6298 },
  "America/Denver": { latitude: 39.7392, longitude: -104.9903 },
  "America/Halifax": { latitude: 44.6488, longitude: -63.5752 },
  "America/Lima": { latitude: -12.0464, longitude: -77.0428 },
  "America/Los_Angeles": { latitude: 34.0522, longitude: -118.2437 },
  "America/Mexico_City": { latitude: 19.4326, longitude: -99.1332 },
  "America/New_York": { latitude: 40.7128, longitude: -74.006 },
  "America/Phoenix": { latitude: 33.4484, longitude: -112.074 },
  "America/Sao_Paulo": { latitude: -23.5505, longitude: -46.6333 },
  "America/Toronto": { latitude: 43.6532, longitude: -79.3832 },
  "America/Vancouver": { latitude: 49.2827, longitude: -123.1207 },
  // Asia - Central
  "Asia/Almaty": { latitude: 43.222, longitude: 76.8512 },
  "Asia/Ashgabat": { latitude: 37.9601, longitude: 58.3261 },
  "Asia/Baku": { latitude: 40.4093, longitude: 49.8671 },
  "Asia/Bishkek": { latitude: 42.8746, longitude: 74.5698 },
  "Asia/Dushanbe": { latitude: 38.5598, longitude: 68.787 },
  "Asia/Kabul": { latitude: 34.5553, longitude: 69.2075 },
  "Asia/Tashkent": { latitude: 41.2995, longitude: 69.2401 },
  // Asia - East
  "Asia/Bangkok": { latitude: 13.7563, longitude: 100.5018 },
  "Asia/Ho_Chi_Minh": { latitude: 10.8231, longitude: 106.6297 },
  "Asia/Hong_Kong": { latitude: 22.3193, longitude: 114.1694 },
  "Asia/Kuala_Lumpur": { latitude: 3.139, longitude: 101.6869 },
  "Asia/Manila": { latitude: 14.5995, longitude: 120.9842 },
  "Asia/Seoul": { latitude: 37.5665, longitude: 126.978 },
  "Asia/Shanghai": { latitude: 31.2304, longitude: 121.4737 },
  "Asia/Singapore": { latitude: 1.3521, longitude: 103.8198 },
  "Asia/Taipei": { latitude: 25.033, longitude: 121.5654 },
  "Asia/Tokyo": { latitude: 35.6762, longitude: 139.6503 },
  // Asia - South
  "Asia/Colombo": { latitude: 6.9271, longitude: 79.8612 },
  "Asia/Dhaka": { latitude: 23.8103, longitude: 90.4125 },
  "Asia/Karachi": { latitude: 24.8607, longitude: 67.0011 },
  "Asia/Kathmandu": { latitude: 27.7172, longitude: 85.324 },
  "Asia/Kolkata": { latitude: 22.5726, longitude: 88.3639 },
  // Asia - Southeast
  "Asia/Jakarta": { latitude: -6.2088, longitude: 106.8456 },
  "Asia/Jayapura": { latitude: -2.5337, longitude: 140.7181 },
  "Asia/Makassar": { latitude: -5.1477, longitude: 119.4327 },
  "Asia/Pontianak": { latitude: 0.0022, longitude: 109.3414 },
  // Asia - Middle East
  "Asia/Aden": { latitude: 12.7855, longitude: 45.0187 },
  "Asia/Amman": { latitude: 31.9539, longitude: 35.9106 },
  "Asia/Baghdad": { latitude: 33.3152, longitude: 44.3661 },
  "Asia/Bahrain": { latitude: 26.0667, longitude: 50.5577 },
  "Asia/Beirut": { latitude: 33.8938, longitude: 35.5018 },
  "Asia/Damascus": { latitude: 33.5138, longitude: 36.2765 },
  "Asia/Dubai": { latitude: 25.2048, longitude: 55.2708 },
  "Asia/Gaza": { latitude: 31.5017, longitude: 34.4674 },
  "Asia/Jerusalem": { latitude: 31.7683, longitude: 35.2137 },
  "Asia/Kuwait": { latitude: 29.3759, longitude: 47.9774 },
  "Asia/Muscat": { latitude: 23.5859, longitude: 58.4059 },
  "Asia/Nicosia": { latitude: 35.1856, longitude: 33.3823 },
  "Asia/Qatar": { latitude: 25.2854, longitude: 51.531 },
  "Asia/Riyadh": { latitude: 24.6877, longitude: 46.7219 },
  "Asia/Tehran": { latitude: 35.6892, longitude: 51.389 },
  "Asia/Yerevan": { latitude: 40.1872, longitude: 44.5152 },
  // Atlantic / Pacific / Indian
  "Atlantic/Reykjavik": { latitude: 64.1265, longitude: -21.8174 },
  "Indian/Maldives": { latitude: 4.1755, longitude: 73.5093 },
  "Pacific/Auckland": { latitude: -36.8509, longitude: 174.7645 },
  "Pacific/Honolulu": { latitude: 21.3069, longitude: -157.8583 },
  "Pacific/Sydney": { latitude: -33.8688, longitude: 151.2093 },
  // Europe
  "Europe/Amsterdam": { latitude: 52.3676, longitude: 4.9041 },
  "Europe/Athens": { latitude: 37.9838, longitude: 23.7275 },
  "Europe/Belgrade": { latitude: 44.8176, longitude: 20.4569 },
  "Europe/Berlin": { latitude: 52.52, longitude: 13.405 },
  "Europe/Brussels": { latitude: 50.8503, longitude: 4.3517 },
  "Europe/Bucharest": { latitude: 44.4268, longitude: 26.1025 },
  "Europe/Budapest": { latitude: 47.4979, longitude: 19.0402 },
  "Europe/Copenhagen": { latitude: 55.6761, longitude: 12.5683 },
  "Europe/Dublin": { latitude: 53.3498, longitude: -6.2603 },
  "Europe/Helsinki": { latitude: 60.1699, longitude: 24.9384 },
  "Europe/Istanbul": { latitude: 41.0082, longitude: 28.9784 },
  "Europe/Kyiv": { latitude: 50.4501, longitude: 30.5234 },
  "Europe/Lisbon": { latitude: 38.7169, longitude: -9.1399 },
  "Europe/London": { latitude: 51.5074, longitude: -0.1278 },
  "Europe/Madrid": { latitude: 40.4168, longitude: -3.7038 },
  "Europe/Minsk": { latitude: 53.9045, longitude: 27.5615 },
  "Europe/Moscow": { latitude: 55.7558, longitude: 37.6173 },
  "Europe/Oslo": { latitude: 59.9139, longitude: 10.7522 },
  "Europe/Paris": { latitude: 48.8566, longitude: 2.3522 },
  "Europe/Prague": { latitude: 50.0755, longitude: 14.4378 },
  "Europe/Rome": { latitude: 41.9028, longitude: 12.4964 },
  "Europe/Sofia": { latitude: 42.6977, longitude: 23.3219 },
  "Europe/Stockholm": { latitude: 59.3293, longitude: 18.0686 },
  "Europe/Vienna": { latitude: 48.2082, longitude: 16.3738 },
  "Europe/Warsaw": { latitude: 52.2297, longitude: 21.0122 },
  "Europe/Zurich": { latitude: 47.3769, longitude: 8.5417 },
};

/**
 * Returns the best-known coordinate for a given IANA timezone string.
 */
export function getCoordinateFromTimezone(timezone: string): {
  latitude: number;
  longitude: number;
} {
  return TIMEZONE_COORDINATES[timezone] ?? TIMEZONE_COORDINATES["Asia/Jakarta"];
}

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
  shafaq: "general",

  /**
   * Tune parameter for adjusting prayer times (in minutes)
   * Format: Imsak,Fajr,Sunrise,Dhuhr,Asr,Sunset,Maghrib,Isha,Midnight
   */
  tune: "5,3,5,7,9,-1,0,8,-6",

  /**
   * Calendar method for Hijri date calculation
   * UAQ = Umm al-Qura University, Makkah
   */
  calendarMethod: "UAQ",
} as const;
