import { getPrayerTimes } from '../../lib/prayer-times';
import { redirect, useLoaderData, type LoaderFunctionArgs } from 'react-router';
import { getCurrentGregorianDate } from "lib/gregorian-date";
import { getCurrentHijriDate, getNextHijriDate, getPreviousHijriDate } from "lib/hijri-date";
import DayView, { type DayViewProps } from "~/components/day-view";
import { getLocationFromRequest } from '~/utils/route-loaders';
import { DEFAULT_TIMEZONE, PRAYER_TIMES_CONFIG } from '~/utils/config';

export async function loader({ request }: LoaderFunctionArgs) {
  return redirect("/0") 
}