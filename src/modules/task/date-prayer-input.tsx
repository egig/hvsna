import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { HijriDateInput } from "src/modules/calendar/hijri-date-input";
import { TimeInput } from "src/modules/calendar/time-input";
import type { HijriDate } from "src/modules/calendar/hijri/hijri-date";
import type { PrayerTime, TaskRepeat } from "src/modules/task/types";
import { RepeatSelector } from "./repeat-selector";

interface DatePrayerInputProps {
  hijriDate: HijriDate | null;
  atTime: string | null;
  prayerTime: PrayerTime | string;
  isSubmitting: boolean;
  repeat?: TaskRepeat;
  repeatInterval?: number;
  onRepeatChange?: (repeat: TaskRepeat, interval: number) => void;
  onChange: (
    hijriDate: HijriDate | null,
    time: string | null,
    prayerTime?: PrayerTime | string,
  ) => void;
}

export function DatePrayerInput({
  hijriDate,
  atTime,
  prayerTime,
  isSubmitting,
  repeat = "none",
  repeatInterval = 1,
  onRepeatChange,
  onChange,
}: DatePrayerInputProps) {
  const { t } = useLanguageContext();

  return (
    <div className="w-fit">
      <div className="flex gap-3 items-center">
        <HijriDateInput
          name="atEpochMillis"
          label={t("scheduled_date_time_hijri")}
          value={hijriDate as HijriDate}
          placeholder={t("date")}
          disabled={isSubmitting}
          required={false}
          className="text-base h-[38px]"
          onChange={(hijriDate: any) => {
            onChange(hijriDate, atTime, prayerTime);
          }}
        />
        {hijriDate && (
          <TimeInput
            name="time"
            customTime={atTime as string}
            prayerTime={prayerTime as PrayerTime}
            placeholder={t("time")}
            disabled={isSubmitting}
            className="text-base h-[38px]"
            onChange={(time, prayerTime) => {
              onChange(hijriDate, time, prayerTime);
            }}
          />
        )}
        {hijriDate && onRepeatChange && (
          <RepeatSelector
            value={repeat}
            interval={repeatInterval}
            onChange={onRepeatChange}
            disabled={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}
