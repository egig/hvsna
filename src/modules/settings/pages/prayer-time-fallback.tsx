import { useState } from "react";
import { Clock, Wifi, WifiOff } from "lucide-react";
import { Page } from "../../navigation";
import { Navbar } from "../../navigation";
import { FormInput } from "../../../ui/form-input";
import { SimpleTimePicker } from "../../../ui/simple-time-picker";
import Block from "../../../ui/block";
import BlockTitle from "../../../ui/block-title";
import { useSettings } from "../useSettings";
import { useLanguageContext } from "../../i18n/LanguageContext";
import type { PrayerTimesFallback } from "../settings";

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
    },
  );

  const handleTimeChange = async (
    prayer: keyof PrayerTimesFallback,
    value: string,
  ) => {
    const newPrayerTimes = { ...prayerTimes, [prayer]: value };
    setPrayerTimes(newPrayerTimes);
    await updateSettings({ prayerTimesFallback: newPrayerTimes });
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
        <div className="flex items-center gap-3 mb-4">
          <WifiOff className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
              {t("offline_mode") || "Offline Mode"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {t("prayer_fallback_description") ||
                "These prayer times will be used when the app is offline and cannot fetch real-time prayer schedules."}
            </p>
          </div>
        </div>
      </Block>

      <Block>
        <BlockTitle>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {t("prayer_times") || "Prayer Times"}
          </div>
        </BlockTitle>
        <div className="text-sm text-gray-500 mb-4">
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
              />
            </div>
          ))}
        </div>
      </Block>

      <Block>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                {t("how_it_works") || "How it works"}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                {t("prayer_fallback_explanation") ||
                  "When your device is offline, the app will automatically use these saved prayer times instead of trying to fetch them from the internet. This ensures your prayer reminders and schedules continue to work even without an internet connection."}
              </p>
            </div>
          </div>
        </div>
      </Block>
    </Page>
  );
}
