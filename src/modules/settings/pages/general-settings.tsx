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

      <div className="p-2 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span
              className="text-gray-900 font-semibold text-left truncate"
              data-testid="location-section-label"
            >
              {t("location")}
            </span>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 min-w-0 max-w-[50%]">
            {loading ? (
              <div className="text-xs text-gray-500">{t("loading")}</div>
            ) : (
              <div className="text-sm text-gray-600 text-right">
                <div className={`text-xs text-gray-600`}>
                  {settings.coordinate
                    ? `${settings.coordinate.latitude.toFixed(
                        3
                      )},${settings.coordinate.longitude.toFixed(3)}`
                    : t("not_set")}
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {settings.coordinate && (
          <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
            <div className="space-y-2">
              {settings.locationResolveType && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("source")}</span>
                  <span>
                    {settings.locationResolveType === "capacitor_native"
                      ? t("gps_location")
                      : settings.locationResolveType === "auto"
                      ? t("browser_location")
                      : t("manual_location")}
                  </span>
                </div>
              )}
              {settings.coordinate.accuracy && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("accuracy")}</span>
                  <span>±{settings.coordinate.accuracy.toFixed(2)}m</span>
                </div>
              )}
              {settings.locationResolvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("updated")}</span>
                  <span>
                    {new Date(settings.locationResolvedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {!hasLocationPermission ? (
            <button
              onClick={requestLocationPermission}
              disabled={loading}
              data-testid="location-primary-button"
              className="px-3 py-1.5 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              style={
                {
                  backgroundColor: "var(--hvsna-primary-color)",
                  "--hover-bg": "var(--hvsna-primary-color-hover)",
                  "--focus-ring-color": "var(--hvsna-primary-color)",
                } as React.CSSProperties
              }
              onMouseEnter={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.backgroundColor =
                  "var(--hvsna-primary-color-hover)";
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget as HTMLElement;
                target.style.backgroundColor = "var(--hvsna-primary-color)";
              }}
            >
              {t("enable_location")}
            </button>
          ) : (
            <>
              {isNativePlatform && (
                <button
                  onClick={handleGetLocation}
                  disabled={loading}
                  className="px-3 py-1.5 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  style={
                    {
                      backgroundColor: "var(--hvsna-primary-color)",
                      "--hover-bg": "var(--hvsna-primary-color-hover)",
                      "--focus-ring-color": "var(--hvsna-primary-color)",
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.backgroundColor =
                      "var(--hvsna-primary-color-hover)";
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.backgroundColor = "var(--hvsna-primary-color)";
                  }}
                >
                  {t("get_gps_location")}
                </button>
              )}
              <button
                onClick={handleGetLocation}
                disabled={loading}
                data-testid="location-primary-button"
                className="px-3 py-1.5 text-white rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                style={
                  {
                    backgroundColor: "var(--hvsna-primary-color)",
                    "--hover-bg": "var(--hvsna-primary-color-hover)",
                    "--focus-ring-color": "var(--hvsna-primary-color)",
                  } as React.CSSProperties
                }
                onMouseEnter={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.backgroundColor =
                    "var(--hvsna-primary-color-hover)";
                }}
                onMouseLeave={(e) => {
                  const target = e.currentTarget as HTMLElement;
                  target.style.backgroundColor = "var(--hvsna-primary-color)";
                }}
              >
                {isNativePlatform
                  ? t("get_browser_location")
                  : t("get_location")}
              </button>
              {settings.coordinate && (
                <button
                  onClick={clearLocation}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  style={
                    {
                      backgroundColor: "transparent",
                      color: "var(--hvsna-primary-color)",
                      borderColor: "var(--hvsna-primary-color)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.backgroundColor = "var(--hvsna-primary-color)";
                    target.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.backgroundColor = "transparent";
                    target.style.color = "var(--hvsna-primary-color)";
                  }}
                >
                  {t("clear_location")}
                </button>
              )}
            </>
          )}
        </div>
      </div>

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
