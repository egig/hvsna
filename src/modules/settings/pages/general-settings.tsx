import React, { useState } from "react";
import { HvChevronsUpDown } from "@/modules/icons";
import { Page, Navbar } from "../../navigation";
import { TimezonePickerModal } from "../../components/timezone-picker-modal";
import { useSettings } from "../useSettings";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { ALL_TIMEZONES, COMMON_TIMEZONES } from "../../timezones";
import { ListInputSelect } from "../../components/list-input-select";
import { usePlatform } from "../../platform";

export default function GeneralSettings() {
  const {
    settings,
    setLanguage,
    loading,
    error,
    updateSettings,
    requestLocationPermission,
    getCurrentLocation,
    updateLocation,
    setManualLocation,
    clearLocation,
    hasLocationPermission,
    updateTimezoneFromLocation,
  } = useSettings();
  const { t } = useLanguageContext();
  const { isNative: isNativePlatform } = usePlatform();

  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === "en" || newLanguage === "id") {
      await updateSettings({ language: newLanguage });
    }
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    await updateSettings({ timezone: newTimezone });
  };

  const handleDateOffsetChange = async (newOffset: number) => {
    await updateSettings({ manualDateOffset: newOffset });
  };

  const handleGetLocation = async () => {
    const coordinate = await getCurrentLocation();
    if (coordinate) {
      const resolveType = isNativePlatform ? "capacitor_native" : "auto";
      await updateLocation(coordinate, resolveType);
      await updateTimezoneFromLocation();
    }
  };

  // Check if timezone is based on location coordinates
  const isTimezoneFromLocation =
    settings.coordinate &&
    settings.locationResolvedAt &&
    (settings.locationResolveType === "auto" ||
      settings.locationResolveType === "capacitor_native");

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
            <span className="text-gray-900 font-semibold text-left truncate flex-1 min-w-0">
              {t("timezone")}
            </span>
            <button
              type="button"
              onClick={() => setIsTimezoneModalOpen(true)}
              disabled={loading || !!isTimezoneFromLocation}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-0 max-w-[50%]"
            >
              <span className="truncate">
                {settings.timezone.replace(/_/g, " ")}
              </span>
              <HvChevronsUpDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            </button>
          </div>
          {isTimezoneFromLocation && (
            <div className="mt-2 text-sm text-gray-500">
              {t("timezone_from_location")}
            </div>
          )}
        </div>

        <TimezonePickerModal
          isOpen={isTimezoneModalOpen}
          onClose={() => setIsTimezoneModalOpen(false)}
          value={settings.timezone}
          onSelect={handleTimezoneChange}
          title={t("timezone")}
        />

        <div className="space-y-4">
          <ListInputSelect
            label={t("manual_date_offset")}
            value={settings.manualDateOffset?.toString() || "0"}
            onValueChange={(value) => handleDateOffsetChange(parseInt(value))}
            disabled={loading}
            options={[
              { value: "-2", label: t("days_offset_negative", { count: 2 }) },
              { value: "-1", label: t("day_offset_negative") },
              { value: "0", label: t("no_offset") },
              { value: "1", label: t("day_offset_positive") },
              { value: "2", label: t("days_offset_positive", { count: 2 }) },
            ]}
            helpText={t("hijri_calendar_offset")}
          />
        </div>
      </div>
    </Page>
  );
}
