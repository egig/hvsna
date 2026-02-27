import { useState, useEffect } from "react";
import { Page } from "../navigation/page";
import { useHijriDate } from "./hijri/use-hijri-date";
import { getSunsetTime } from "./hijri/hijri-date";

export function HijriCalendar() {
  const {
    currentHijriDate,
    timezone,
    latitude,
    longitude,
    manualOffset,
    getToday,
    toGregorianDate,
    formatDate,
    loading,
    error,
  } = useHijriDate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [sunsetTime, setSunsetTime] = useState<string | null>(null);
  const [sunsetLoading, setSunsetLoading] = useState(false);
  const [sunsetError, setSunsetError] = useState<string | null>(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch sunset time
  useEffect(() => {
    const fetchSunsetTime = () => {
      if (!latitude || !longitude) {
        setSunsetError("Location coordinates not available");
        return;
      }

      setSunsetLoading(true);
      setSunsetError(null);

      try {
        const today = getToday();
        const gregorianDate = toGregorianDate(today);
        const sunset = getSunsetTime(gregorianDate, latitude, longitude);

        if (sunset) {
          // Format sunset time as HH:MM
          const sunsetTimeStr = sunset.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: timezone,
          });
          setSunsetTime(sunsetTimeStr);
        } else {
          setSunsetError("Could not calculate sunset time");
        }
      } catch (err) {
        setSunsetError(
          err instanceof Error
            ? err.message
            : "Failed to calculate sunset time",
        );
      } finally {
        setSunsetLoading(false);
      }
    };

    // Initial fetch
    fetchSunsetTime();

    // Refresh sunset time every minute (in case date changes)
    const refreshInterval = setInterval(fetchSunsetTime, 60000);

    return () => clearInterval(refreshInterval);
  }, [latitude, longitude, timezone, getToday, toGregorianDate]);

  // Format current time
  const formatCurrentTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
      timeZone: timezone,
    });
  };

  // Format Gregorian date with time
  const formatGregorianDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone,
    });
  };

  // Format Gregorian date (date only)
  const formatGregorianDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: timezone,
    });
  };

  // Get next day start (sunset time)
  const getNextDayStart = () => {
    const today = getToday();
    return today.next().startOfDay().toDate();
  };

  // Get start of current Hijri day using startOfDay method
  const getCurrentDayStart = () => {
    try {
      const today = getToday();
      return today.startOfDay().toDate();
    } catch (error) {
      return new Date();
    }
  };

  if (loading) {
    return (
      <Page>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading calendar...</div>
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-500">Error: {error}</div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="p-4 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-[var(--hvsna-primary-color)]">
          Hijri Calendar
        </h1>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 p-4 space-y-4">
          {/* Current Hijri Date */}
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">
              Current Hijri Date
            </h2>
            <div className="text-xl font-bold text-[var(--hvsna-primary-color)]">
              {formatDate(currentHijriDate, "DD MMMM YYYY")}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(currentHijriDate, "dddd")}
            </div>
          </div>

          {/* Current Time */}
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">
              Current Time
            </h2>
            <div className="text-xl font-bold text-[var(--hvsna-success-color)]">
              {formatCurrentTime(currentTime)}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Timezone: {timezone}
            </div>
          </div>

          {/* Today's Sunset */}
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">
              Today's Sunset
            </h2>
            {sunsetLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Loading sunset time...
              </div>
            ) : sunsetError ? (
              <div className="text-sm text-[var(--hvsna-danger-color)]">
                {sunsetError}
              </div>
            ) : sunsetTime ? (
              <div className="text-xl font-bold text-[var(--hvsna-warning-color)]">
                {sunsetTime}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Sunset time not available
              </div>
            )}
            {latitude && longitude && (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Location: {latitude.toFixed(4)}°, {longitude.toFixed(4)}°
              </div>
            )}
          </div>

          {/* Start of Current Hijri Day */}
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">
              Start of Current Day
            </h2>
            {sunsetLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Loading day start...
              </div>
            ) : sunsetError ? (
              <div className="text-sm text-[var(--hvsna-danger-color)]">
                Cannot determine day start
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-xl font-bold text-[var(--hvsna-info-color)]">
                  {getCurrentDayStart().toDateString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatGregorianDateTime(getCurrentDayStart())}
                  <br />
                  {getToday().startOfDay().day}
                </div>
              </div>
            )}
          </div>

          {/* Start of Next Hijri Day */}
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">
              Start of Next Day
            </h2>
            {sunsetLoading ? (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Loading next day start...
              </div>
            ) : sunsetError ? (
              <div className="text-sm text-[var(--hvsna-danger-color)]">
                Cannot determine next day start
              </div>
            ) : sunsetTime ? (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                {formatGregorianDateTime(getNextDayStart())}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Next day start not available
              </div>
            )}
          </div>

          {/* Current Gregorian Date */}
          <div className="text-center">
            <h2 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">
              Current Gregorian Date
            </h2>
            <div className="text-xl font-bold text-[var(--hvsna-primary-color-active-tab)]">
              {formatGregorianDate(currentTime)}
            </div>
          </div>

          {/* Additional Information */}
          <div className="border-t border-gray-200 dark:border-gray-800 pt-3">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Hijri Day:
                </span>
                <span className="ml-2 text-gray-800 dark:text-gray-200">
                  {currentHijriDate.day}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Hijri Month:
                </span>
                <span className="ml-2 text-gray-800 dark:text-gray-200">
                  {currentHijriDate.month}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Hijri Year:
                </span>
                <span className="ml-2 text-gray-800 dark:text-gray-200">
                  {currentHijriDate.year}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  Manual Offset:
                </span>
                <span className="ml-2 text-gray-800 dark:text-gray-200">
                  {manualOffset || 0} days
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
