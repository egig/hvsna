import PrayerTimesTable from "~/components/prayer-times";
import HijriDateDisplay from "../components/hijri-date";

export default function Index() {
  return <>
    <HijriDateDisplay />
    <PrayerTimesTable />
  </>;
}