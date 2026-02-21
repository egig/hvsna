import { Page } from "../../navigation";
import { Navbar } from "../../navigation";
import { useSettings } from "../useSettings";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { ALL_TIMEZONES, COMMON_TIMEZONES } from "../../../lib/timezones";
import { ListInputSelect } from "../../../ui/list-input-select";

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
      await updateLocation(coordinate, "auto");
      // Also update timezone after getting location
      await updateTimezoneFromLocation();
    }
  };

  // Check if timezone is based on location coordinates
  const isTimezoneFromLocation =
    settings.coordinate &&
    settings.locationResolvedAt &&
    settings.locationResolveType === "auto";

  return (
    <Page>
      <Navbar title={t("general")} showBackButton={true} />

      <div className="p-2 border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <span className="text-gray-900 font-semibold text-left truncate">
              Location
            </span>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0 min-w-0 max-w-[50%]">
            {loading ? (
              <div className="text-xs text-gray-500">Loading...</div>
            ) : (
              <div className="text-sm text-gray-600 text-right">
                <div className={`text-xs text-gray-600`}>
                  {settings.coordinate
                    ? `${settings.coordinate.latitude.toFixed(3)},${settings.coordinate.longitude.toFixed(3)}`
                    : "Not set"}
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

        {/* Location Details */}
        {settings.coordinate && (
          <div className="mt-3 p-3 bg-gray-50 rounded text-xs">
            <div className="space-y-2">
              {settings.coordinate.accuracy && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy:</span>
                  <span>±{settings.coordinate.accuracy.toFixed(2)}m</span>
                </div>
              )}
              {settings.locationResolvedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span>
                    {new Date(settings.locationResolvedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location Actions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {!hasLocationPermission ? (
            <button
              onClick={requestLocationPermission}
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
              Enable Location
            </button>
          ) : (
            <>
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
                Get Location
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
                  Clear Location
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white">
        <ListInputSelect
          label={t("timezone")}
          value={settings.timezone}
          onValueChange={handleTimezoneChange}
          disabled={loading || !!isTimezoneFromLocation}
          options={ALL_TIMEZONES.map((tz) => ({
            value: tz,
            label: tz,
          }))}
          helpText={
            isTimezoneFromLocation
              ? "Timezone automatically set from location"
              : undefined
          }
        />

        <div className="space-y-4">
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

          {/* TODO How about upcoming date, should I adjust created tasks */}
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
            helpText="Hijri calendar manual offset"
          />
        </div>
      </div>
    </Page>
  );
}
