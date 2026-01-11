import { getLocationFromIp } from '../../lib/location';
import { getPrayerTimes, type PrayerTimesResponse } from '../services/prayer-times';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getClientIP, getDirectIP } from "lib/ip";
import DayView, { type DayViewProps } from "~/components/day-view";
import dayjs from 'dayjs';
import { getNextHijriDate, getPreviousHijriDate } from 'lib/hijri-date';

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

export async function loader({ request, params }: LoaderFunctionArgs): Promise<DayViewProps> {

  const date = Number(params.date);
  const month = Number(params.month);
  const year = Number(params.year);
  
  
  try {
    const location = await getLocation(request);
    const d = `${year}-${month}-${date}`;
    // @ts-ignore
    const gregorianDate = dayjs(d, {hijri: true});

    const prayerTimes = await getPrayerTimes({
      // @ts-ignore
      date: gregorianDate.format('YYYY-MM-DD'),
      latitude: location.latitude,
      longitude: location.longitude,
      timezonestring: 'Asia/Jakarta' // TODO: get timezone from location
    });

    const gDate = gregorianDate.date();
    const gMonth = gregorianDate.month() + 1;
    const gYear = gregorianDate.year();
    const dayName = gregorianDate.format('dddd');

    const prevDate = getPreviousHijriDate(year, month, date);
    const nextDate = getNextHijriDate(year, month, date);
    const prevLink = `/y/${prevDate.year}/m/${prevDate.month}/d/${prevDate.date}`;
    const nextLink = `/y/${nextDate.year}/m/${nextDate.month}/d/${nextDate.date}`;
    
    return { date, month, year, gDate, gMonth, gYear, dayName, ...prayerTimes.data.timings, prevLink, nextLink };
  } catch (error) {
    throw new Response('Failed to load prayer times', { status: 500 });
  }
}

export default function YMD() {
  const data = useLoaderData<typeof loader>();
  return (
    <DayView
      date={data.date}
      month={data.month}
      year={data.year}
      gDate={data.gDate}
      gMonth={data.gMonth}
      gYear={data.gYear}
      Maghrib={data.Maghrib}
      Isha={data.Isha}
      Fajr={data.Fajr}
      Dhuhr={data.Dhuhr}
      Asr={data.Asr}
      dayName={data.dayName}
      prevLink={data.prevLink}
      nextLink={data.nextLink}
    />
  );
}