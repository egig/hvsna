import { useState } from "react";
import { HvClock, HvRefreshCw, HvAlertTriangle } from "@/modules/icons";
import { Page } from "../../navigation";
import { Navbar } from "../../navigation";
import { SimpleTimePicker } from "../../components/simple-time-picker";
import Block from "../../components/block";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { getPrayerTimes } from "../../prayer-times";
import type { PrayerTimesFallback } from "../settings";
import { useSettings } from "../context";

const prayerTimeKeys: (keyof PrayerTimesFallback)[] = [
  "fajr",
  "sunrise",
  "dzuhr",
  "asr",
  "maghrib",
  "isha",
];

export default function PrayerTimeFallback() {
  const { t } = useLanguageContext();
  const { settings, updateSettings } = useSettings();
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesFallback>(
    settings.prayerTimesFallback || {
      fajr: "05:00",
      sunrise: "06:00",
      dzuhr: "12:00",
      asr: "15:00",
      maghrib: "18:00",
      isha: "19:00",
    }
  );
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState(false);

  const handleTimeChange = async (
    prayer: keyof PrayerTimesFallback,
    value: string
  ) => {
    const newPrayerTimes = { ...prayerTimes, [prayer]: value };
    setPrayerTimes(newPrayerTimes);
    await updateSettings({ prayerTimesFallback: newPrayerTimes });
  };

  const fetchUpdatedPrayerTimes = async () => {
    if (!settings.location) {
      setFetchError(
        t("location_required") ||
          "Location coordinates are required to fetch prayer times"
      );
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchSuccess(false);

    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await getPrayerTimes({
        date: today,
        latitude: settings.location.lat,
        longitude: settings.location.lng,
        timezonestring: settings.timezone,
      });

      const updatedPrayerTimes: PrayerTimesFallback = {
        fajr: response.data.timings.Fajr,
        sunrise: response.data.timings.Sunrise,
        dzuhr: response.data.timings.Dhuhr,
        asr: response.data.timings.Asr,
        maghrib: response.data.timings.Maghrib,
        isha: response.data.timings.Isha,
      };

      setPrayerTimes(updatedPrayerTimes);
      await updateSettings({ prayerTimesFallback: updatedPrayerTimes });
      setFetchSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setFetchSuccess(false), 3000);
    } catch (error) {
      setFetchError(
        t("fetch_prayer_times_error") || "Failed to fetch updated prayer times"
      );
      console.error("Error fetching prayer times:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const getPrayerName = (key: keyof PrayerTimesFallback) => {
    switch (key) {
      case "fajr":
        return t("fajr");
      case "sunrise":
        return t("sunrise");
      case "dzuhr":
        return t("dhuhr");
      case "asr":
        return t("asr");
      case "maghrib":
        return t("maghrib");
      case "isha":
        return t("isha");
      default:
        return key;
    }
  };

  return (
    <Page>
      <Navbar
        title={t("prayer_time_fallback") || "Prayer Time Fallback"}
        showBackButton
      />

      <Block>
        <div className="text-sm text-gray-500 mb-4">
          {t("prayer_fallback_explanation") ||
            "When your device is offline, the app will automatically use these saved prayer times to manage today's timeline instead of trying to fetch them from the internet."}

          <br />
          <br />
          {t("set_fallback_times") || "Set fallback times for each prayer"}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {prayerTimeKeys.map((prayer) => (
            <div key={prayer}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {getPrayerName(prayer)}
              </label>
              <SimpleTimePicker
                value={prayerTimes[prayer]}
                onChange={(value: string) => handleTimeChange(prayer, value)}
                placeholder={`Select ${getPrayerName(prayer)} time`}
                testId={`prayer-time-picker-${prayer}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={fetchUpdatedPrayerTimes}
            disabled={isFetching || !settings.location}
            className="flex items-center justify-center gap-2 text-sm w-full md:w-fit px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200 shadow-sm"
          >
            <HvRefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching
              ? t("fetching") || "Fetching..."
              : t("fetch_updated_prayer_times") || "Fetch Updated Prayer Times"}
          </button>

          {!settings.location && (
            <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <HvAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                {t("location_required_for_fetch") ||
                  "Location coordinates must be set in settings to fetch prayer times"}
              </div>
            </div>
          )}

          {fetchError && (
            <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <HvAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>{fetchError}</div>
            </div>
          )}

          {fetchSuccess && (
            <div className="flex items-start gap-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <HvClock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                {t("prayer_times_updated") ||
                  "Prayer times updated successfully"}
              </div>
            </div>
          )}
        </div>
      </Block>
    </Page>
  );
}
