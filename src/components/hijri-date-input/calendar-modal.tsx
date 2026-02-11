import { useState, useEffect } from "react";
import { HijriDate, HijriMonth } from "../../lib/hijri";
import { Modal } from "../../modules/navigation/modal";
import { useFeatureFlag } from "src/hooks/useFeatureFlags";
import { Check, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Navbar } from "src/modules/navigation";
import { TimeSelectionModal } from "./time-selection-modal";
import { ListInput } from "../ListInput";
import { useLanguageContext } from "../../contexts/LanguageContext";
import { useDateFormatter } from "../../hooks/use-date-formatter";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: HijriDate | null;
  selectedTime: string | null;
  onDateSelect: (date: HijriDate | null, time: string | null) => void;
}

export function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  selectedTime,
  onDateSelect,
}: CalendarModalProps) {
  const { t } = useLanguageContext();
  const { hijriMonthNames, weekDays } = useDateFormatter();
  
  const [currentMonth, setCurrentMonth] = useState<HijriMonth>(
    selectedDate
      ? new HijriMonth(selectedDate.year, selectedDate.month)
      : HijriMonth.fromGregorian(
          new Date().getFullYear(),
          new Date().getMonth() + 1,
        ),
  );
  const [tempSelectedDate, setTempSelectedDate] = useState<HijriDate | null>(
    selectedDate,
  );
  const repeatEnabled = useFeatureFlag("TASK_REPEAT");
  const [editMode, setEditMode] = useState<"date" | "time" | "repeat">("date");

  useEffect(() => {
    if (selectedDate) {
      setCurrentMonth(new HijriMonth(selectedDate.year, selectedDate.month));
      setTempSelectedDate(selectedDate);
    }
  }, [selectedDate]);

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
      days.push(new HijriDate(currentMonth.year, currentMonth.month, day));
    }

    return days;
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(currentMonth.previous());
  };

  const handleNextMonth = () => {
    setCurrentMonth(currentMonth.next());
  };

  const handleDateClick = (date: HijriDate) => {
    setTempSelectedDate(date);
  };

  const handleConfirm = () => {
    if (tempSelectedDate) {
      const finalDate = new HijriDate(
        tempSelectedDate.year,
        tempSelectedDate.month,
        tempSelectedDate.day,
      );
      onDateSelect(finalDate, selectedTime);
      onClose();
    }
  };

  const handleTomorrow = () => {
    const h = HijriDate.fromDate(new Date());
    onDateSelect(h.next(), null);
    onClose();
  };

  const handleToday = () => {
    const today = HijriDate.fromDate(new Date());
    onDateSelect(today, null);
    onClose();
  };

  const handleNoDate = () => {
    onDateSelect(null as any, null);
    onClose();
  };

  const handleTimeConfirm = (time: string) => {
    onDateSelect(tempSelectedDate, time);
    setEditMode("date");
  };

  const handleRemoveTime = () => {
    onDateSelect(tempSelectedDate, null);
    setEditMode("date");
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
                {weekDays.map((day) => (
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
                            ? "bg-blue-500 text-white"
                            : date.isToday()
                              ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300"
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
                    {t("daily_at_time", { time: selectedTime || "" })}
                  </option>
                  <option value="monthly">
                    {t("monthly_on_day", { day: tempSelectedDate?.day || 1 })}
                  </option>
                  <option value="yearly">
                    {t("yearly_on_day_month", {
                      day: tempSelectedDate?.day || 1,
                      month: hijriMonthNames[(tempSelectedDate?.month || 1) - 1],
                    })}
                  </option>
                </select>
              </div>
            )}

            <ListInput
              label={t("time")}
              onClick={() => {
                setEditMode("time");
              }}
              rightContent={
                selectedTime ? (
                  selectedTime
                ) : (
                  <span className="text-gray-600">{t("none")}</span>
                )
              }
            />
          </div>
        </>
      )}

      {editMode == "time" && (
        <TimeSelectionModal
          selectedTime={selectedTime}
          onBack={() => setEditMode("date")}
          onConfirm={handleTimeConfirm}
          onRemoveTime={handleRemoveTime}
        />
      )}
    </Modal>
  );
}
