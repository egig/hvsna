import { getLocationFromIp } from '../../lib/location';
import { getPrayerTimes } from '../services/prayer-times';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getCurrentGregorianDate } from "lib/gregorian-date";
import { getCurrentHijriDate, getNextHijriDate, getPreviousHijriDate } from "lib/hijri-date";
import { getClientIP, getDirectIP } from "lib/ip";
import DayView, { type DayViewProps } from "~/components/day-view";

async function getLocation(request: Request) {
   let ip = getClientIP(request);
   if (!ip) {
    ip = getDirectIP(request);
   }

   if (!ip) {
    return {
      latitude: 6.2001514,
      longitude: 106.829547
    }
   }

   const location = await getLocationFromIp(ip as string);
   return location;
}

export async function loader({ request }: LoaderFunctionArgs): Promise<DayViewProps> {

  try {
    const location = await getLocation(request);
    const currentDate = getCurrentGregorianDate();
    const prayerTimes = await getPrayerTimes({
      date: currentDate.formatted,
      latitude: location.latitude,
      longitude: location.longitude,
      timezonestring: 'Asia/Jakarta' // TODO: get timezone from location
    });


  const hijriDate = getCurrentHijriDate();
  const gregorianDate = getCurrentGregorianDate();
  const l = `/y/${hijriDate.year}/m/${hijriDate.month}`
  const {Fajr, Dhuhr, Asr, Isha, Maghrib} = prayerTimes.data.timings;

    const prevDate = getPreviousHijriDate(hijriDate.year, hijriDate.month, hijriDate.date);
    const nextDate = getNextHijriDate(hijriDate.year, hijriDate.month, hijriDate.date);
    const prevLink = `/y/${prevDate.year}/m/${prevDate.month}/d/${prevDate.date}`;
    const nextLink = `/y/${nextDate.year}/m/${nextDate.month}/d/${nextDate.date}`;
  
    return {date: hijriDate.date, month: hijriDate.month, year: hijriDate.year, gDate: gregorianDate.date, gMonth: gregorianDate.month, gYear: gregorianDate.year, Fajr, Dhuhr, Asr, Isha, Maghrib, prevLink, nextLink, dayName: hijriDate.dayName };
  } catch (error) {
    throw new Response('Failed to load prayer times', { status: 500 });
  }
}



export default function Index() {
  const data = useLoaderData<typeof loader>();
  const l = `/y/${data.year}/m/${data.month}`
  return <DayView date={data.date} month={data.month} year={data.year} gDate={data.gDate} gMonth={data.gMonth} gYear={data.gYear} Maghrib={ data.Maghrib} Isha={data.Isha} Fajr={data.Fajr} Dhuhr={data.Dhuhr} Asr={data.Asr} prevLink={data.prevLink} nextLink={data.nextLink} dayName={data.dayName} /> 
}