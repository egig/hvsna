import { useState } from "react";
import { HvChevronsUpDown, HvMapPin } from "@/modules/icons";
import { PageMobile as Page } from "./page";
import { NavbarMobile as Navbar } from "./navbar-mobile";
import { TimezonePickerModal } from "@/modules/components/timezone-picker-modal";
import { useSettings } from "@/modules/settings";
import { useLanguageContext } from "@/modules/i18n/LanguageContext";
import { ListInputSelect } from "@/modules/components/list-input-select";
import { useLocationContext } from "@/modules/location/context";
import {
  PRAYER_CALCULATION_METHODS,
  PRAYER_MADHABS,
  DEFAULT_CALCULATION_METHOD,
  DEFAULT_MADHAB,
  type PrayerCalculationMethod,
  type PrayerMadhab,
} from "@/modules/prayer-calculation";

export default function GeneralSettings() {
  const { settings, loading, updateSettings } = useSettings();
  const { t } = useLanguageContext();
  const {
    location,
    loading: locationLoading,
    openLocationPicker,
    requestLocationPermission,
  } = useLocationContext();

  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);

  const handleLanguageChange = async (newLanguage: string) => {
    if (newLanguage === "en" || newLanguage === "id") {
      await updateSettings({ language: newLanguage });
    }
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    await updateSettings({ timezone: newTimezone });
  };

  const handleCalculationMethodChange = async (value: string) => {
    await updateSettings({
      calculationMethod: value as PrayerCalculationMethod,
    });
  };

  const handleMadhabChange = async (value: string) => {
    await updateSettings({ madhab: value as PrayerMadhab });
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
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-900 text-left truncate flex-1 min-w-0">
              {t("location")}
            </span>
            <button
              type="button"
              onClick={() => openLocationPicker()}
              disabled={locationLoading}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-w-0 max-w-[55%]"
            >
              <HvMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">
                {locationLoading
                  ? t("loading")
                  : location.name || t("not_set")}
              </span>
            </button>
          </div>
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => requestLocationPermission()}
              disabled={locationLoading}
              className="text-xs text-[var(--hvsna-primary-color)] hover:underline disabled:opacity-50 disabled:no-underline"
            >
              {t("use_current_location")}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {t("timezone_from_location")}
          </p>
        </div>

        <div className="p-4 border-b border-gray-200">
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

        <ListInputSelect
          label={t("calculation_method")}
          value={settings.calculationMethod ?? DEFAULT_CALCULATION_METHOD}
          onValueChange={handleCalculationMethodChange}
          disabled={loading}
          options={PRAYER_CALCULATION_METHODS.map((m) => ({
            value: m,
            label: t(`method.${m}`),
          }))}
        />

        <ListInputSelect
          label={t("madhab")}
          value={settings.madhab ?? DEFAULT_MADHAB}
          onValueChange={handleMadhabChange}
          disabled={loading}
          options={PRAYER_MADHABS.map((m) => ({
            value: m,
            label: t(`madhab.${m}`),
          }))}
        />
      </div>
    </Page>
  );
}
