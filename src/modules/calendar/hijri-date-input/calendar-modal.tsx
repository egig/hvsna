import { useState, useEffect } from "react";
import { Check, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Modal, Navbar } from "src/modules/navigation";
import { HijriDate } from "../hijri/hijri-date";
import { HijriMonth } from "../hijri/hijri-month";
import { useDateFormatter } from "src/modules/calendar/use-date-formatter";
import { ListInput } from "src/ui/list-input";
import { useFeatureFlag } from "src/modules/feature-flags/useFeatureFlags";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { useSettings } from "src/modules/settings/useSettings";
import { useHijriCalendar } from "../hijri/useHijriCalendar";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: HijriDate | null;
  onDateSelect: (date: HijriDate | null) => void;
}

export function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  onDateSelect,
}: CalendarModalProps) {
  const { t } = useLanguageContext();
  const { hijriMonthNames, weekDays } = useDateFormatter();
  const { getToday, createHijriDate } = useHijriCalendar();
  const { settings } = useSettings();
  const offset = settings.manualDateOffset || 0;
  const latitude = settings.coordinate?.latitude;
  const longitude = settings.coordinate?.longitude;

  const [currentMonth, setCurrentMonth] = useState<HijriMonth>(
    selectedDate
      ? new HijriMonth(selectedDate.year, selectedDate.month, {
          latitude,
          longitude,
          offset,
        })
      : (() => {
          const today = getToday().startOfDay();
          return new HijriMonth(today.year, today.month, {
            latitude,
            longitude,
            offset,
          });
        })(),
  );
  const [tempSelectedDate, setTempSelectedDate] = useState<HijriDate | null>(
    selectedDate,
  );
  const repeatEnabled = useFeatureFlag("TASK_REPEAT");
  const [editMode, setEditMode] = useState<"date" | "repeat">("date");

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(
        new HijriMonth(selectedDate.year, selectedDate.month, {
          latitude,
          longitude,
          offset,
        }),
      );
      setTempSelectedDate(selectedDate);
    }
  }, [selectedDate, latitude, longitude, offset]);

  const getDaysInMonth = () => {
    return currentMonth.getDaysInMonth();
  };

  const getFirstDayOfMonth = () => {
    return currentMonth.getFirstDay();
  };

  const getCalendarDays = () => {
    const firstDay = getFirstDayOfMonth();
    const daysInMonth = getDaysInMonth();
    const startDayOfWeek = firstDay.dayOfWeek;

    const days = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(createHijriDate(currentMonth.year, currentMonth.month, day));
    }

    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(currentMonth.previous());
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.next());
  };

  // Update current month when settings change
  useEffect(() => {
    setCurrentMonth(
      new HijriMonth(currentMonth.year, currentMonth.month, {
        latitude,
        longitude,
        offset,
      }),
    );
  }, [latitude, longitude, offset]);

  const handleDateClick = (date: HijriDate) => {
    setTempSelectedDate(date);
  };

  const handleConfirm = () => {
    if (tempSelectedDate) {
      const finalDate = createHijriDate(
        tempSelectedDate.year,
        tempSelectedDate.month,
        tempSelectedDate.day,
      );
      onDateSelect(finalDate);
      onClose();
    }
  };

  const handleTomorrow = () => {
    const h = getToday();
    onDateSelect(h.next().startOfDay());
    onClose();
  };

  const handleToday = () => {
    const today = getToday().startOfDay();
    onDateSelect(today);
    onClose();
  };

  const handleNoDate = () => {
    onDateSelect(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      {editMode === "date" && (
        <>
          <Navbar
            title={t("select_date")}
            rightAction={
              <button
                onClick={handleConfirm}
                disabled={!tempSelectedDate}
                className="rounded-full w-10 h-10 flex items-center justify-center text-sm font-medium text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <Check />
              </button>
            }
          />
          <div className="flex flex-col">
            <ListInput onClick={handleToday} label={t("today")} />
            <ListInput onClick={handleTomorrow} label={t("tomorrow")} />
            <ListInput onClick={handleNoDate} label={t("no_date")} />
          </div>
          <div className="pb-[env(safe-area-inset-bottom)]">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-2">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>

              <h3 className="text-m text-gray-900 dark:text-white">
                {hijriMonthNames[currentMonth.month - 1]} {currentMonth.year}
              </h3>

              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-2 border-y border-gray-200">
              <div className="grid grid-cols-7 gap-1 text-center">
                {weekDays.map((day: string) => (
                  <div
                    key={day}
                    className="text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {getCalendarDays().map((date, index) => (
                  <div key={index} className="aspect-3/2">
                    {date ? (
                      <button
                        onClick={() => handleDateClick(date)}
                        className={`w-full h-full flex items-center justify-center rounded-md text-sm transition-colors ${
                          tempSelectedDate &&
                          date.year === tempSelectedDate.year &&
                          date.month === tempSelectedDate.month &&
                          date.day === tempSelectedDate.day
                            ? "bg-[var(--hvsna-primary-color)] text-white"
                            : date.isToday()
                              ? "bg-[var(--hvsna-primary-color-active-tab)] dark:bg-blue-900 text-white dark:text-white"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                        }`}
                      >
                        {date.day}
                      </button>
                    ) : (
                      <div className="w-full h-full" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {repeatEnabled && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("repeat")}
                </label>
                <select
                  name="repeat"
                  defaultValue={"none"}
                  disabled={false}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="none">{t("no_repeat")}</option>
                  <option value="daily">
                    {t("daily_at_time", { time: "" })}
                  </option>
                  <option value="monthly">
                    {t("monthly_on_day", { day: tempSelectedDate?.day || 1 })}
                  </option>
                  <option value="yearly">
                    {t("yearly_on_day_month", {
                      day: tempSelectedDate?.day || 1,
                      month:
                        hijriMonthNames[(tempSelectedDate?.month || 1) - 1],
                    })}
                  </option>
                </select>
              </div>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}
