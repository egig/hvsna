import { Page } from "../modules/navigation";
import { Navbar } from "../modules/navigation";
import { useSettings } from "../hooks/useSettings";
import { useLanguageContext } from "../contexts/LanguageContext";
import { ALL_TIMEZONES, COMMON_TIMEZONES } from "../lib/timezones";

export default function GeneralSettings() {
  const { settings, setLanguage, loading, updateSettings } = useSettings();
  const { t } = useLanguageContext();

  const handleLanguageChange = async (newLanguage: "en" | "id") => {
    // console.log(newLanguage)
    await updateSettings({ language: newLanguage });
    // await setLanguage(newLanguage);
  };

  const handleTimezoneChange = async (newTimezone: string) => {
    await updateSettings({ timezone: newTimezone });
  };

  return (
    <Page>
      <Navbar title={t("general")} showBackButton={true} />
      <div className="bg-white p-4">
        <div className="space-y-4">
          <div className="pb-4">
            <h2 className="text-lg font-semibold mb-2">
              {t("general_settings")}
            </h2>
            <p className="text-gray-600">{t("general_settings_subtitle")}</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{t("language")}</span>
                {loading && (
                  <span className="text-sm text-gray-500">Loading...</span>
                )}
              </div>
              <div className="flex gap-2">
                <select
                  value={settings.language}
                  onChange={(e) =>
                    handleLanguageChange(e.target.value as "en" | "id")
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] focus:border-transparent"
                  disabled={loading}
                >
                  <option value="en">{t("english")}</option>
                  <option value="id">{t("bahasa")}</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{t("timezone")}</span>
                {loading && (
                  <span className="text-sm text-gray-500">Loading...</span>
                )}
              </div>
              <select
                value={settings.timezone}
                onChange={(e) => handleTimezoneChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--hvsna-primary-color)] focus:border-transparent"
                disabled={loading}
              >
                {ALL_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
