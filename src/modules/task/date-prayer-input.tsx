import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { HijriDateInput } from "src/modules/calendar/hijri-date-input";
import { TimeInput } from "src/modules/calendar/time-input";
import { useHijriCalendar } from "src/modules/calendar/hijri";
import type { HijriDate } from "src/modules/calendar/hijri/hijri-date";
import type { PrayerTime, Task } from "src/modules/task/types";
import { parseHijriDateString, parseTimeString } from "./task-form-helpers";
import { useEffect, useState } from "react";

interface DatePrayerInputProps {
  atDateHijri: string | null;
  atTime: string | null;
  prayerTime: PrayerTime | string;
  isSubmitting: boolean;
  onChange: (
    hijriDate: HijriDate | null,
    time: string | null,
    prayerTime?: PrayerTime | string,
  ) => void;
}

export function DatePrayerInput({
  atDateHijri,
  atTime,
  prayerTime,
  isSubmitting,
  onChange,
}: DatePrayerInputProps) {
  const { t } = useLanguageContext();
  const { createHijriDate } = useHijriCalendar();
  const [internalHijriDate, setInternalHijriDate] = useState<HijriDate | null>(
    null,
  );
  const [internalTime, setInternalTime] = useState<string | null>(null);
  const [internalPrayerTime, setInternalPrayerTime] = useState<
    PrayerTime | string
  >("");

  // Initialize date and time from task when it changes
  useEffect(() => {
    if (atDateHijri) {
      // Parse YYYYMMDD format using helper function
      const { year, month, day } = parseHijriDateString(atDateHijri);

      // Parse time if available using helper function
      let hour: number | undefined = undefined;
      let minute: number | undefined = undefined;
      if (atTime) {
        const timeParts = parseTimeString(atTime);
        hour = timeParts.hour;
        minute = timeParts.minute;
      }

      const hijriDate = createHijriDate(year, month, day, hour, minute);
      setInternalHijriDate(hijriDate);
    }

    // Initialize time and prayer time state from existing task
    if (atTime) {
      // Task has custom time
      setInternalTime(atTime);
      setInternalPrayerTime(""); // Clear prayer time for custom time
    } else if (prayerTime) {
      // Task has prayer time
      setInternalPrayerTime(prayerTime);
      setInternalTime(null); // Clear custom time for prayer time
    } else {
      // Task has no time or prayer time
      setInternalTime(null);
      setInternalPrayerTime("");
    }
  }, [atDateHijri, atTime, prayerTime, createHijriDate]);

  // Use props if provided, otherwise use internal state
  const currentHijriDate = internalHijriDate;
  const currentTime = internalTime;
  const currentPrayerTime = internalPrayerTime;

  const handleTimeChange = (
    time: string | null,
    prayerTime?: PrayerTime | string,
  ) => {
    setInternalTime(time);
    setInternalPrayerTime(prayerTime || "");
    onChange(currentHijriDate, time, prayerTime);
  };

  return (
    <div className="mx-4">
      <div className="flex flex-wrap gap-3 items-center">
        <HijriDateInput
          name="atEpochMillis"
          label={t("scheduled_date_time_hijri")}
          value={currentHijriDate as HijriDate}
          placeholder={t("date")}
          disabled={isSubmitting}
          required={false}
          className="text-base h-[38px]"
          onChange={(hijriDate: any) => {
            onChange(hijriDate, currentTime, currentPrayerTime);
          }}
        />
        {currentHijriDate && (
          <TimeInput
            name="time"
            customTime={currentTime as string}
            prayerTime={currentPrayerTime as PrayerTime}
            placeholder={t("time")}
            disabled={isSubmitting}
            className="text-base h-[38px]"
            onChange={handleTimeChange}
          />
        )}
      </div>
    </div>
  );
}
