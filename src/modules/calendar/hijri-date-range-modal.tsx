import { useState, useEffect } from "react";
import { HvCheck } from "@/modules/icons";
import { NavActionButton } from "../components/nav-action-button";
import { Modal, ModalNavbar } from "src/modules/navigation";
import {
  HijriDate,
  HijriMonth,
  useHijriDate,
} from "src/modules/calendar/hijri";
import { useLanguageContext } from "../i18n/LanguageContext";
import { HijriRangeCalendarGrid } from "./hijri-date-range-grid";

function isBefore(date1: HijriDate, date2: HijriDate): boolean {
  return date1.toDate() < date2.toDate();
}

function isAfter(date1: HijriDate, date2: HijriDate): boolean {
  return date1.toDate() > date2.toDate();
}

interface DateRange {
  startDate: number; // epoch ms
  endDate: number; // epoch ms
}

interface HijriDateRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: DateRange | null;
  onRangeSelect: (range: DateRange | null) => void;
}

export function HijriDateRangeModal({
  isOpen,
  onClose,
  selectedRange,
  onRangeSelect,
}: HijriDateRangeModalProps) {
  const { t } = useLanguageContext();
  const { createHijriMonth, currentHijriMonth, toHijriDate } = useHijriDate();

  const epochToHijri = (epoch: number) => toHijriDate(new Date(epoch));

  const [currentMonth, setCurrentMonth] = useState<HijriMonth>(
    selectedRange?.startDate
      ? (() => {
          const h = epochToHijri(selectedRange.startDate);
          return createHijriMonth(h.year, h.month);
        })()
      : currentHijriMonth()
  );

  const [tempStartDate, setTempStartDate] = useState<number | null>(
    selectedRange?.startDate ?? null
  );

  const [tempEndDate, setTempEndDate] = useState<number | null>(
    selectedRange?.endDate ?? null
  );

  useEffect(() => {
    if (selectedRange) {
      const startHijri = epochToHijri(selectedRange.startDate);
      setCurrentMonth(createHijriMonth(startHijri.year, startHijri.month));
      setTempStartDate(selectedRange.startDate);
      setTempEndDate(selectedRange.endDate);
    }
  }, [selectedRange]);

  const handleDateClick = (date: HijriDate) => {
    const startOfDay = date.startOfDayEpoch();
    const endOfDay = date.endOfDayEpoch();
    const tempStartHijri = tempStartDate ? epochToHijri(tempStartDate) : null;

    if (!tempStartDate) {
      setTempStartDate(startOfDay);
      setTempEndDate(endOfDay);
    } else if (!tempEndDate || isBefore(date, tempStartHijri!)) {
      setTempStartDate(startOfDay);
      setTempEndDate(endOfDay);
    } else {
      setTempEndDate(endOfDay);
      if (isBefore(date, tempStartHijri!)) {
        setTempStartDate(startOfDay);
        setTempEndDate(tempStartHijri!.endOfDayEpoch());
      }
    }
  };

  const handleConfirm = () => {
    if (tempStartDate && tempEndDate) {
      const [start, end] =
        tempStartDate <= tempEndDate
          ? [tempStartDate, tempEndDate]
          : [tempEndDate, tempStartDate];
      onRangeSelect({ startDate: start, endDate: end });
      onClose();
    }
  };

  const handleClear = () => {
    setTempStartDate(null);
    setTempEndDate(null);
  };

  const formatDateDisplay = (epoch: number) => {
    const date = epochToHijri(epoch);
    if (date.isToday()) return t("today");
    if (date.isTomorrow()) return t("tomorrow");
    return date.format("DD MMMM YYYY");
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <ModalNavbar
        title={t("select_date_range")}
        onModalClose={onClose}
        rightAction={
          <NavActionButton
            variant="primary"
            onClick={handleConfirm}
            disabled={!tempStartDate || !tempEndDate}
          >
            <HvCheck />
          </NavActionButton>
        }
      />

      <div className="pb-[env(safe-area-inset-bottom)]">
        {(tempStartDate || tempEndDate) && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {tempStartDate && tempEndDate ? (
                  <>
                    <div>
                      {t("start_date")}: {formatDateDisplay(tempStartDate)}
                    </div>
                    <div>
                      {t("end_date")}: {formatDateDisplay(tempEndDate)}
                    </div>
                  </>
                ) : tempStartDate ? (
                  <div>
                    {t("start_date")}: {formatDateDisplay(tempStartDate)}
                  </div>
                ) : null}
              </div>
              <button
                onClick={handleClear}
                className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
              >
                {t("clear")}
              </button>
            </div>
          </div>
        )}

        <HijriRangeCalendarGrid
          currentMonth={currentMonth}
          onPreviousMonth={() => setCurrentMonth(currentMonth.previous())}
          onNextMonth={() => setCurrentMonth(currentMonth.next())}
          startDate={tempStartDate ? epochToHijri(tempStartDate) : null}
          endDate={tempEndDate ? epochToHijri(tempEndDate) : null}
          onDateClick={handleDateClick}
        />
      </div>
    </Modal>
  );
}
