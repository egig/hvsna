/**
 * Day names in Arabic
 */
export const DAY_NAMES_AR = [
  "الأحد",
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
] as const;

/**
 * Day names in English
 */
export const DAY_NAMES_EN = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

/**
 * Short day names in English (3 letters)
 */
export const DAY_NAMES_EN_SHORT = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

/**
 * Type definitions for day names
 */
export type DayNameAr = (typeof DAY_NAMES_AR)[number];
export type DayNameEn = (typeof DAY_NAMES_EN)[number];
export type DayNameEnShort = (typeof DAY_NAMES_EN_SHORT)[number];
