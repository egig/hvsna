import { useEffect } from "react";
import { useHijriDate } from "./hijri/use-hijri-date";

export default function HijriDebug() {
  const { getToday } = useHijriDate();
  useEffect(() => {
    console.log("from hijri debug", getToday());
  }, []);
  return null;
}
