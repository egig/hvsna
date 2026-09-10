import { useState, useEffect } from "react";
import { Activity } from "react";
import { HvCheck, HvChevronLeft, HvRepeat } from "@/modules/icons";
import { ModalNavbar, useModal } from "src/modules/navigation";
import { NavActionButton } from "../../components/nav-action-button";
import { ListInput } from "src/modules/components/list-input";
import { useLanguageContext } from "../../i18n/LanguageContext";
import type { TaskRecurringType } from "@/domain/task";
import { RepeatSelectorModal } from "src/modules/task/repeat-selector-modal";
import { CalendarMonthGrid } from "./calendar-month-grid";
import dayjs from "dayjs";

type RepeatEnd = "never" | "on_date" | "after_occurrences";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedRecurringType?: TaskRecurringType;
  selectedRecurringInterval?: number;
  selectedRecurringEnd?: RepeatEnd;
  selectedRecurringEndDate?: string | null;
  selectedRecurringEndOccurrences?: number;
  selectedUseGregorian?: boolean;
  forceRecurring?: boolean; // If true, repeat is forced to be selected (no "none" option)
  onConfirm: (
    date: Date | null,
    recurring: TaskRecurringType,
    recurringInterval: number,
    recurringEnd: RepeatEnd,
    recurringEndDate: string | null,
    recurringEndOccurrences: number,
    useGregorian: boolean
  ) => void;
}

function formatRepeatLabel(
  recurringType: TaskRecurringType,
  interval: number,
  t: (key: string) => string
): string {
  const unitLabels: Record<string, string> = {
    daily: t("repeat_daily"),
    weekly: t("repeat_weekly"),
    monthly: t("repeat_monthly"),
    yearly: t("repeat_yearly"),
  };
  if (interval <= 1) return unitLabels[recurringType] ?? recurringType;
  return `${t("every") || "Every"} ${interval} ${(
    unitLabels[recurringType] ?? recurringType
  ).toLowerCase()}`;
}

export function CalendarModal({
  isOpen,
  onClose,
  selectedDate,
  selectedRecurringType: selectedRecurringType = "none",
  selectedRecurringInterval: selectedRecurringInterval = 1,
  selectedRecurringEnd: selectedRecurringEnd = "never",
  selectedRecurringEndDate: selectedRecurringEndDate = null,
  selectedRecurringEndOccurrences: selectedRecurringEndOccurrences = 1,
  selectedUseGregorian = false,
  forceRecurring: forceRecurring = false,
  onConfirm,
}: CalendarModalProps) {
  const Modal = useModal();
  const { t } = useLanguageContext();

  // Which sub-view is active inside the modal
  const [view, setView] = useState<
    "date" | "time" | "repeat" | "repeat_end_date"
  >("date");

  // Pending selections — committed only when the user taps the confirm button
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(
    selectedDate
  );
  const [tempRepeat, setTempRepeat] = useState<TaskRecurringType>(
    selectedRecurringType ?? "none"
  );
  const [tempRepeatInterval, setTempRepeatInterval] = useState(
    selectedRecurringInterval ?? 1
  );
  const [tempRepeatEnd, setTempRepeatEnd] = useState<RepeatEnd>(
    selectedRecurringEnd ?? "never"
  );
  const [tempRepeatEndDate, setTempRepeatEndDate] = useState<string | null>(
    selectedRecurringEndDate ?? null
  );
  const [tempRepeatEndOccurrences, setTempRepeatEndOccurrences] = useState(
    selectedRecurringEndOccurrences ?? 1
  );
  const [tempUseGregorian, setTempUseGregorian] = useState(
    selectedUseGregorian ?? false
  );

  // Re-sync pending state whenever the modal opens (props may have changed)
  useEffect(() => {
    if (!isOpen) return;
    setView("date");
    setTempSelectedDate(selectedDate);
    setTempRepeat(selectedRecurringType ?? "none");
    setTempRepeatInterval(selectedRecurringInterval ?? 1);
    setTempRepeatEnd(selectedRecurringEnd ?? "never");
    setTempRepeatEndDate(selectedRecurringEndDate ?? null);
    setTempRepeatEndOccurrences(selectedRecurringEndOccurrences ?? 1);
    setTempUseGregorian(selectedUseGregorian ?? false);
  }, [isOpen]);

  // ── Confirm / quick-select handlers ───────────────────────────────────────

  const handleConfirm = () => {
    if (tempSelectedDate) {
      onConfirm(
        tempSelectedDate,
        tempRepeat,
        tempRepeatInterval,
        tempRepeatEnd,
        tempRepeatEndDate,
        tempRepeatEndOccurrences,
        tempUseGregorian
      );
    }
  };

  const isSelectedToday = () => {
    if (!selectedDate) return false;
    return dayjs(selectedDate).isSame(dayjs(), "day");
  };

  const isSelectedTomorrow = () => {
    if (!selectedDate) return false;
    return dayjs(selectedDate).isSame(dayjs().add(1, "day"), "day");
  };

  const isSelectedNextWeek = () => {
    if (!selectedDate) return false;
    const dayOfWeek = dayjs().day(); // 0=Sun ... 5=Fri
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = dayjs().add(daysUntilFriday, "day");
    return dayjs(selectedDate).isSame(nextFriday, "day");
  };

  const isSelectedNoDate = () => {
    return selectedDate === null;
  };

  const handleToday = () => {
    const today = dayjs().endOf("day").toDate();
    onConfirm(
      today,
      tempRepeat,
      tempRepeatInterval,
      tempRepeatEnd,
      tempRepeatEndDate,
      tempRepeatEndOccurrences,
      tempUseGregorian
    );
  };

  const handleTomorrow = () => {
    const tomorrow = dayjs().add(1, "day").endOf("day").toDate();
    onConfirm(
      tomorrow,
      tempRepeat,
      tempRepeatInterval,
      tempRepeatEnd,
      tempRepeatEndDate,
      tempRepeatEndOccurrences,
      tempUseGregorian
    );
  };

  const handleNextWeek = () => {
    const dayOfWeek = dayjs().day(); // 0=Sun … 5=Fri
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = dayjs()
      .add(daysUntilFriday, "day")
      .endOf("day")
      .toDate();
    onConfirm(
      nextFriday,
      tempRepeat,
      tempRepeatInterval,
      tempRepeatEnd,
      tempRepeatEndDate,
      tempRepeatEndOccurrences,
      tempUseGregorian
    );
  };

  const handleNoDate = () => {
    onConfirm(null, "none", 1, "never", null, 1, false);
  };

  const repeatLabel =
    tempRepeat !== "none"
      ? formatRepeatLabel(tempRepeat, tempRepeatInterval, t)
      : t("repeat");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      {/* ── Date view ─────────────────────────────────────────────────────── */}
      <Activity mode={view === "date" ? "visible" : "hidden"}>
        <>
          <ModalNavbar
            title={t("select_date")}
            onModalClose={onClose}
            rightAction={
              <NavActionButton
                variant="primary"
                onClick={handleConfirm}
                disabled={!tempSelectedDate}
                data-testid="calendar-confirm-button"
              >
                <HvCheck />
              </NavActionButton>
            }
          />

          {/* Quick date shortcuts */}
          <div className="flex flex-col">
            {!isSelectedToday() && (
              <ListInput onClick={handleToday} label={t("today")} />
            )}
            {!isSelectedTomorrow() && (
              <ListInput onClick={handleTomorrow} label={t("tomorrow")} />
            )}
            {!isSelectedNextWeek() && (
              <ListInput onClick={handleNextWeek} label={t("next_week")} />
            )}
            {!isSelectedNoDate() && (
              <ListInput onClick={handleNoDate} label={t("no_date")} />
            )}
          </div>

          <div className="pb-[env(safe-area-inset-bottom)]">
            <CalendarMonthGrid
              selectedDate={
                tempSelectedDate
                  ? dayjs(tempSelectedDate).format("YYYY-MM-DD")
                  : ""
              }
              onChange={(dateStr) => {
                setTempSelectedDate(dayjs(dateStr).endOf("day").toDate());
              }}
            />

            <div className="flex flex-col">
              <ListInput
                onClick={() => setView("repeat")}
                label={repeatLabel}
                icon={<HvRepeat className="w-4 h-4" />}
                disabled={!tempSelectedDate}
                testId="repeat-list-button"
              />
            </div>
          </div>
        </>
      </Activity>

      {/* ── Repeat sub-view ───────────────────────────────────────────────── */}
      <Activity mode={view === "repeat" ? "visible" : "hidden"}>
        <RepeatSelectorModal
          recurringType={tempRepeat}
          interval={tempRepeatInterval}
          recurringEnd={tempRepeatEnd}
          recurringEndDate={tempRepeatEndDate}
          recurringEndOccurrences={tempRepeatEndOccurrences}
          forceRecurring={forceRecurring}
          onBack={() => setView("date")}
          onSelectEndDate={() => setView("repeat_end_date")}
          onConfirm={(
            repeat,
            interval,
            repeatEnd,
            endDate,
            endOccurrences,
            gregorian
          ) => {
            setTempRepeat(repeat);
            setTempRepeatInterval(interval);
            setTempRepeatEnd(repeatEnd);
            setTempRepeatEndDate(endDate);
            setTempRepeatEndOccurrences(endOccurrences);
            setTempUseGregorian(gregorian);
            setView("date");
          }}
          useGregorian={tempUseGregorian}
        />
      </Activity>

      {/* ── Repeat end date sub-view ──────────────────────────────────────── */}
      <Activity mode={view === "repeat_end_date" ? "visible" : "hidden"}>
        <ModalNavbar
          title={t("repeat_ends_on_date")}
          leftAction={
            <button onClick={() => setView("repeat")} className="p-2">
              <HvChevronLeft className="w-5 h-5" />
            </button>
          }
        />
        <CalendarMonthGrid
          selectedDate={tempRepeatEndDate}
          onChange={(dateStr) => {
            setTempRepeatEnd("on_date");
            setTempRepeatEndDate(dateStr);
            setView("repeat");
          }}
        />
      </Activity>
    </Modal>
  );
}
