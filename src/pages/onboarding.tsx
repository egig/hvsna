import { useState } from "react";
import { MapPin, Globe, ChevronRight } from "lucide-react";
import { Page } from "../modules/navigation";
import { Navbar } from "../modules/navigation";
import { Button } from "../modules/navigation";
import { useSettings } from "../modules/settings/useSettings";
import { COMMON_TIMEZONES } from "../lib/timezones";
import { useLanguageContext } from "src/modules/common/LanguageContext";
import type { Coordinate } from "src/modules/settings/settings";

export default function Onboarding() {
  const { t } = useLanguageContext();
  const { updateSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  const handleLocationPermission = async () => {
    setLoading(true);
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        },
      );

      const coordinate: Coordinate = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
      };

      // Get timezone from coordinates (using Intl API as fallback)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      await updateSettings({
        timezone,
        coordinate,
        locationResolveType: "auto",
        locationResolvedAt: new Date().toISOString(),
        onboardedAt: Date.now(),
      });

      // Redirect to main app
      window.location.href = "/";
    } catch (error) {
      console.error("Location access denied:", error);
      setLoading(false);
      // Fall back to manual timezone selection
    }
  };

  const handleManualTimezone = async () => {
    setLoading(true);
    try {
      await updateSettings({
        timezone: selectedTimezone,
        locationResolveType: "manual",
        locationResolvedAt: new Date().toISOString(),
        onboardedAt: Date.now(),
      });

      // Redirect to main app
      window.location.href = "/";
    } catch (error) {
      console.error("Failed to save settings:", error);
      setLoading(false);
    }
  };

  return (
    <Page>
      <Navbar title={t("welcome") || "Welcome"} showBackButton={false} />

      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("setup_location") || "Setup Location"}
          </h1>
          <p className="text-gray-600">
            {t("location_setup_description") ||
              "Choose how you want to set your timezone for accurate scheduling"}
          </p>
        </div>

        <div className="space-y-4">
          {/* Location Permission Option */}
          <button
            onClick={handleLocationPermission}
            disabled={loading}
            className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">
                    {t("use_current_location") || "Use Current Location"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("auto_detect_timezone") ||
                      "Auto-detect timezone from your location"}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          </button>

          {/* Manual Timezone Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {t("select_timezone_manually") || "Select Timezone Manually"}
                </h3>
                <p className="text-sm text-gray-600">
                  {t("choose_timezone") || "Choose your timezone from the list"}
                </p>
              </div>
            </div>

            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            <button
              onClick={handleManualTimezone}
              disabled={loading}
              className="w-full mt-4 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? t("setting_up") || "Setting up..."
                : t("continue") || "Continue"}
            </button>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>
            {t("location_privacy_note") ||
              "Your location is only used to set timezone and is stored locally"}
          </p>
        </div>
      </div>
    </Page>
  );
}
