import { useState } from "react";
import { MapPin, Globe, ChevronRight, Languages } from "lucide-react";
import { Page } from "../navigation";
import { Navbar } from "../navigation";
import { useSettings } from "../settings/useSettings";
import { ALL_TIMEZONES } from "../../lib/timezones";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import type { Coordinate } from "src/modules/settings/settings";
import type { Language } from "src/modules/i18n/language";

export default function Onboarding() {
  const { t, language, setLanguage } = useLanguageContext();
  const { updateSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTimezone, setSelectedTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  const handleLanguageSelection = async (selectedLanguage: Language) => {
    setLoading(true);
    try {
      await setLanguage(selectedLanguage);
      setCurrentStep(2);
    } catch (error) {
      console.error("Failed to set language:", error);
    } finally {
      setLoading(false);
    }
  };

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

  const renderLanguageSelection = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("select_language") || "Select Language"}
        </h1>
        <p className="text-gray-600">
          {t("language_selection_description") ||
            "Choose your preferred language for the app"}
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => handleLanguageSelection("en")}
          disabled={loading}
          className={`w-full bg-white border rounded-lg p-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            language === "en"
              ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/5"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">English</h3>
            {language === "en" && (
              <div className="w-5 h-5 rounded-full bg-[var(--hvsna-primary-color)] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            )}
          </div>
        </button>

        <button
          onClick={() => handleLanguageSelection("id")}
          disabled={loading}
          className={`w-full bg-white border rounded-lg p-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            language === "id"
              ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/5"
              : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Bahasa Indonesia</h3>
            {language === "id" && (
              <div className="w-5 h-5 rounded-full bg-[var(--hvsna-primary-color)] flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white"></div>
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );

  const renderLocationSetup = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">
          {t("setup_location") || "Setup Location"}
        </h1>
        <p className="text-gray-600">
          {t("location_setup_description") ||
            "Choose how you want to set your timezone for accurate scheduling"}
        </p>
      </div>

      {/* Location Permission Option */}
      <button
        onClick={handleLocationPermission}
        disabled={loading}
        className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[var(--hvsna-primary-color)]/10 p-2 rounded-lg">
              <MapPin className="w-5 h-5 text-[var(--hvsna-primary-color)]" />
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
          <div className="bg-[var(--hvsna-primary-color)]/10 p-2 rounded-lg">
            <Globe className="w-5 h-5 text-[var(--hvsna-primary-color)]" />
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
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--hvsna-primary-color)] focus:border-[var(--hvsna-primary-color)]"
          disabled={loading}
        >
          {ALL_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <button
          onClick={handleManualTimezone}
          disabled={loading}
          className="w-full mt-4 bg-[var(--hvsna-primary-color)] text-white py-3 rounded-lg font-medium hover:bg-[var(--hvsna-primary-color-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? t("setting_up") || "Setting up..."
            : t("continue") || "Continue"}
        </button>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>
          {t("location_privacy_note") ||
            "Your location is only used to set timezone and is stored locally"}
        </p>
      </div>
    </div>
  );

  return (
    <Page>
      <Navbar 
        title={currentStep === 1 ? (t("welcome") || "Welcome") : (t("setup_location") || "Setup Location")} 
        showBackButton={currentStep === 2}
        customBackAction={() => setCurrentStep(1)}
      />

      <div className="p-6 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 1 
              ? "bg-[var(--hvsna-primary-color)] text-white" 
              : "bg-[var(--hvsna-primary-color)] text-white"
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${
            currentStep === 2 ? "bg-[var(--hvsna-primary-color)]" : "bg-gray-300"
          }`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            currentStep === 2 
              ? "bg-[var(--hvsna-primary-color)] text-white" 
              : "bg-gray-300 text-gray-600"
          }`}>
            2
          </div>
        </div>

        {currentStep === 1 ? renderLanguageSelection() : renderLocationSetup()}
      </div>
    </Page>
  );
}
