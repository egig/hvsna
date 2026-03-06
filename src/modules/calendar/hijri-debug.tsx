import { useEffect } from "react";
import { useHijriDate } from "./hijri/use-hijri-date";
import log from "../../lib/logger";

export default function HijriDebug() {
  const { getToday } = useHijriDate();
  useEffect(() => {
    log.info("from hijri debug", getToday());
  }, []);
  return null;
}
