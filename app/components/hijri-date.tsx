import { getCurrentGregorianDate } from 'lib/gregorian-date';
import { getCurrentHijriDate } from '../../lib/hijri-date';
import { HIJRI_MONTH_NAMES_EN } from '../../lib/hijri-months';

export default function HijriDateDisplay() {
  const hijriDate = getCurrentHijriDate();
  const gregorianDate = getCurrentGregorianDate();

  return (
    <div className="p-6 bg-white max-w-md mx-auto">
          {hijriDate.date} {HIJRI_MONTH_NAMES_EN[hijriDate.month]} {hijriDate.year}
          <br/>
          <span>{gregorianDate.date} {gregorianDate.monthName} {gregorianDate.year}</span>
    </div>
  );
}
