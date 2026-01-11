import { getCurrentHijriDate } from '../../lib/hijri-date';
import { HIJRI_MONTH_NAMES_EN } from '../../lib/hijri-months';

export default function HijriDateDisplay() {
  const hijriDate = getCurrentHijriDate();

  return (
    <div className="p-6 bg-white max-w-md mx-auto">
          {hijriDate.date} {HIJRI_MONTH_NAMES_EN[hijriDate.month]} {hijriDate.year}
    </div>
  );
}
