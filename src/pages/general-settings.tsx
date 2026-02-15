import { Page } from "../modules/navigation";
import { Navbar } from "../modules/navigation";
import { useSettings } from "../hooks/useSettings";
import { useLanguageContext } from "../contexts/LanguageContext";
import { ALL_TIMEZONES, COMMON_TIMEZONES } from "../lib/timezones";
import { ListInputSelect } from "../components/ListInputSelect";

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
      <div className="bg-white">
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

          <ListInputSelect
            label={t("timezone")}
            value={settings.timezone}
            onValueChange={handleTimezoneChange}
            disabled={loading}
            options={ALL_TIMEZONES.map((tz) => ({
              value: tz,
              label: tz,
            }))}
          />
        </div>
      </div>
    </Page>
  );
}
