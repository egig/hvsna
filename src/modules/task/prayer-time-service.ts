import { getPrayerTimes, type PrayerTimesResponse } from "../prayer-times";
import { HijriDate } from "../calendar/hijri";
import type { PrayerTime } from "./types";

interface PrayerTimeCache {
  date: string;
  latitude: number;
  longitude: number;
  data: PrayerTimesResponse;
  timestamp: number;
}

// Cache prayer times for 24 hours
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const prayerCache: Map<string, PrayerTimeCache> = new Map();

/**
 * Get cache key for prayer times
 */
function getCacheKey(
  date: string,
  latitude: number,
  longitude: number,
): string {
  return `${date}-${latitude.toFixed(4)}-${longitude.toFixed(4)}`;
}

/**
 * Get cached prayer times if available and not expired
 */
function getCachedPrayerTimes(
  date: string,
  latitude: number,
  longitude: number,
): PrayerTimesResponse | null {
  const key = getCacheKey(date, latitude, longitude);
  const cached = prayerCache.get(key);

  if (!cached) {
    return null;
  }

  // Check if cache is expired
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    prayerCache.delete(key);
    return null;
  }

  return cached.data;
}

/**
 * Cache prayer times data
 */
function cachePrayerTimes(
  date: string,
  latitude: number,
  longitude: number,
  data: PrayerTimesResponse,
): void {
  const key = getCacheKey(date, latitude, longitude);
  prayerCache.set(key, {
    date,
    latitude,
    longitude,
    data,
    timestamp: Date.now(),
  });
}

/**
 * Get prayer times for a specific date and location
 */
export async function getPrayerTimesForDate(
  date: Date,
  latitude: number,
  longitude: number,
  timezone?: string,
): Promise<PrayerTimesResponse> {
  const dateString = date.toISOString().split("T")[0];

  // Check cache first
  const cached = getCachedPrayerTimes(dateString, latitude, longitude);
  if (cached) {
    return cached;
  }

  try {
    const response = await getPrayerTimes({
      date: dateString,
      latitude,
      longitude,
      timezonestring: timezone || "UTC",
    });

    // Cache the response
    cachePrayerTimes(dateString, latitude, longitude, response);

    return response;
  } catch (error) {
    throw new Error(
      `Failed to fetch prayer times for ${dateString}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}

/**
 * Get prayer time value from prayer times response
 */
export function getPrayerTimeValue(
  prayerTimes: PrayerTimesResponse,
  prayerTime: PrayerTime,
): string {
  const timings = prayerTimes.data.timings;

  switch (prayerTime) {
    case "Fajr":
      return timings.Fajr;
    case "Sunrise":
      return timings.Sunrise;
    case "Dhuhr":
      return timings.Dhuhr;
    case "Asr":
      return timings.Asr;
    case "Maghrib":
      return timings.Maghrib;
    case "Isha":
      return timings.Isha;
    default:
      throw new Error(`Unknown prayer time: ${prayerTime}`);
  }
}

/**
 * Calculate actual task time based on prayer time and offset
 */
export function calculateTaskTime(
  prayerTime: string,
  offsetMinutes: number,
  date: Date,
): Date {
  const [hours, minutes] = prayerTime.split(":").map(Number);

  // Create a new date with the prayer time
  const taskDate = new Date(date);
  taskDate.setHours(hours, minutes, 0, 0);

  // Apply offset (positive = after, negative = before)
  taskDate.setMinutes(taskDate.getMinutes() + offsetMinutes);

  return taskDate;
}

/**
 * Get task time for prayer-based scheduling
 */
export async function getPrayerBasedTaskTime(
  hijriDate: HijriDate,
  prayerTime: PrayerTime,
  offsetMinutes: number = 0,
  latitude: number = -6.2088, // Default: Jakarta
  longitude: number = 106.8456, // Default: Jakarta
  timezone?: string,
): Promise<{ time: string; epochMillis: number }> {
  const gregorianDate = hijriDate.toDate();

  // Get prayer times for the date
  const prayerTimes = await getPrayerTimesForDate(
    gregorianDate,
    latitude,
    longitude,
    timezone,
  );

  // Get the specific prayer time
  const prayerTimeValue = getPrayerTimeValue(prayerTimes, prayerTime);

  // Calculate actual task time with offset
  const taskDate = calculateTaskTime(
    prayerTimeValue,
    offsetMinutes,
    gregorianDate,
  );

  // Format time as HH:MM
  const time = `${taskDate.getHours().toString().padStart(2, "0")}:${taskDate
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  return {
    time,
    epochMillis: taskDate.getTime(),
  };
}

/**
 * Format prayer time display with offset
 */
export function formatPrayerTimeDisplay(
  prayerTime: PrayerTime,
  offsetMinutes: number = 0,
): string {
  const offsetText =
    offsetMinutes === 0
      ? ""
      : offsetMinutes > 0
        ? ` +${offsetMinutes}min`
        : ` ${offsetMinutes}min`;

  return `${prayerTime}${offsetText}`;
}

/**
 * Clear prayer times cache (useful for testing or location changes)
 */
export function clearPrayerTimesCache(): void {
  prayerCache.clear();
}

/**
 * Get cache statistics (useful for debugging)
 */
export function getPrayerTimesCacheStats(): {
  size: number;
  entries: Array<{ key: string; timestamp: number; age: number }>;
} {
  const entries = Array.from(prayerCache.entries()).map(([key, cache]) => ({
    key,
    timestamp: cache.timestamp,
    age: Date.now() - cache.timestamp,
  }));

  return {
    size: prayerCache.size,
    entries,
  };
}
