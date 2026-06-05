import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { ModalNavbar } from "src/modules/navigation";
import { CalendarMonthGrid } from "./calendar-month-grid";

interface RepeatEndDateViewProps {
  selectedDate?: string | null; // YYYY-MM-DD
  onDateSelect: (dateStr: string) => void; // returns YYYY-MM-DD
  onBack: () => void;
}

export function RepeatEndDateView({
  selectedDate = null,
  onDateSelect,
  onBack,
}: RepeatEndDateViewProps) {
  const { t } = useLanguageContext();

  return (
    <>
      <ModalNavbar title={t("repeat_ends_on_date")} />
      <div className="pb-[env(safe-area-inset-bottom)]">
        <CalendarMonthGrid
          selectedDate={selectedDate}
          onChange={onDateSelect}
        />
      </div>
    </>
  );
}
