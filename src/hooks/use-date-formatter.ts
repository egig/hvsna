import { useState, useMemo } from "react";
import { HijriDate } from "../lib/hijri";
import { useLanguageContext } from "../contexts/LanguageContext";

export interface UseDateFormatterOptions {
  initialDate?: Date;
}

export interface DateFormatterReturn {
  activeDate: HijriDate;
  setActiveDate: (date: HijriDate) => void;
  gregorianDate: Date;
  pageTitle: string;
  subTitle: string;
  // Calendar-specific localized data
  hijriMonthNames: string[];
  gregorianMonthNames: string[];
  dayNames: string[];
  weekDays: string[];
}

export function useDateFormatter(
  options: UseDateFormatterOptions = {},
): DateFormatterReturn {
  const { t } = useLanguageContext();
  const { initialDate = new Date() } = options;

  const [activeDate, setActiveDate] = useState(() =>
    HijriDate.fromDate(initialDate),
  );

  // TODO use timezone
  const gregorianDate = (new Date());

  const formattedData = useMemo(() => {
    // Get localized day names
    const dayNames = [
      t("sunday"),
      t("monday"),
      t("tuesday"),
      t("wednesday"),
      t("thursday"),
      t("friday"),
      t("saturday"),
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

    // Get day of week for Gregorian date
    const dayOfWeek = gregorianDate.getDay();

    // Format page title: "Day Month Year" (Hijri)
    const pageTitle = `${activeDate.day} ${hijriMonthNames[activeDate.month - 1]} ${activeDate.year}`;

    // Format subtitle: "DayName, Day Month Year" (Gregorian)
    const subTitle = `${dayNames[dayOfWeek]}, ${gregorianDate.getDate()} ${gregorianMonthNames[gregorianDate.getMonth()]} ${gregorianDate.getFullYear()}, ${gregorianDate.getHours()}:${gregorianDate.getMinutes()}`;

    return {
      pageTitle,
      subTitle,
      hijriMonthNames,
      gregorianMonthNames,
      dayNames,
      weekDays,
    };
  }, [activeDate, gregorianDate, t]);

  return {
    activeDate,
    setActiveDate,
    gregorianDate,
    pageTitle: formattedData.pageTitle,
    subTitle: formattedData.subTitle,
    hijriMonthNames: formattedData.hijriMonthNames,
    gregorianMonthNames: formattedData.gregorianMonthNames,
    dayNames: formattedData.dayNames,
    weekDays: formattedData.weekDays,
  };
}
