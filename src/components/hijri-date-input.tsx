import { useState, useEffect } from "react";
import { HijriDate, HijriMonth } from "../lib/hijri";

interface HijriDateInputProps {
  name: string;
  label: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
}

export function HijriDateInput({
  name,
  label,
  value,
  placeholder = "Select Hijri date",
  disabled = false,
  required = false,
  className = "",
  onChange,
  onBlur,
}: HijriDateInputProps) {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");

  // Initialize from Gregorian value
  useEffect(() => {
    if (value) {
      const gregDate = new Date(value);
      const hijri = HijriDate.fromDate(gregDate);
      setDay(hijri.day.toString());
      setMonth(hijri.month.toString());
      setYear(hijri.year.toString());
      setHour(gregDate.getHours().toString().padStart(2, "0"));
      setMinute(gregDate.getMinutes().toString().padStart(2, "0"));
    }
  }, [value]);

  const handleDateChange = (newDay: string, newMonth: string, newYear: string, newHour: string, newMinute: string) => {
    setDay(newDay);
    setMonth(newMonth);
    setYear(newYear);
    setHour(newHour);
    setMinute(newMinute);

    if (newDay && newMonth && newYear) {
      try {
        const hijriDate = new HijriDate(
          parseInt(newYear),
          parseInt(newMonth),
          parseInt(newDay),
          parseInt(newHour) || 0,
          parseInt(newMinute) || 0
        );
        
        const gregorianDate = hijriDate.toDate();
        const gregorianString = gregorianDate.toISOString().slice(0, 16);
        if (onChange) {
          onChange(gregorianString);
        }
      } catch (error) {
        console.error("Invalid Hijri date:", error);
      }
    }
  };

  const getDaysInMonth = () => {
    if (!year || !month) return 30;
    try {
      const hijriMonth = new HijriMonth(parseInt(year), parseInt(month));
      return hijriMonth.getDaysInMonth();
    } catch {
      return 30;
    }
  };

  const hijriMonthNames = [
    "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani",
    "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Shaaban",
    "Ramadan", "Shawwal", "Dhu al-Qidah", "Dhu al-Hijjah"
  ];

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="space-y-2">
        {/* Date Inputs */}
        <div className="flex gap-2">
          {/* Day Input */}
          <input
            type="number"
            placeholder="Day"
            value={day}
            onChange={(e) => handleDateChange(e.target.value, month, year, hour, minute)}
            disabled={disabled}
            min="1"
            max={getDaysInMonth().toString()}
            className="w-1/4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          
          {/* Month Select */}
          <select
            value={month}
            onChange={(e) => handleDateChange(day, e.target.value, year, hour, minute)}
            disabled={disabled}
            className="w-2/5 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Month</option>
            {hijriMonthNames.map((name, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1} - {name}
              </option>
            ))}
          </select>
          
          {/* Year Input */}
          <input
            type="number"
            placeholder="Year"
            value={year}
            onChange={(e) => handleDateChange(day, month, e.target.value, hour, minute)}
            disabled={disabled}
            min="1400"
            max="1500"
            className="w-1/4 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Time Inputs */}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Hour"
            value={hour}
            onChange={(e) => handleDateChange(day, month, year, e.target.value, minute)}
            disabled={disabled}
            min="0"
            max="23"
            className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
          
          <input
            type="number"
            placeholder="Minute"
            value={minute}
            onChange={(e) => handleDateChange(day, month, year, hour, e.target.value)}
            disabled={disabled}
            min="0"
            max="59"
            className="w-1/2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>
      
      <p className="text-xs text-gray-500 mt-1">
        Hijri Calendar - Using accurate conversion library
      </p>
    </div>
  );
}
