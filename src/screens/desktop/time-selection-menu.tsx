import { HvCheck } from "@/modules/icons";
import { NavActionButton } from "../../modules/components/nav-action-button";
import { useState } from "react";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { ModalNavbar } from "src/modules/navigation";
import type { PrayerTime } from "@/domain/task";
import { TimeSelectionContent } from "../../modules/calendar/hijri-date-input/time-selection-content";

interface TimeSelectionModalProps {
  selectedTime: string | null;
  onBack: () => void;
  onConfirm: (time: string) => void;
  onRemoveTime: () => void;
}

export function TimeSelectionMenu({
  selectedTime,
  onBack,
  onConfirm,
  onRemoveTime,
}: TimeSelectionModalProps) {
  const { t } = useLanguageContext();
  const [selectedTimeTemp, setSelectedTimeTemp] = useState<string>(
    selectedTime || ""
  );

  let isCustom = typeof selectedTime === "string" && selectedTime.includes(":");
  const [inputMode, setInputMode] = useState<"prayer" | "custom">(
    isCustom ? "custom" : "prayer"
  );

  const handleValueChange = (value: PrayerTime | "") => {
    setSelectedTimeTemp(value);
    if (value) {
      onConfirm(value);
    }
  };

  const handleCustomTimeChange = (value: string) => {
    setSelectedTimeTemp(value);
    setInputMode("custom");
  };

  const handleConfirm = () => {
    if (selectedTimeTemp) {
      onConfirm(selectedTimeTemp);
    }
  };

  return (
    <div className="">
      <TimeSelectionContent
        selectedTimeTemp={selectedTimeTemp}
        inputMode={inputMode}
        onValueChange={handleValueChange}
        onCustomTimeChange={handleCustomTimeChange}
        onRemoveTime={onRemoveTime}
      />
      <div className="text-center">
        <button
          className="p-2 mb-2 rounded-md text-sm text-white bg-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color-hover)] active:bg-[var(--hvsna-primary-color-pressed)]"
            onClick={handleConfirm}
            disabled={inputMode === "prayer" ? !selectedTimeTemp : false}
          >
            Confirm
          </button>
      </div>
    </div>
  );
}
