import { Page } from "../../navigation";
import { Navbar } from "../../navigation";
import { useSettings } from "../useSettings";
import { useLanguageContext } from "../../common/LanguageContext";
import { ALL_TIMEZONES, COMMON_TIMEZONES } from "../../../lib/timezones";
import { ListInputSelect } from "../../../components/ListInputSelect";

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

  const handleGetCurrentLocation = async () => {
    const coordinate = await getCurrentLocation();
    if (coordinate) {
      await updateLocation(coordinate, "auto");
    }
  };

  const handleUpdateTimezoneFromLocation = async () => {
    const success = await updateTimezoneFromLocation();
    if (success) {
      // Show success message or toast
      console.log("Timezone updated based on location");
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
                <div
                  className={`text-xs ${
                    settings.coordinate ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {settings.coordinate ? "Set" : "Not set"}
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
              <div className="flex justify-between">
                <span className="text-gray-600">Latitude:</span>
                <span className="font-mono">
                  {settings.coordinate.latitude.toFixed(6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Longitude:</span>
                <span className="font-mono">
                  {settings.coordinate.longitude.toFixed(6)}
                </span>
              </div>
              {settings.coordinate.accuracy && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Accuracy:</span>
                  <span>±{settings.coordinate.accuracy}m</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span>{settings.locationResolveType || "Unknown"}</span>
              </div>
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
              className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 touch-manipulation"
            >
              Enable Location
            </button>
          ) : (
            <>
              <button
                onClick={handleGetCurrentLocation}
                disabled={loading}
                className="px-3 py-1.5 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500 touch-manipulation"
              >
                Get Current Location
              </button>
              {settings.coordinate && (
                <>
                  <button
                    onClick={handleUpdateTimezoneFromLocation}
                    disabled={loading}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500 touch-manipulation"
                  >
                    Update Timezone
                  </button>
                  <button
                    onClick={clearLocation}
                    disabled={loading}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500 touch-manipulation"
                  >
                    Clear Location
                  </button>
                </>
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
