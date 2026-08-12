import { HvCheck } from "@/modules/icons";
import { NavActionButton } from "../../components/nav-action-button";
import { useState } from "react";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { ModalNavbar } from "src/modules/navigation";
import type { PrayerTime } from "@/domain/task";
import { TimeSelectionContent } from "./time-selection-content";

interface TimeSelectionModalProps {
  selectedTime: string | null;
  onBack: () => void;
  onConfirm: (time: string) => void;
  onRemoveTime: () => void;
}

export function TimeSelectionModal({
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
    <div className="min-h-[25dvh]">
      <ModalNavbar
        title={t("time")}
        onModalClose={onBack}
        rightAction={
          <NavActionButton
            variant="primary"
            onClick={handleConfirm}
            disabled={inputMode === "prayer" ? !selectedTimeTemp : false}
          >
            <HvCheck />
          </NavActionButton>
        }
      />

      <TimeSelectionContent
        selectedTimeTemp={selectedTimeTemp}
        inputMode={inputMode}
        onValueChange={handleValueChange}
        onCustomTimeChange={handleCustomTimeChange}
        onRemoveTime={onRemoveTime}
      />
    </div>
  );
}
