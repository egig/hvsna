import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { HijriDateInput } from "src/modules/calendar/hijri-date-input";
import type { HijriDate } from "src/modules/calendar/hijri/hijri-date";

interface DatePrayerInputProps {
  selectedHijriDate: HijriDate | null;
  selectedTime: string | null;
  selectedPrayerTime?: string;
  isSubmitting: boolean;
  onDateChange: (hijriDate: HijriDate | null, time: string | null) => void;
  onPrayerTimeChange: (
    prayerTime: string,
    time: string,
    prayerOffset: number,
  ) => void;
}

export function DatePrayerInput({
  selectedHijriDate,
  selectedTime,
  selectedPrayerTime,
  isSubmitting,
  onDateChange,
  onPrayerTimeChange,
}: DatePrayerInputProps) {
  const { t } = useLanguageContext();

  const handlePrayerTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prayerTime = e.target.value;
    if (prayerTime) {
      onPrayerTimeChange("", prayerTime, 0);
    } else {
      onPrayerTimeChange(selectedTime || "", "", 0);
    }
  };

  return (
    <div className="mx-4">
      <div className="flex flex-wrap gap-3 items-center">
        <HijriDateInput
          name="atEpochMillis"
          label={t("scheduled_date_time_hijri")}
          value={selectedHijriDate as HijriDate}
          timeValue={selectedTime as string}
          placeholder={t("date")}
          disabled={isSubmitting}
          required={false}
          className="text-base h-[38px]"
          onChange={(hijriDate: any, time: string | null) => {
            onDateChange(hijriDate, time);
          }}
        />
        <select
          value={selectedPrayerTime || ""}
          onChange={handlePrayerTimeChange}
          disabled={isSubmitting}
          className="h-[38px] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] focus:border-[var(--hvsna-primary-color)] dark:bg-gray-700 dark:text-white whitespace-nowrap"
        >
          <option value="">{t("select_prayer_time")}</option>
          <option value="Fajr">{t("fajr")}</option>
          <option value="Sunrise">{t("sunrise")}</option>
          <option value="Dhuhr">{t("dhuhr")}</option>
          <option value="Asr">{t("asr")}</option>
          <option value="Maghrib">{t("maghrib")}</option>
          <option value="Isha">{t("isha")}</option>
        </select>
      </div>
    </div>
  );
}
