/**
 * Hijri (Islamic) month names in Arabic
 */
export const HIJRI_MONTH_NAMES = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الثاني',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة'
] as const;

/**
 * Hijri month names in English transliteration
 */
export const HIJRI_MONTH_NAMES_EN = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhu al-Qidah',
  'Dhu al-Hijjah'
] as const;

/**
 * Type definitions for Hijri months
 */
export type HijriMonth = typeof HIJRI_MONTH_NAMES[number];
export type HijriMonthEn = typeof HIJRI_MONTH_NAMES_EN[number];
