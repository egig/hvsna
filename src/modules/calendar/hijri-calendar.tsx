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
          err instanceof Error ? err.message : "Failed to calculate sunset time"
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

  // Define calendar data structure
  const calendarData = [
    {
      id: "current-hijri-date",
      label: "Current Hijri Date",
      value: {
        primary: formatDate(currentHijriDate, "DD MMMM YYYY"),
        secondary: formatDate(currentHijriDate, "dddd"),
        tertiary: `Gregorian: ${currentHijriDate.toDate().toString()}`,
      },
      color: "text-[var(--hvsna-primary-color)]",
    },
    {
      id: "start-of-current-day",
      label: "Start of Current Day",
      value: sunsetLoading
        ? {
            primary: "Loading day start...",
          }
        : sunsetError
        ? {
            primary: "Cannot determine day start",
            color: "text-[var(--hvsna-danger-color)]",
          }
        : {
            primary: getToday().startOfDay().toDate().toString(),
            secondary: "",
            tertiary: `Hijri: ${formatDate(
              getToday(),
              "DD MMMM YYYY HH:mm:ss.SSS"
            )}`,
          },
      color: "text-[var(--hvsna-info-color)]",
      striped: true,
    },
    {
      id: "end-of-current-day",
      label: "End of Current Day",
      value: sunsetLoading
        ? {
            primary: "Loading sunset time...",
          }
        : sunsetError
        ? {
            primary: "Cannot determine day end",
            color: "text-[var(--hvsna-danger-color)]",
          }
        : sunsetTime
        ? {
            primary: sunsetTime,
            secondary:
              "Gregorian: " + getToday().endOfDay().toDate().toString(),
          }
        : {
            primary: "Day end time not available",
          },
      color: "text-[var(--hvsna-warning-color)]",
    },
    {
      id: "start-of-next-day",
      label: "Start of Next Day",
      value: sunsetLoading
        ? {
            primary: "Loading next day start...",
          }
        : sunsetError
        ? {
            primary: "Cannot determine next day start",
            color: "text-[var(--hvsna-danger-color)]",
          }
        : sunsetTime
        ? {
            primary: getToday().next().startOfDay().toDate().toString(),
            secondary: `Hijri: ${formatDate(
              getToday().next(),
              "DD MMMM YYYY HH:mm:ss.SSS"
            )}`,
          }
        : {
            primary: "Next day start not available",
          },
    },
  ];

  // Render function for value content
  const renderValue = (value: any, defaultColor: string) => {
    const color = value.color || defaultColor;

    return (
      <div className="space-y-1">
        <div className={`text-lg font-bold ${color}`}>{value.primary}</div>
        {value.secondary && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {value.secondary}
          </div>
        )}
        {value.tertiary && (
          <div className="text-xs text-gray-400 dark:text-gray-500">
            {value.tertiary}
          </div>
        )}
      </div>
    );
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
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-center mb-6 text-[var(--hvsna-primary-color)]">
          Hijri Calendar
        </h1>

        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Information
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {calendarData.map((item) => (
                <tr
                  key={item.id}
                  className={item.striped ? "bg-gray-50 dark:bg-gray-800" : ""}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {item.label}
                  </td>
                  <td className="px-4 py-3">
                    {renderValue(item.value, item.color || "text-gray-900")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Page>
  );
}
