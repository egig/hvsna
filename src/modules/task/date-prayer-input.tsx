import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { HijriDateInput } from "src/modules/calendar/hijri-date-input";
import { TimeInput } from "src/modules/calendar/time-input";
import type { HijriDate } from "src/modules/calendar/hijri/hijri-date";
import type { PrayerTime } from "src/modules/task/types";

interface DatePrayerInputProps {
  selectedHijriDate: HijriDate | null;
  selectedTime: string | null;
  selectedPrayerTime?: PrayerTime | string;
  isSubmitting: boolean;
  onDateChange: (hijriDate: HijriDate | null, time: string | null, prayerTime?: PrayerTime | string) => void;
}

export function DatePrayerInput({
  selectedHijriDate,
  selectedTime,
  selectedPrayerTime,
  isSubmitting,
  onDateChange,
}: DatePrayerInputProps) {
  const { t } = useLanguageContext();

  const handleTimeChange = (time: string | null, prayerTime?: PrayerTime | string) => {
    onDateChange(selectedHijriDate, time, prayerTime);
  };

  return (
    <div className="mx-4">
      <div className="flex flex-wrap gap-3 items-center">
        <HijriDateInput
          name="atEpochMillis"
          label={t("scheduled_date_time_hijri")}
          value={selectedHijriDate as HijriDate}
          placeholder={t("date")}
          disabled={isSubmitting}
          required={false}
          className="text-base h-[38px]"
          onChange={(hijriDate: any) => {
            onDateChange(hijriDate, selectedTime, selectedPrayerTime);
          }}
        />
        <TimeInput
          name="time"
          customTime={selectedTime as string}
          prayerTime={selectedPrayerTime as PrayerTime}
          placeholder={t("time")}
          disabled={isSubmitting}
          className="text-base h-[38px]"
          onChange={handleTimeChange}
        />
      </div>
    </div>
  );
}
