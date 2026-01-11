import { getCurrentGregorianDate } from 'lib/gregorian-date';
import { getCurrentHijriDate } from '../../lib/hijri-date';
import { HIJRI_MONTH_NAMES_EN } from '../../lib/hijri-months';
import { Link } from 'react-router';
export default function HijriTodayDisplay() {
  const hijriDate = getCurrentHijriDate();
  const gregorianDate = getCurrentGregorianDate();
  const l = `/y/${hijriDate.year}/m/${hijriDate.month}`

  return (
    <div className="mb-4 mx-auto">
      <h1 className="text-xl font-bold">{hijriDate.date} <Link to={l}>{HIJRI_MONTH_NAMES_EN[hijriDate.month]} {hijriDate.year}</Link></h1>
      <span className="text-sm">{gregorianDate.date} {gregorianDate.monthName} {gregorianDate.year}</span>
    </div>
  );
}
