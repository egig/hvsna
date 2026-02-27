import { useMemo } from "react";
import { useLanguageContext } from "../i18n/LanguageContext";

export interface useDateTranslationHelperOptions {
  initialDate?: Date;
}

export interface DateFormatterReturn {
  hijriMonthNames: string[];
  gregorianMonthNames: string[];
  dayNames: string[];
  weekDays: string[];
}

export function useDateTranslationHelper(): DateFormatterReturn {
  const { t } = useLanguageContext();
  const formattedData = useMemo(() => {
    // Get localized day names
    const dayNames = [
      t("friday"),
      t("saturday"),
      t("sunday"),
      t("monday"),
      t("tuesday"),
      t("wednesday"),
      t("thursday"),
    ];

    // Get localized Hijri month names
    const hijriMonthNames = [
      t("muharram"),
      t("safar"),
      t("rabi_al_awwal"),
      t("rabi_al_thani"),
      t("jumada_al_awwal"),
      t("jumada_al_thani"),
      t("rajab"),
      t("shaban"),
      t("ramadan"),
      t("shawwal"),
      t("dhu_al_qidah"),
      t("dhu_al_hijjah"),
    ];

    // Get localized Gregorian month names
    const gregorianMonthNames = [
      t("january"),
      t("february"),
      t("march"),
      t("april"),
      t("may"),
      t("june"),
      t("july"),
      t("august"),
      t("september"),
      t("october"),
      t("november"),
      t("december"),
    ];

    // Week days (short format for calendar headers - starting from Friday as per Hijri calendar)
    const weekDays = [
      t("friday").substring(0, 3),
      t("saturday").substring(0, 3),
      t("sunday").substring(0, 3),
      t("monday").substring(0, 3),
      t("tuesday").substring(0, 3),
      t("wednesday").substring(0, 3),
      t("thursday").substring(0, 3),
    ];

    return {
      hijriMonthNames,
      gregorianMonthNames,
      dayNames,
      weekDays,
    };
  }, [t]);

  return {
    hijriMonthNames: formattedData.hijriMonthNames,
    gregorianMonthNames: formattedData.gregorianMonthNames,
    dayNames: formattedData.dayNames,
    weekDays: formattedData.weekDays,
  };
}
