import { getLocationFromIp } from '../../lib/location';
import { getPrayerTimes, type PrayerTimesResponse } from '../services/prayer-times';
import { Link, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getClientIP, getDirectIP } from "lib/ip";
import DayView from "~/components/day-view";
import dayjs from 'dayjs';

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

export async function loader({ request, params }: LoaderFunctionArgs): Promise<{ prayerTimes: PrayerTimesResponse, date: number, month: number, year: number}> {

  const date = Number(params.date);
  const month = Number(params.month);
  const year = Number(params.year);
  
  
  try {
    const location = await getLocation(request);
    const d = `${year}-${month}-${date}`;

    const prayerTimes = await getPrayerTimes({
      date: d,
      latitude: location.latitude,
      longitude: location.longitude,
      timezonestring: 'Asia/Jakarta' // TODO: get timezone from location
    });

    
    return { prayerTimes, date, month, year };
  } catch (error) {
    throw new Response('Failed to load prayer times', { status: 500 });
  }
}

export default function YMD() {
  const data = useLoaderData<typeof loader>();
  const {Fajr, Dhuhr, Asr, Isha, Maghrib} = data.prayerTimes.data.timings;
  return <DayView date={data.date} month={data.month} year={data.year} gDate={data.gDate} gMonth={data.gMonth} gYear={data.gYear} Maghrib={Maghrib} Isha={Isha} Fajr={Fajr} Dhuhr={Dhuhr} Asr={Asr} />;
}