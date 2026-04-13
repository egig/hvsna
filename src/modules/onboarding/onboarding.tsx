import { useState } from "react";
import { HvChevronLeft, HvChevronsUpDown } from "@/modules/icons";
import { Page } from "../navigation";
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
    Intl.DateTimeFormat().resolvedOptions().timeZone
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
        }
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

      await updateSettings({
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        coordinate,
        locationResolveType: "auto",
        locationResolvedAt: new Date().toISOString(),
      });

      setCurrentStep(3);
    } catch (error) {
      logger.error("Location access denied:", error);
    } finally {
      setLoading(false);
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
      setCurrentStep(3);
    } catch (error) {
      logger.error("Failed to save settings:", error);
    } finally {
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
      window.location.href = "/";
    } catch (error) {
      logger.error("Failed to handle notification permission:", error);
      setLoading(false);
    }
  };

  const renderLanguageSelection = () => (
    <div className="space-y-4" data-testid="language-selection-step">
      <div className="text-center">
        <h1
          className="text-xl font-bold text-gray-900"
          data-testid="welcome-title"
        >
          {t("select_language") || "Select Language"}
        </h1>
      </div>

      <div className="space-y-2">
        {(["en", "id"] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => handleLanguageSelection(lang)}
            disabled={loading}
            data-testid={`language-${lang}`}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              language === lang
                ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]/5"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <span className="font-medium text-gray-900">
              {lang === "en" ? "English" : "Bahasa Indonesia"}
            </span>
            <div
              className={`w-4 h-4 rounded-full border-2 transition-colors ${
                language === lang
                  ? "border-[var(--hvsna-primary-color)] bg-[var(--hvsna-primary-color)]"
                  : "border-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const renderLocationSetup = () => (
    <div className="space-y-2" data-testid="location-setup-step">
      <div className="text-center space-y-1">
        <h1
          className="text-xl font-bold text-gray-900"
          data-testid="location-title"
        >
          {t("setup_location") || "Setup Location"}
        </h1>
        <p className="text-sm text-gray-500">
          {t("location_setup_description") ||
            "How would you like to set your timezone?"}
        </p>
      </div>

      <button
        onClick={handleLocationPermission}
        disabled={loading}
        data-testid="use-current-location"
        className="w-full p-4 rounded-xl border-2 border-gray-200 bg-white text-left font-medium text-gray-900 hover:border-[var(--hvsna-primary-color)] hover:bg-[var(--hvsna-primary-color)]/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t("use_current_location") || "Use Current Location"}
      </button>

      <div className="space-y-2" data-testid="manual-timezone-section">
        <button
          type="button"
          onClick={() => setIsTimezoneModalOpen(true)}
          disabled={loading}
          data-testid="timezone-picker-button"
          className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span
            className="font-medium text-gray-900"
            data-testid="selected-timezone"
          >
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
          className="w-full bg-[var(--hvsna-primary-color)] text-white py-3 rounded-xl font-medium hover:bg-[var(--hvsna-primary-color-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? t("setting_up") || "Setting up..."
            : t("continue") || "Continue"}
        </button>
      </div>

      <button
        onClick={() => setCurrentStep(1)}
        disabled={loading}
        data-testid="back-button"
        className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t("back") || "Back"}
      </button>
    </div>
  );

  const renderNotificationSetup = () => (
    <div className="space-y-4" data-testid="notification-setup-step">
      <div className="text-center space-y-1">
        <h1
          className="text-xl font-bold text-gray-900"
          data-testid="notification-title"
        >
          {t("setup_notifications") || "Setup Notifications"}
        </h1>
        <p className="text-sm text-gray-500">
          {t("notification_setup_description") ||
            "Get reminders for your tasks and prayer times"}
        </p>
      </div>

      <button
        onClick={() => handleNotificationPermission(true)}
        disabled={loading}
        data-testid="enable-notifications"
        className="w-full bg-[var(--hvsna-primary-color)] text-white py-3 rounded-xl font-medium hover:bg-[var(--hvsna-primary-color-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t("enable_notifications") || "Enable Notifications"}
      </button>

      <button
        onClick={() => handleNotificationPermission(false)}
        disabled={loading}
        data-testid="skip-notifications"
        className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t("skip") || "Skip for now"}
      </button>

      <button
        onClick={() => setCurrentStep(2)}
        disabled={loading}
        data-testid="back-button"
        className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {t("back") || "Back"}
      </button>
    </div>
  );

  return (
    <Page>
      <div className="flex flex-col h-screen px-6 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center pt-12 pb-6">
          <img
            src="/icon-192.png"
            alt="Hvsna"
            className="w-14 h-14 rounded-2xl"
          />
        </div>

        <div className="flex-1">
          {currentStep === 1
            ? renderLanguageSelection()
            : currentStep === 2
            ? renderLocationSetup()
            : renderNotificationSetup()}
        </div>

        <div
          className="flex items-center justify-center gap-1.5 py-8"
          data-testid="step-indicator"
        >
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              data-testid={`step-${step}`}
              className={`rounded-full transition-all duration-300 ${
                step === currentStep
                  ? "w-4 h-1.5 bg-[var(--hvsna-primary-color)]"
                  : step < currentStep
                  ? "w-1.5 h-1.5 bg-[var(--hvsna-primary-color)]/40"
                  : "w-1.5 h-1.5 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </Page>
  );
}
