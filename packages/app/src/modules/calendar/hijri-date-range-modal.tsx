import { useState, useEffect } from "react";
import { HvCheck } from "@/modules/icons";
import { NavActionButton } from "../components/nav-action-button";
import { ModalNavbar, useModal } from "src/modules/navigation";
import { useLanguageContext } from "../i18n/LanguageContext";
import { HijriRangeCalendarGrid } from "./hijri-date-range-grid";
import dayjs, { type Dayjs } from "dayjs";

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
  const Modal = useModal();
  const { t } = useLanguageContext();

  const initial = selectedRange?.startDate
    ? dayjs(selectedRange.startDate)
    : dayjs();

  const [year, setYear] = useState(initial.year());
  const [month, setMonth] = useState(initial.month()); // 0-based

  const [tempStartDate, setTempStartDate] = useState<number | null>(
    selectedRange?.startDate ?? null
  );
  const [tempEndDate, setTempEndDate] = useState<number | null>(
    selectedRange?.endDate ?? null
  );

  useEffect(() => {
    if (selectedRange) {
      const d = dayjs(selectedRange.startDate);
      setYear(d.year());
      setMonth(d.month());
      setTempStartDate(selectedRange.startDate);
      setTempEndDate(selectedRange.endDate);
    }
  }, [selectedRange]);

  const handlePreviousMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
  };

  const handleDateClick = (date: Dayjs) => {
    const startOfDay = date.startOf("day").valueOf();
    const endOfDay = date.endOf("day").valueOf();

    if (!tempStartDate) {
      setTempStartDate(startOfDay);
      setTempEndDate(endOfDay);
    } else if (!tempEndDate || startOfDay < tempStartDate) {
      setTempStartDate(startOfDay);
      setTempEndDate(endOfDay);
    } else {
      setTempEndDate(endOfDay);
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
    const d = dayjs(epoch);
    if (d.isSame(dayjs(), "day")) return t("today");
    if (d.isSame(dayjs().add(1, "day"), "day")) return t("tomorrow");
    return d.format("DD MMMM YYYY");
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
          year={year}
          month={month}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
          startEpoch={tempStartDate}
          endEpoch={tempEndDate}
          onDateClick={handleDateClick}
        />
      </div>
    </Modal>
  );
}
