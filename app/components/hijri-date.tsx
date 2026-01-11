import { getCurrentGregorianDate } from 'lib/gregorian-date';
import { getCurrentHijriDate } from '../../lib/hijri-date';
import { HIJRI_MONTH_NAMES_EN } from '../../lib/hijri-months';
export default function HijriDateDisplay() {
  const hijriDate = getCurrentHijriDate();
  const gregorianDate = getCurrentGregorianDate();

  return (
    <div className="mb-4 mx-auto">
      <h1 className="text-xl font-bold">{hijriDate.date} {HIJRI_MONTH_NAMES_EN[hijriDate.month]} {hijriDate.year}</h1>
      <span className="text-sm">{gregorianDate.date} {gregorianDate.monthName} {gregorianDate.year}</span>
    </div>
  );
}
