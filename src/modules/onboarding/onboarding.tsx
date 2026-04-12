import { useState } from "react";
import {
  HvMapPin,
  HvGlobe,
  HvChevronRight,
  HvLanguages,
  HvChevronsUpDown,
  HvBell,
} from "@/modules/icons";
import { Page, Navbar } from "../navigation";
import { TimezonePickerModal } from "../components/timezone-picker-modal";
import { useSettings } from "../settings/useSettings";
import { useLanguageContext } from "src/modules/i18n/LanguageContext";
import { createNotificationsProvider } from "../../infra";
import type { Coordinate } from "src/modules/settings/settings";
import type { Language } from "src/modules/i18n/language";
import logger from "src/modules/logger";

export default function Onboarding() {
  const { t, language, setLanguage } = useLanguageContext();
  const { updateSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedTimezone, setSelectedTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  const notificationsProvider = createNotificationsProvider();

  const handleLanguageSelection = async (selectedLanguage: Language) => {
    setLoading(true);
    try {
      await setLanguage(selectedLanguage);
      setCurrentStep(2);
    } catch (error) {
      logger.error("Failed to set language:", error);
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
      });

      // Move to notification step
      setCurrentStep(3);
      setLoading(false);
    } catch (error) {
      logger.error("Location access denied:", error);
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
      });

      // Move to notification step
      setCurrentStep(3);
      setLoading(false);
    } catch (error) {
      logger.error("Failed to save settings:", error);
      setLoading(false);
    }
  };

  const handleNotificationPermission = async (enable: boolean) => {
    setLoading(true);
    try {
      let notificationEnabled = false;

      if (enable) {
        const permission = await notificationsProvider.requestPermissions();
        notificationEnabled = permission.state === "granted";
      }

      await updateSettings({
        notifications: notificationEnabled,
        onboardedAt: Date.now(),
      });

      // Redirect to main app
      window.location.href = "/";
    } catch (error) {
      logger.error("Failed to handle notification permission:", error);
      setLoading(false);
    }
  };

  const checkNotificationPermission = async () => {
    try {
      const permission = await notificationsProvider.checkPermissions();
      return permission.state;
    } catch (error) {
      logger.error("Failed to check notification permission:", error);
      return "unknown";
    }
  };

  const renderLanguageSelection = () => (
    <div className="space-y-4" data-testid="language-selection-step">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="welcome-title">
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
          data-testid="language-en"
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
          data-testid="language-id"
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
    <div className="space-y-4" data-testid="location-setup-step">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="location-title">
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
        data-testid="use-current-location"
        className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[var(--hvsna-primary-color)]/10 p-2 rounded-lg">
              <HvMapPin className="w-5 h-5 text-[var(--hvsna-primary-color)]" />
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
          <HvChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </button>

      {/* Manual Timezone Selection */}
      <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="manual-timezone-section">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-[var(--hvsna-primary-color)]/10 p-2 rounded-lg">
            <HvGlobe className="w-5 h-5 text-[var(--hvsna-primary-color)]" />
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

        <button
          type="button"
          onClick={() => setIsTimezoneModalOpen(true)}
          disabled={loading}
          data-testid="timezone-picker-button"
          className="w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg hover:border-[var(--hvsna-primary-color)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
        >
          <span className="text-sm text-gray-800" data-testid="selected-timezone">
            {selectedTimezone.replace(/_/g, " ")}
          </span>
          <HvChevronsUpDown className="w-4 h-4 text-gray-400 shrink-0" />
        </button>

        <TimezonePickerModal
          isOpen={isTimezoneModalOpen}
          onClose={() => setIsTimezoneModalOpen(false)}
          value={selectedTimezone}
          onSelect={setSelectedTimezone}
          title={t("select_timezone_manually") || "Select Timezone"}
          data-testid="timezone-modal"
        />

        <button
          onClick={handleManualTimezone}
          disabled={loading}
          data-testid="continue-timezone"
          className="w-full mt-4 bg-[var(--hvsna-primary-color)] text-white py-3 rounded-lg font-medium hover:bg-[var(--hvsna-primary-color-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? t("setting_up") || "Setting up..."
            : t("continue") || "Continue"}
        </button>
      </div>

      <div className="text-center text-sm text-gray-500" data-testid="location-privacy-note">
        <p>
          {t("location_privacy_note") ||
            "Your location is only used to set timezone and is stored locally"}
        </p>
      </div>
    </div>
  );

  const renderNotificationSetup = () => (
    <div className="space-y-4" data-testid="notification-setup-step">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="notification-title">
          {t("setup_notifications") || "Setup Notifications"}
        </h1>
        <p className="text-gray-600">
          {t("notification_setup_description") ||
            "Enable notifications to get reminders for your tasks"}
        </p>
      </div>

      {/* Enable Notifications Option */}
      <button
        onClick={() => handleNotificationPermission(true)}
        disabled={loading}
        data-testid="enable-notifications"
        className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-[var(--hvsna-primary-color)]/10 p-2 rounded-lg">
              <HvBell className="w-5 h-5 text-[var(--hvsna-primary-color)]" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-900">
                {t("enable_notifications") || "Enable Notifications"}
              </h3>
              <p className="text-sm text-gray-600">
                {t("get_task_reminders") ||
                  "Get reminders for your tasks before they're due"}
              </p>
            </div>
          </div>
          <HvChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </button>

      {/* Skip Notifications Option */}
      <div className="bg-white border border-gray-200 rounded-lg p-4" data-testid="skip-notifications-section">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gray-100 p-2 rounded-lg">
            <HvChevronsUpDown className="w-5 h-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {t("skip_notifications") || "Skip Notifications"}
            </h3>
            <p className="text-sm text-gray-600">
              {t("skip_notifications_description") ||
                "You can enable notifications later in settings"}
            </p>
          </div>
        </div>

        <button
          onClick={() => handleNotificationPermission(false)}
          disabled={loading}
          data-testid="skip-notifications"
          className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? t("continuing") || "Continuing..." : t("skip") || "Skip"}
        </button>
      </div>

      <div className="text-center text-sm text-gray-500" data-testid="notification-privacy-note">
        <p>
          {t("notification_privacy_note") ||
            "Notifications are only used for task reminders and are stored locally"}
        </p>
      </div>
    </div>
  );

  return (
    <Page>
      <Navbar
        title={
          currentStep === 1
            ? t("welcome") || "Welcome"
            : currentStep === 2
              ? t("setup_location") || "Setup Location"
              : t("setup_notifications") || "Setup Notifications"
        }
        showBackButton={currentStep === 2 || currentStep === 3}
        customBackAction={() => setCurrentStep(currentStep - 1)}
        data-testid="navbar-title"
      />

      <div className="p-6 space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-2" data-testid="step-indicator">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 1
                ? "bg-[var(--hvsna-primary-color)] text-white"
                : "bg-[var(--hvsna-primary-color)] text-white"
            }`}
            data-testid="step-1"
          >
            1
          </div>
          <div
            className={`w-16 h-1 ${
              currentStep === 2 || currentStep === 3
                ? "bg-[var(--hvsna-primary-color)]"
                : "bg-gray-300"
            }`}
            data-testid="progress-bar-1-2"
          ></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 2 || currentStep === 3
                ? "bg-[var(--hvsna-primary-color)] text-white"
                : "bg-gray-300 text-gray-600"
            }`}
            data-testid="step-2"
          >
            2
          </div>
          <div
            className={`w-16 h-1 ${
              currentStep === 3
                ? "bg-[var(--hvsna-primary-color)]"
                : "bg-gray-300"
            }`}
            data-testid="progress-bar-2-3"
          ></div>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === 3
                ? "bg-[var(--hvsna-primary-color)] text-white"
                : "bg-gray-300 text-gray-600"
            }`}
            data-testid="step-3"
          >
            3
          </div>
        </div>

        {currentStep === 1
          ? renderLanguageSelection()
          : currentStep === 2
            ? renderLocationSetup()
            : renderNotificationSetup()}
      </div>
    </Page>
  );
}
