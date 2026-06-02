import { Page, Navbar } from "../../navigation";
import { useSettings } from "..";
import { useLanguageContext } from "../../i18n/LanguageContext";
import { ListInputSelect } from "../../components/list-input-select";
import { HijriDate } from "../../calendar/hijri";
import { getCoordinateFromTimezone } from "@/config";

export default function HijriDateSettings() {
  const { settings, loading, updateSettings } = useSettings();
  const { t } = useLanguageContext();

  const monthOffsets = settings.hijriMonthOffsets ?? {};
  const _fallback = getCoordinateFromTimezone(settings.timezone ?? "");
  const latitude = settings.location?.lat || _fallback.latitude;
  const longitude = settings.location?.lng || _fallback.longitude;

  // Calculate today's date with and without offsets for preview
  const todayWithoutOffset = HijriDate.fromDate(
    latitude,
    longitude,
    new Date(),
    {
      monthOffsets: {},
    }
  );
  const todayWithOffset = HijriDate.fromDate(latitude, longitude, new Date(), {
    monthOffsets,
  });

  const hijriMonths = [
    { key: 1, nameKey: "muharram" },
    { key: 2, nameKey: "safar" },
    { key: 3, nameKey: "rabi_al_awwal" },
    { key: 4, nameKey: "rabi_al_thani" },
    { key: 5, nameKey: "jumada_al_awwal" },
    { key: 6, nameKey: "jumada_al_thani" },
    { key: 7, nameKey: "rajab" },
    { key: 8, nameKey: "shaban" },
    { key: 9, nameKey: "ramadan" },
    { key: 10, nameKey: "shawwal" },
    { key: 11, nameKey: "dhu_al_qidah" },
    { key: 12, nameKey: "dhu_al_hijjah" },
  ];

  const handleMonthOffsetChange = async (month: number, newOffset: number) => {
    const updatedOffsets = {
      ...monthOffsets,
      [month]: newOffset === 0 ? undefined : newOffset,
    };
    // Remove keys with undefined values
    Object.keys(updatedOffsets).forEach((key) => {
      if (updatedOffsets[key as unknown as number] === undefined) {
        delete updatedOffsets[key as unknown as number];
      }
    });
    await updateSettings({ hijriMonthOffsets: updatedOffsets });
  };

  const offsetOptions = [
    { value: "-2", label: t("days_offset_negative", { count: 2 }) },
    { value: "-1", label: t("day_offset_negative") },
    { value: "0", label: t("no_offset") },
    { value: "1", label: t("day_offset_positive") },
    { value: "2", label: t("days_offset_positive", { count: 2 }) },
  ];

  const datesAreDifferent =
    todayWithoutOffset.day !== todayWithOffset.day ||
    todayWithoutOffset.month !== todayWithOffset.month ||
    todayWithoutOffset.year !== todayWithOffset.year;

  return (
    <Page>
      <Navbar title={t("hijri_date_settings")} showBackButton={true} />

      {/* Preview Card */}
      <div className="bg-white p-4 m-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Today's Hijri Date Preview
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Without offset:</span>
            <span className="font-medium">
              {todayWithoutOffset.format("DD MMMM YYYY")}
            </span>
          </div>
          {datesAreDifferent && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">With offset:</span>
              <span className="font-medium text-blue-600">
                {todayWithOffset.format("DD MMMM YYYY")}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Month Offset Settings */}
      <div className="bg-white">
        {hijriMonths.map((month, index) => {
          const currentOffset = monthOffsets[month.key] ?? 0;
          const nextMonth = hijriMonths[index + 1];
          const nextOffset = nextMonth ? monthOffsets[nextMonth.key] ?? 0 : 0;
          const gap = Math.abs(currentOffset - nextOffset);
          const showWarning = gap > 1 && index < 11;

          return (
            <div
              key={month.key}
              className="border-b border-gray-200 last:border-b-0"
            >
              <ListInputSelect
                label={t(month.nameKey)}
                value={currentOffset.toString()}
                onValueChange={(value) =>
                  handleMonthOffsetChange(month.key, parseInt(value))
                }
                disabled={loading}
                options={offsetOptions}
              />
              {showWarning && (
                <div className="px-4 pb-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-2">
                    <p className="text-xs text-amber-800">
                      {t("hijri_offset_gap_warning")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}
