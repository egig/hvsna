import { useState } from "react";
import { HvChevronsUpDown } from "@/modules/icons";
import { Page, Navbar } from "../../navigation";
import { TimezonePickerModal } from "../../components/timezone-picker-modal";
import { useSettings } from "..";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { ListInputSelect } from "../../components/list-input-select";

export default function GeneralSettings() {
  const { settings, loading, updateSettings } = useSettings();
  const { t } = useLanguageContext();

  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === "en" || newLanguage === "id") {
      await updateSettings({ language: newLanguage });
    }
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    await updateSettings({ timezone: newTimezone });
  };

  return (
    <Page>
      <Navbar title={t("general")} showBackButton={true} />

      <ListInputSelect
        label={t("language")}
        value={settings.language}
        onValueChange={handleLanguageChange}
        disabled={loading}
        options={[
          { value: "en", label: t("english") },
          { value: "id", label: t("bahasa") },
        ]}
      />

      <div className="bg-white">
        <div className="p-2 border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 text-left truncate flex-1 min-w-0">
              {t("timezone")}
            </span>
            <button
              type="button"
              onClick={() => setIsTimezoneModalOpen(true)}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-0 max-w-[50%]"
            >
              <span className="truncate">
                {settings.timezone?.replace(/_/g, " ")}
              </span>
              <HvChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>
          </div>
        </div>

        <TimezonePickerModal
          isOpen={isTimezoneModalOpen}
          onClose={() => setIsTimezoneModalOpen(false)}
          value={settings.timezone}
          onSelect={handleTimezoneChange}
          title={t("timezone")}
          dismissable={true}
        />
      </div>
    </Page>
  );
}
