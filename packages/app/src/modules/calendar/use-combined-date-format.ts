import { useCallback } from "react";
import dayjs from "dayjs";
import { useHijriDate } from "./hijri/use-hijri-date";
import { useLanguageContext } from "../i18n/LanguageContext";
import { useDateTranslationHelper } from "./use-date-translation-helper";
import { HIJRI_MONTH_NAMES_EN_SHORT } from "./hijri-months";

export interface FormatCombinedDateOptions {
  includeYear?: boolean;
}

export interface UseCombinedDateFormatReturn {
  formatCombinedDate: (
    date: Date | number,
    options?: FormatCombinedDateOptions
  ) => string;
}

/**
 * "15 Sep / 24 Rabi II" style Gregorian/Hijri pairing.
 * English uses the short "Rabi II" form; other locales fall back to the
 * full localized Hijri month name since there's no established abbreviation.
 */
export function useCombinedDateFormat(): UseCombinedDateFormatReturn {
  const { toHijriDate } = useHijriDate();
  const { language } = useLanguageContext();
  const { hijriMonthNames } = useDateTranslationHelper();

  const formatCombinedDate = useCallback(
    (date: Date | number, options?: FormatCombinedDateOptions): string => {
      const greg = dayjs(date);
      const hijri = toHijriDate(greg.toDate());
      const hijriMonthName =
        language === "en"
          ? HIJRI_MONTH_NAMES_EN_SHORT[hijri.month - 1]
          : hijriMonthNames[hijri.month - 1];

      const gregPart = options?.includeYear
        ? greg.format("D MMM YYYY")
        : greg.format("D MMM");
      const hijriPart = options?.includeYear
        ? `${hijri.day} ${hijriMonthName} ${hijri.year}`
        : `${hijri.day} ${hijriMonthName}`;

      return `${gregPart} / ${hijriPart}`;
    },
    [toHijriDate, language, hijriMonthNames]
  );

  return { formatCombinedDate };
}
