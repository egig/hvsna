import React from "react";
import { useHijriCalendar } from "./useHijriCalendar";

/**
 * Example component demonstrating the useHijriCalendar hook
 */
export function HijriCalendarExample() {
  const {
    currentHijriDate,
    timezone,
    latitude,
    longitude,
    manualOffset,
    toHijriDate,
    fromHijriDate,
    getToday,
    getTomorrow,
    getYesterday,
    isToday,
    isTomorrow,
    isSameDay,
    getWeekDates,
    getStartOfWeek,
    formatDate,
    createHijriDate,
    loading,
    error,
    initiated,
  } = useHijriCalendar();

  if (loading) {
    return <div>Loading hijri calendar...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!initiated) {
    return <div>Initializing calendar...</div>;
  }

  const today = getToday();
  const tomorrow = getTomorrow();
  const yesterday = getYesterday();
  const weekDates = getWeekDates(currentHijriDate);
  const startOfWeek = getStartOfWeek(currentHijriDate);

  // Example of creating a custom hijri date
  const customHijriDate = createHijriDate(1446, 1, 1, 12, 30);

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Hijri Calendar Example</h2>

      {/* Settings Information */}
      <div className="mb-6 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Settings:</h3>
        <p>
          <strong>Timezone:</strong> {timezone}
        </p>
        <p>
          <strong>Latitude:</strong> {latitude || "Not set"}
        </p>
        <p>
          <strong>Longitude:</strong> {longitude || "Not set"}
        </p>
        <p>
          <strong>Manual Offset:</strong> {manualOffset || 0} days
        </p>
      </div>

      {/* Current Date Information */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Current Hijri Date:</h3>
        <p>
          <strong>Formatted:</strong>{" "}
          {formatDate(currentHijriDate, "dddd, D MMMM YYYY")}
        </p>
        <p>
          <strong>ISO:</strong> {formatDate(currentHijriDate, "YYYY-MM-DD")}
        </p>
        <p>
          <strong>Time:</strong> {formatDate(currentHijriDate, "HH:mm")}
        </p>
        <p>
          <strong>Is Today:</strong> {isToday(currentHijriDate) ? "Yes" : "No"}
        </p>
        <p>
          <strong>Is Tomorrow:</strong>{" "}
          {isTomorrow(currentHijriDate) ? "Yes" : "No"}
        </p>
      </div>

      {/* Date Navigation */}
      <div className="mb-6 p-4 bg-green-50 rounded">
        <h3 className="font-semibold mb-2">Date Navigation:</h3>
        <p>
          <strong>Yesterday:</strong>{" "}
          {formatDate(yesterday, "dddd, D MMMM YYYY")}
        </p>
        <p>
          <strong>Today:</strong> {formatDate(today, "dddd, D MMMM YYYY")}
        </p>
        <p>
          <strong>Tomorrow:</strong> {formatDate(tomorrow, "dddd, D MMMM YYYY")}
        </p>
      </div>

      {/* Week Information */}
      <div className="mb-6 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">Week Information:</h3>
        <p>
          <strong>Start of Week:</strong>{" "}
          {formatDate(startOfWeek, "dddd, D MMMM YYYY")}
        </p>
        <div>
          <strong>Week Dates:</strong>
          <ul className="ml-4 mt-1">
            {weekDates.map((date, index) => (
              <li key={index}>{formatDate(date, "ddd: D MMMM")}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Custom Date Example */}
      <div className="mb-6 p-4 bg-purple-50 rounded">
        <h3 className="font-semibold mb-2">Custom Date Example:</h3>
        <p>
          <strong>Custom Hijri Date:</strong>{" "}
          {formatDate(customHijriDate, "dddd, D MMMM YYYY HH:mm")}
        </p>
        <p>
          <strong>Gregorian Equivalent:</strong>{" "}
          {fromHijriDate(customHijriDate).toLocaleString()}
        </p>
      </div>

      {/* Date Conversion Example */}
      <div className="mb-6 p-4 bg-indigo-50 rounded">
        <h3 className="font-semibold mb-2">Date Conversion Example:</h3>
        <button
          onClick={() => {
            const gregorianDate = new Date();
            const hijriDate = toHijriDate(gregorianDate);
            alert(
              `Gregorian: ${gregorianDate.toLocaleDateString()} = Hijri: ${formatDate(hijriDate, "D MMMM YYYY")}`,
            );
          }}
          className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Convert Today's Gregorian Date to Hijri
        </button>
      </div>

      {/* Date Comparison Example */}
      <div className="mb-6 p-4 bg-red-50 rounded">
        <h3 className="font-semibold mb-2">Date Comparison Example:</h3>
        <p>
          <strong>Current == Today:</strong>{" "}
          {isSameDay(currentHijriDate, today) ? "Yes" : "No"}
        </p>
        <p>
          <strong>Current == Tomorrow:</strong>{" "}
          {isSameDay(currentHijriDate, tomorrow) ? "Yes" : "No"}
        </p>
        <p>
          <strong>Current == Custom:</strong>{" "}
          {isSameDay(currentHijriDate, customHijriDate) ? "Yes" : "No"}
        </p>
      </div>
    </div>
  );
}
