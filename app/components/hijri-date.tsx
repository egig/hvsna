import { HIJRI_MONTH_NAMES_EN } from 'lib/hijri-months';
import { Link } from 'react-router';
export default function HijriDateDisplay({data, month, year}: {data: string, month: number, year: number}) {
  const l = `/y/${year}/m/${month}`

  return (
    <div className="mb-4 mx-auto">
      <h1 className="text-xl font-bold">{data} <Link to={l}>{HIJRI_MONTH_NAMES_EN[month]} {year}</Link></h1>
    </div>
  );
}
