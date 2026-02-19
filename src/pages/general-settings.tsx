import { Page } from "../modules/navigation";
import { Navbar } from "../modules/navigation";
import { useSettings } from "../hooks/useSettings";
import { useLanguageContext } from "../contexts/LanguageContext";
import { ALL_TIMEZONES, COMMON_TIMEZONES } from "../lib/timezones";
import { ListInputSelect } from "../components/ListInputSelect";

export default function GeneralSettings() {
  const { settings, setLanguage, loading, updateSettings } = useSettings();
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
