export interface PrayerTimesResponse {
  code: number;
  status: string;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Sunset: string;
      Maghrib: string;
      Isha: string;
      Imsak: string;
      Midnight: string;
      Firstthird: string;
      Lastthird: string;
    };
    date: {
      readable: string;
      timestamp: string;
      hijri: {
        date: string;
        format: string;
        day: string;
        weekday: {
          en: string;
          ar: string;
        };
        month: {
          number: number;
          en: string;
          ar: string;
          days: number;
        };
        year: string;
        designation: {
          abbreviated: string;
          expanded: string;
        };
        holidays: string[];
        adjustedHolidays: string[];
        method: string;
      };
      gregorian: {
        date: string;
        format: string;
        day: string;
        weekday: {
          en: string;
        };
        month: {
          number: number;
          en: string;
        };
        year: string;
        designation: {
          abbreviated: string;
          expanded: string;
        };
        lunarSighting: boolean;
      };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: {
        id: number;
        name: string;
        params: {
          Fajr: number;
          Isha: number;
        };
        location: {
          latitude: number;
          longitude: number;
        };
      };
      latitudeAdjustmentMethod: string;
      midnightMode: string;
      school: string;
      offset: {
        Imsak: number;
        Fajr: number;
        Sunrise: number;
        Dhuhr: number;
        Asr: number;
        Sunset: number;
        Maghrib: number;
        Isha: number;
        Midnight: number;
      };
    };
  };
}

export interface PrayerTimesParams {
  date: string;
  latitude: number;
  longitude: number;
  method?: number;
  shafaq?: string;
  tune?: string;
  timezonestring?: string;
  calendarMethod?: string;
}

export async function getPrayerTimes(
  params: PrayerTimesParams
): Promise<PrayerTimesResponse> {
  const {
    date,
    latitude,
    longitude,
    method = 20,
    shafaq = "general",
    tune = "0,0,0,0,0,0,0,0,0",
    timezonestring = "Asia/Jakarta",
    calendarMethod = "UAQ",
  } = params;

  const baseUrl = "https://api.aladhan.com/v1/timings";
  const url = new URL(`${baseUrl}/${date}`);

  url.searchParams.append("latitude", latitude.toString());
  url.searchParams.append("longitude", longitude.toString());
  url.searchParams.append("method", method.toString());
  url.searchParams.append("shafaq", shafaq);
  url.searchParams.append("tune", tune);
  url.searchParams.append("timezonestring", timezonestring);
  url.searchParams.append("calendarMethod", calendarMethod);

  try {
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PrayerTimesResponse = await response.json();
    return data;
  } catch (error) {
    throw new Error(
      `Failed to fetch prayer times: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
