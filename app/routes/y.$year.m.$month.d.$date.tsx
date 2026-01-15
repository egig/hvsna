import { getPrayerTimes, type PrayerTimesResponse } from '../services/prayer-times';
import { useLoaderData, type LoaderFunctionArgs } from 'react-router';
import DayView, { type DayViewProps } from "~/components/day-view";
import dayjs from 'dayjs';
import { getNextHijriDate, getPreviousHijriDate } from 'lib/hijri-date';
import { getLocationFromRequest } from '~/utils/route-loaders';
import { DEFAULT_TIMEZONE, PRAYER_TIMES_CONFIG } from '~/utils/config';

export async function loader({ request, params }: LoaderFunctionArgs): Promise<DayViewProps> {

  const date = Number(params.date);
  const month = Number(params.month);
  const year = Number(params.year);
  
  
  try {
    const location = await getLocationFromRequest(request);
    const d = `${year}-${month}-${date}`;
    // @ts-ignore
    const gregorianDate = dayjs(d, {hijri: true});

    const prayerTimes = await getPrayerTimes({
      // @ts-ignore
      date: gregorianDate.format('YYYY-MM-DD'),
      latitude: location.latitude,
      longitude: location.longitude,
      method: PRAYER_TIMES_CONFIG.method,
      shafaq: PRAYER_TIMES_CONFIG.shafaq,
      tune: PRAYER_TIMES_CONFIG.tune,
      timezonestring: DEFAULT_TIMEZONE,
      calendarMethod: PRAYER_TIMES_CONFIG.calendarMethod
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