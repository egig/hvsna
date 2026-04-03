import type { ITimezoneProvider } from "../../domain/settings/ITimezoneProvider";

const LONGITUDE_TO_TIMEZONE: Record<string, string> = {
  "GMT+0": "Europe/London",
  "GMT+1": "Europe/Paris",
  "GMT+2": "Europe/Cairo",
  "GMT+3": "Europe/Moscow",
  "GMT+4": "Asia/Dubai",
  "GMT+5": "Asia/Karachi",
  "GMT+6": "Asia/Dhaka",
  "GMT+7": "Asia/Jakarta",
  "GMT+8": "Asia/Shanghai",
  "GMT+9": "Asia/Tokyo",
  "GMT+10": "Australia/Sydney",
  "GMT+11": "Pacific/Noumea",
  "GMT+12": "Pacific/Auckland",
  "GMT-1": "Atlantic/Azores",
  "GMT-2": "Atlantic/South_Georgia",
  "GMT-3": "America/Sao_Paulo",
  "GMT-4": "America/New_York",
  "GMT-5": "America/Chicago",
  "GMT-6": "America/Denver",
  "GMT-7": "America/Los_Angeles",
  "GMT-8": "America/Anchorage",
  "GMT-9": "Pacific/Gambier",
  "GMT-10": "Pacific/Honolulu",
  "GMT-11": "Pacific/Midway",
  "GMT-12": "Pacific/Kiritimati",
};

export class TimeAPITimezoneProvider implements ITimezoneProvider {
  async getTimezone(
    latitude: number,
    longitude: number,
  ): Promise<string | null> {
    try {
      const response = await fetch(
        `https://timeapi.io/api/Time/current/coordinate?latitude=${latitude}&longitude=${longitude}`,
      );

      if (!response.ok) throw new Error("Failed to fetch timezone data");

      const data = await response.json();
      if (data?.timezone) return data.timezone;

      // Fallback: estimate from longitude
      const offset = Math.round(longitude / 15);
      const gmtString = offset >= 0 ? `GMT+${offset}` : `GMT${offset}`;
      return LONGITUDE_TO_TIMEZONE[gmtString] ?? gmtString;
    } catch {
      return null;
    }
  }
}
