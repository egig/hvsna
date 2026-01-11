import HijriDateDisplay from "../components/hijri-date";
import { getLocationFromIp } from '../../lib/location';
import { getPrayerTimes, type PrayerTimesResponse } from '../services/prayer-times';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getCurrentGregorianDate } from "lib/gregorian-date";
import { getClientIP, getDirectIP } from "lib/ip";

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

export async function loader({ request }: LoaderFunctionArgs): Promise<{ prayerTimes: PrayerTimesResponse }> {

  try {
    const location = await getLocation(request);
    const currentDate = getCurrentGregorianDate();
    const prayerTimes = await getPrayerTimes({
      date: currentDate.formatted,
      latitude: location.latitude,
      longitude: location.longitude,
      timezonestring: 'Asia/Jakarta' // TODO: get timezone from location
    });
    
    return { prayerTimes };
  } catch (error) {
    throw new Response('Failed to load prayer times', { status: 500 });
  }
}

function PraySlot({time, name}: {time: string, name: string}) {
  return <div className="mb-2 border-b pb-2 border-b-stone-300">
    <h2 className="text-base font-bold">{name}({time})</h2>
    </div>
}


export default function Index() {
  const data = useLoaderData<typeof loader>();
  const {Fajr, Dhuhr, Asr, Isha, Maghrib} = data.prayerTimes.data.timings;
  return <div className="p-6">
    <HijriDateDisplay />
    <PraySlot time={Maghrib} name="Maghrib" />
    <PraySlot time={Isha} name="Isha" />
    <PraySlot time={Fajr} name="Fajr" />
    <PraySlot time={Dhuhr} name="Dhuhr" />
    <PraySlot time={Asr} name="Asr" />
  </div>;
}